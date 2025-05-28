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
use WP_REST_Server;
use WP_REST_Request;
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
					 'description' => \__( 'Unique identifier for the object.', 'quillbooking' ),
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => false,
				 ),
				 'name'            => array(
					 'type'        => 'string',
					 'description' => \__( 'Name of the account.', 'quillbooking' ),
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'required'    => false,
				 ),
				 'app_credentials' => array(
					 'type'                 => 'object',
					 'description'          => \__( 'Credentials for the account.', 'quillbooking' ),
					 'context'              => array( 'view', 'edit', 'embed' ),
					 'required'             => true,
					 'properties'           => array(
						 'account_id'    => array(
							 'type'        => 'string',
							 'description' => \__( 'Account ID.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
						 'client_id'     => array(
							 'type'        => 'string',
							 'description' => \__( 'Client ID.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => false,
						 ),
						 'client_secret' => array(
							 'type'        => 'string',
							 'description' => \__( 'Secret Key.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
					 ),
					 'additionalProperties' => true,
				 ),
				 'tokens'          => array(
					 'type'                 => 'object',
					 'description'          => \__( 'Credentials for the account.', 'quillbooking' ),
					 'context'              => array( 'view', 'edit', 'embed' ),
					 'required'             => false,
					 'properties'           => array(
						 'access_token'  => array(
							 'type'        => 'string',
							 'description' => \__( 'Access token for the account.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
						 'refresh_token' => array(
							 'type'        => 'string',
							 'description' => \__( 'Refresh token for the account.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
					 ),
					 'additionalProperties' => true,
				 ),
				 'config'          => array(
					 'type'                 => 'object',
					 'description'          => \__( 'Configuration for the account.', 'quillbooking' ),
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
		$params = $request->get_params();

		// Check if app_credentials exists
		if ( ! isset( $params['app_credentials'] ) || ! is_array( $params['app_credentials'] ) ) {
			return new WP_Error(
				'missing_app_credentials',
				\__( 'The app_credentials field is required and must be an object.', 'quillbooking' ),
				array( 'status' => 400 )
			);
		}

		// Extract credentials
		$account_id    = Arr::get( $params, 'app_credentials.account_id' );
		$client_id     = Arr::get( $params, 'app_credentials.client_id' );
		$client_secret = Arr::get( $params, 'app_credentials.client_secret' );
		$host_id       = $request->get_param( 'calendar_id' );

		// Validate account ID
		if ( empty( $account_id ) ) {
			return new WP_Error(
				'missing_account_id',
				\__( 'The account_id field is required.', 'quillbooking' ),
				array( 'status' => 400 )
			);
		}

		// Validate client ID
		if ( empty( $client_id ) ) {
			return new WP_Error(
				'missing_client_id',
				\__( 'The client_id field is required.', 'quillbooking' ),
				array( 'status' => 400 )
			);
		}

		// Validate client secret
		if ( empty( $client_secret ) ) {
			return new WP_Error(
				'missing_client_secret',
				\__( 'The client_secret field is required.', 'quillbooking' ),
				array( 'status' => 400 )
			);
		}

		// Validate host ID if required
		if ( empty( $host_id ) ) {
			return new WP_Error(
				'missing_calendar_id',
				\__( 'The calendar_id field is required.', 'quillbooking' ),
				array( 'status' => 400 )
			);
		}

		$this->integration->set_host( $host_id );
		$app_credentials = array(
			'account_id'    => $account_id,
			'client_id'     => $client_id,
			'client_secret' => $client_secret,
		);

		try {
			// Get tokens from Zoom
			$data = $this->get_tokens( $app_credentials );

			// Validate token response
			if ( empty( $data['access_token'] ) ) {
				return new WP_Error(
					'invalid_zoom_response',
					\__( 'Account credentials are invalid.', 'quillbooking' ),
					array( 'status' => 400 )
				);
			}

			$api          = new API( $data['access_token'], $this->integration );
			$account_data = $api->get_account_info();

			// Validate account data
			if ( empty( $account_data ) || empty( $account_data['data'] ) ) {
				return new WP_Error(
					'invalid_account_data',
					\__( 'Could not retrieve account information from Zoom.', 'quillbooking' ),
					array( 'status' => 400 )
				);
			}

			$name = Arr::get( $account_data, 'data.email' );

			// Check if account already exists
			$account_exists = $this->integration->accounts->get_account( $account_id );

			if ( $account_exists ) {
				// Update existing account
				$this->integration->accounts->update_account(
					$account_id,
					array(
						'name'            => $name,
						'tokens'          => $data,
						'app_credentials' => $app_credentials,
						'config'          => array(),
					)
				);
			} else {
				// Add new account
				$this->integration->accounts->add_account(
					$account_id,
					array(
						'name'            => $name,
						'tokens'          => $data,
						'app_credentials' => $app_credentials,
						'config'          => array(),
					)
				);
			}

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
		return \current_user_can( 'manage_options' );
	}

	/**
	 * Get tokens
	 *
	 * @param array $app_credentials App credentials.
	 * @return array
	 */
	private function get_tokens( $app_credentials ) {
		$response = \wp_remote_post(
			'https://zoom.us/oauth/token',
			array(
				'body'    => array(
					'grant_type' => 'account_credentials',
					'account_id' => Arr::get( $app_credentials, 'account_id' ),
				),
				'headers' => array(
					'Authorization' => 'Basic ' . \base64_encode( Arr::get( $app_credentials, 'client_id' ) . ':' . Arr::get( $app_credentials, 'client_secret' ) ),
				),
			)
		);

		if ( \is_wp_error( $response ) ) {
			throw new Exception( $response->get_error_message() );
		}

		$body = \wp_remote_retrieve_body( $response );
		$data = \json_decode( $body, true );

		if ( empty( $data ) ) {
			throw new Exception( \__( 'Invalid response from Zoom.', 'quillbooking' ) );
		}

		return $data;
	}
}
