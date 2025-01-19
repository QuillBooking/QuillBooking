<?php
/**
 * Class REST Integration Account Controller
 *
 * This class is responsible for handling the Integration Account REST API
 *
 * @since 1.0.0
 */

namespace QuillBooking\Integrations\Zoom\REST_API;

use QuillBooking\Integration\REST_API\REST_Account_Controller as Abstract_REST_Account_Controller;
use WP_REST_Response;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use QuillBooking\Integrations\Zoom\API;

/**
 * Rest Integration Account Controller
 */
class REST_Account_Controller extends Abstract_REST_Account_Controller {

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_item' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
				'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::CREATABLE ),
			)
		);
	}

	/**
	 * Get item schema
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'              => array(
					'type'        => array( 'integer', 'string' ),
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => false,
				),
				'name'            => array(
					'type'        => 'string',
					'description' => __( 'Name of the account.', 'quillbooking' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'required'    => false,
				),
				'app_credentials' => array(
					'type'                 => 'object',
					'description'          => __( 'Credentials for the account.', 'quillbooking' ),
					'context'              => array( 'view', 'edit', 'embed' ),
					'required'             => true,
					'properties'           => array(
						'account_id'    => array(
							'type'        => 'string',
							'description' => __( 'Account ID.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
						'client_id'     => array(
							'type'        => 'string',
							'description' => __( 'Client ID.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => false,
						),
						'client_secret' => array(
							'type'        => 'string',
							'description' => __( 'Secret Key.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
					),
					'additionalProperties' => true,
				),
				'tokens'          => array(
					'type'                 => 'object',
					'description'          => __( 'Credentials for the account.', 'quillbooking' ),
					'context'              => array( 'view', 'edit', 'embed' ),
					'required'             => false,
					'properties'           => array(
						'access_token'  => array(
							'type'        => 'string',
							'description' => __( 'Access token for the account.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
						'refresh_token' => array(
							'type'        => 'string',
							'description' => __( 'Refresh token for the account.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
					),
					'additionalProperties' => true,
				),
				'config'          => array(
					'type'                 => 'object',
					'description'          => __( 'Configuration for the account.', 'quillbooking' ),
					'context'              => array( 'view', 'edit', 'embed' ),
					'required'             => false,
					'additionalProperties' => true,
				),
			),
		);
	}

	/**
	 * Create item
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_item( $request ) {
		$params        = $request->get_params();
		$account_id    = Arr::get( $params, 'app_credentials.account_id' );
		$client_id     = Arr::get( $params, 'app_credentials.client_id' );
		$client_secret = Arr::get( $params, 'app_credentials.client_secret' );
		$host_id       = $request->get_param( 'calendar_id' );

		if ( empty( $account_id ) || empty( $client_secret ) || empty( $client_id ) ) {
			return new WP_Error( 'missing_required_fields', __( 'Missing required fields.', 'quillbooking' ), array( 'status' => 400 ) );
		}

		$this->integration->set_host( $host_id );
		$app_credentials = array(
			'account_id'    => $account_id,
			'client_id'     => $client_id,
			'client_secret' => $client_secret,
		);

		try {
			$data         = $this->get_tokens( $app_credentials );
			$api          = new API( $data['access_token'] );
			$account_data = $api->get_account_info();
			$name         = Arr::get( $account_data, 'data.email' );
			$this->integration->accounts->add_account(
				$account_id,
				array(
					'name'   => $name,
					'tokens' => $data,
					'config' => array(),
				)
			);

			return new WP_REST_Response( $data, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'add_zoom_account_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item permissions check
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return bool|\WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get tokens
	 *
	 * @param array $app_credentials App credentials.
	 * @return array
	 */
	private function get_tokens( $app_credentials ) {
		$response = wp_remote_post(
			'https://zoom.us/oauth/token',
			array(
				'body'    => array(
					'grant_type' => 'account_credentials',
					'account_id' => Arr::get( $app_credentials, 'account_id' ),
				),
				'headers' => array(
					'Authorization' => 'Basic ' . base64_encode( Arr::get( $app_credentials, 'client_id' ) . ':' . Arr::get( $app_credentials, 'client_secret' ) ),
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			throw new Exception( $response->get_error_message() );
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data ) ) {
			throw new Exception( __( 'Invalid response from Zoom.', 'quillbooking' ) );
		}

		return $data;
	}
}
