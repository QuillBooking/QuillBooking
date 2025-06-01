<?php

/**
 * Class Google Rest Controller
 *
 * This class is responsible for handling the Google REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Zoom\REST_API;

use Exception;
use Illuminate\Support\Arr;
use QuillBooking\Integration\REST_API\REST_Integration_Controller as Abstract_REST_Integration_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;


/**
 * Google Rest Controller
 */
class REST_Integration_Controller extends Abstract_REST_Integration_Controller {

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 parent::register_routes();
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}",
			array(
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(),
				),
			)
		);
	}

	/**
	 * Check if a given request has access to get items.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error
	 */
	public function delete_items_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) || ! current_user_can( 'quillbooking_manage_own_calendars' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to manage Zoom integration settings.', 'quillbooking' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get settings schema
	 *
	 * @return array
	 */
	public function get_settings_schema() {
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
	 * Update Integration
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update( $request ) {
		try {
			$settings = $request->get_param( 'settings' ) ?? array();

			// Validate settings
			$validator = $this->integration->validate( $settings );
			if ( ! $validator ) {
				return new \WP_Error( 'rest_invalid_request', __( 'Invalid settings.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			// Check if we have app credentials
			$app_credentials = $settings['app_credentials'] ?? array();
			if ( empty( $app_credentials['client_id'] ) || empty( $app_credentials['client_secret'] ) ) {
				return new \WP_Error( 'rest_invalid_request', __( 'Client ID and Secret Key are required.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			// Try to get tokens using client credentials
			try {
				// For global settings, we don't need to initialize host
				if ( empty( $settings['id'] ) ) {
					$tokens = $this->get_tokens(
						array(
							'client_id'     => $app_credentials['client_id'],
							'client_secret' => $app_credentials['client_secret'],
							'account_id'    => $app_credentials['account_id'],
						)
					);
				} else {
					// For specific accounts, we need to initialize host
					$this->integration->set_host( $settings['id'] );
					$tokens = $this->get_tokens(
						array(
							'client_id'     => $app_credentials['client_id'],
							'client_secret' => $app_credentials['client_secret'],
							'account_id'    => $app_credentials['account_id'],
						)
					);
				}

				if ( ! empty( $tokens ) ) {
					$settings['tokens'] = $tokens;
				}
			} catch ( \Exception $e ) {
				return new \WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
			}

			// If no account ID is provided, store as global settings
			if ( empty( $settings['id'] ) ) {
				$this->integration->update_settings( $settings );
				return new \WP_REST_Response(
					array(
						'settings' => $settings,
						'message'  => __( 'Global Zoom settings updated successfully.', 'quillbooking' ),
					),
					200
				);
			}

			// Update settings for specific account
			$this->integration->update_settings( $settings );

			return new \WP_REST_Response(
				array(
					'settings' => $settings,
				),
				200
			);
		} catch ( \Exception $e ) {
			return new \WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
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

		// Check for error responses
		if ( isset( $data['error'] ) ) {
			if ( $data['error'] === 'invalid_client' ) {
				throw new Exception( $data['reason'] ?? \__( 'Invalid client credentials provided.', 'quillbooking' ) );
			}
			throw new Exception( $data['reason'] ?? $data['error'] );
		}

		// Validate successful response format
		if ( ! isset( $data['access_token'] ) || ! isset( $data['token_type'] ) || ! isset( $data['expires_in'] ) ) {
			throw new Exception( \__( 'Invalid token response format from Zoom.', 'quillbooking' ) );
		}

		// Add API URL to the response if not present
		if ( ! isset( $data['api_url'] ) ) {
			$data['api_url'] = 'https://api.zoom.us';
		}

		return $data;
	}

	/**
	 * Delete Integration
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete( $request ) {
		try {
			$settings = $request->get_param( 'settings' ) ?? array();
			$id       = $settings['id'] ?? '';

			if ( empty( $id ) ) {
				// Delete global settings
				$this->integration->delete_settings();
				return new WP_REST_Response(
					array(
						'message' => __( 'Global Zoom settings deleted successfully.', 'quillbooking' ),
					),
					200
				);
			}

			// Delete account-specific settings
			$this->integration->delete_settings( $id );
			return new WP_REST_Response(
				array(
					'message' => __( 'Zoom settings deleted successfully.', 'quillbooking' ),
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}
}
