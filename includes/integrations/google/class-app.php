<?php
/**
 * App class.
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Google;

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

		$scopes = array(
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar.readonly',
			'https://www.googleapis.com/auth/calendar.events',
		);

		$auth_url = add_query_arg(
			array(
				'response_type' => 'code',
				'client_id'     => $app_credentials['client_id'],
				'scope'         => urlencode_deep( implode( ' ', $scopes ) ),
				'redirect_uri'  => urlencode( $this->get_redirect_uri() ),
				'state'         => "quillbooking-g-{$host_id}",
				'prompt'        => 'consent',
				'access_type'   => 'offline',
			),
			'https://accounts.google.com/o/oauth2/v2/auth'
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
		if ( strpos( $state, 'quillbooking-g-' ) !== 0 ) {
			return;
		}

		$host_id  = str_replace( 'quillbooking-g-', '', $state );
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

		if ( empty( $tokens ) ) {
			echo esc_html__( 'Error, Cannot get tokens!', 'quillbooking' );
			exit;
		}

		$account_data = new API( $tokens['access_token'], $tokens['refresh_token'], $this );
		$account_data = $account_data->get_account_info();

		if ( ! $account_data['success'] ) {
			echo esc_html__( 'Error, Cannot get account data!', 'quillbooking' );
			exit;
		}

		$account_id = $account_data['data']['id'];
		$this->integration->set_host( $host_id );
		$this->integration->accounts->add_account(
			$account_id,
			array(
				'name'   => $account_data['data']['email'],
				'tokens' => $tokens,
				'config' => array(),
			)
		);

		// Redirect to settings page.
		echo esc_html__( 'Success, Account added!', 'quillbooking' );
		wp_redirect(
			admin_url(
				"admin.php?page=quillbooking&path=calendars&id={$host_id}&tab=integrations&subtab={$this->integration->slug}"
			)
		);
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
		if ( empty( $refresh_token ) || empty( $account_id ) ) {
			return new \WP_Error(
				'missing_required_fields',
				__( 'Missing refresh token or account ID.', 'quillbooking' ),
				array( 'status' => 400 )
			);
		}

		$app_credentials = $this->get_app_credentials();

		if (
			empty( $app_credentials ) ||
			! Arr::has( $app_credentials, array( 'client_id', 'client_secret' ) )
		) {
			return new \WP_Error(
				'invalid_credentials',
				__( 'Missing or invalid app credentials.', 'quillbooking' ),
				array( 'status' => 401 )
			);
		}

		$refreshed_tokens = $this->get_tokens(
			array(
				'client_id'     => Arr::get( $app_credentials, 'client_id' ),
				'client_secret' => Arr::get( $app_credentials, 'client_secret' ),
				'grant_type'    => 'refresh_token',
				'refresh_token' => $refresh_token,
			)
		);

		if (
			empty( $refreshed_tokens ) ||
			! Arr::has( $refreshed_tokens, 'access_token' )
		) {
			return new \WP_Error(
				'token_refresh_failed',
				__( 'Failed to refresh the access token.', 'quillbooking' ),
				array( 'status' => 500 )
			);
		}

		$account_data = $this->integration->accounts->get_account( $account_id );
		if ( empty( $account_data ) || ! is_array( $account_data ) ) {
			return new \WP_Error(
				'account_not_found',
				__( 'Account not found.', 'quillbooking' ),
				array( 'status' => 404 )
			);
		}

		$tokens = Arr::get( $account_data, 'tokens', array() );
		if ( ! is_array( $tokens ) ) {
			$tokens = array();
		}

		$tokens['access_token'] = Arr::get( $refreshed_tokens, 'access_token' );

		$updated = $this->integration->accounts->update_account(
			$account_id,
			array(
				'tokens' => $tokens,
			)
		);

		if ( ! $updated ) {
			return new \WP_Error(
				'account_update_failed',
				__( 'Failed to update account with new tokens.', 'quillbooking' ),
				array( 'status' => 500 )
			);
		}

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
			'https://accounts.google.com/o/oauth2/token',
			array(
				'body' => $query,
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
	 * Get redirect uri
	 *
	 * @return string
	 */
	public function get_redirect_uri() {
		return admin_url( 'admin.php' ); // TODO: use https schema?
	}

}
