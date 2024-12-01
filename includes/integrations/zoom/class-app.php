<?php
/**
 * App class.
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Zoom;

use Illuminate\Support\Arr;
use QuillBooking\Models\Calendar_Model;

/**
 * App class.
 *
 * @since 1.0.0
 */
class App {

	/**
	 * Provider
	 *
	 * @var Integration
	 */
	protected $integration;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration Provider.
	 */
	public function __construct( $integration ) {
		$this->integration = $integration;

		add_action( 'admin_init', array( $this, 'maybe_add_settings' ) );
	}

	/**
	 * Redirect the user to authorization page
	 *
	 * @param int   $host_id Host ID.
	 * @param array $app_credentials App credentials.
	 *
	 * @return void
	 */
	public function get_auth_uri( $host_id, $app_credentials = array() ) {
		if ( empty( $host_id ) ) {
			return new \WP_Error( 'no_host_id', esc_html__( 'No host ID found!', 'quillbooking' ) );
		}

		if ( empty( $app_credentials ) ) {
			$app_credentials = $this->get_app_credentials();
		}

		if ( empty( $app_credentials ) ) {
			return new \WP_Error( 'no_app_credentials', esc_html__( 'No app credentials found!', 'quillbooking' ) );
		}

		$auth_url = add_query_arg(
			array(
				'response_type' => 'code',
				'client_id'     => $app_credentials['client_id'],
				'redirect_uri'  => urlencode( $this->get_redirect_uri() ),
				'state'         => "quillbooking-zm-{$host_id}",
			),
			'https://zoom.us/oauth/authorize'
		);

		return $auth_url;
	}

	/**
	 * Add settings after authorization
	 *
	 * @return void
	 */
	public function maybe_add_settings() {
		$state = $_GET['state'] ?? '';
		if ( strpos( $state, 'quillbooking-zm-' ) !== 0 ) {
			return;
		}

		$host_id  = str_replace( 'quillbooking-zm-', '', $state );
		$calendar = Calendar_Model::find( $host_id );
		if ( empty( $calendar ) ) {
			return;
		}

		// ensure authorize code.
		$code = $_GET['code'] ?? null;
		if ( empty( $code ) ) {
			echo esc_html__( 'Error, There is no authorize code passed!', 'quillbooking' );
			exit;
		}

		$app_credentials = $this->get_app_credentials();

		// get tokens.
		$tokens = $this->get_tokens(
			array(
				'grant_type'    => 'authorization_code',
				'code'          => $code,
				'client_id'     => $app_credentials['client_id'],
				'client_secret' => $app_credentials['client_secret'],
				'redirect_uri'  => $this->get_redirect_uri(),
			)
		);
		error_log( 'tokens: ' . wp_json_encode( $tokens ) );
		if ( empty( $tokens ) ) {
			echo esc_html__( 'Error, Cannot get tokens!', 'quillbooking' );
			exit;
		}

		$account_data = new API( $tokens['access_token'], $tokens['refresh_token'], $this );
		$account_data = $account_data->get_account_info();
		error_log( 'account_data: ' . wp_json_encode( $account_data ) );
		if ( ! $account_data['success'] ) {
			echo esc_html__( 'Error, Cannot get account data!', 'quillbooking' );
			exit;
		}

		$account      = $account_data;
		$account_id   = Arr::get( $account, 'data.id' );
		$account_name = Arr::get( $account, 'data.email' );
		if ( empty( $account_id ) || empty( $account_name ) ) {
			echo esc_html__( 'Error, Cannot get account ID!', 'quillbooking' );
			exit;
		}

		$this->integration->set_host( $host_id );
		$this->integration->accounts->add_account(
			$account_id,
			array(
				'name'   => $account_name,
				'tokens' => $tokens,
				'config' => array(),
			)
		);

		// Redirect to settings page.
		echo esc_html__( 'Success, Account added!', 'quillbooking' );
		// wp_redirect(
		// admin_url(
		// "admin.php?page=quillbooking&path=integrations&id={$this->integration->slug}&tab=success"
		// )
		// );
		exit;
	}

	/**
	 * Refresh tokens
	 *
	 * @param string|null $refresh_token Refresh token.
	 * @param string|null $account_id Account ID.
	 * @return array|false|WP_Error
	 */
	public function refresh_tokens( $refresh_token = null, $account_id = null ) {
		if ( empty( $refresh_token ) ) {
			return false;
		}

		$app_credentials = $this->get_app_credentials();
		$refeshed_tokens = $this->get_tokens(
			array(
				'client_id'     => Arr::get( $app_credentials, 'client_id' ),
				'client_secret' => Arr::get( $app_credentials, 'client_secret' ),
				'grant_type'    => 'refresh_token',
				'refresh_token' => $refresh_token,
			)
		);

		if ( empty( $refeshed_tokens ) ) {
			return false;
		}

		$account_data           = $this->integration->accounts->get_account( $account_id );
		$tokens                 = Arr::get( $account_data, 'tokens', array() );
		$tokens['access_token'] = Arr::get( $refeshed_tokens, 'access_token' );

		$this->integration->accounts->update_account(
			$account_id,
			array(
				'tokens' => $tokens,
			)
		);

		return $tokens;
	}

	/**
	 * Get tokens
	 *
	 * @param array $query Query to get tokens.
	 * @return boolean|array
	 */
	public function get_tokens( $query ) {
		$response = wp_remote_post(
			'https://zoom.us/oauth/token',
			array(
				'body'    => $query,
				'headers' => array(
					'Authorization' => $this->get_authorization_header(),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$tokens = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( empty( $tokens['access_token'] ) ) {

			// log in case of first request.
			if ( $query['grant_type'] === 'authorization_code' && empty( $tokens['refresh_token'] ) ) {
				return false;
			}

			return false;
		}

		return $tokens;
	}

	/**
	 * Get app credentials
	 *
	 * @return array|false Array of client_id & client_secret. false on failure.
	 */
	public function get_app_credentials() {
		$app_settings = $this->integration->get_setting( 'app' ) ?? array();
		if ( empty( $app_settings['client_id'] ) || empty( $app_settings['client_secret'] ) ) {
			return false;
		} else {
			return $app_settings;
		}
	}

	/**
	 * Get Authorization header
	 *
	 * @return string
	 */
	private function get_authorization_header() {
		$app_settings = $this->integration->get_setting( 'app' ) ?? array();
		return 'Basic ' . base64_encode( $app_settings['client_id'] . ':' . $app_settings['client_secret'] );
	}

	/**
	 * Get redirect uri
	 *
	 * @return string
	 */
	public function get_redirect_uri() {
		return admin_url( 'admin.php' ); // TODO: use https schema?
	}

}
