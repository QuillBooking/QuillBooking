<?php

/**
 * Class Twilio Rest Controller
 *
 * This class is responsible for handling the Twilio REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Twilio\REST_API;

use Exception;
use Illuminate\Support\Arr;
use QuillBooking\Integration\REST_API\REST_Integration_Controller as Abstract_REST_Integration_Controller;
use QuillBooking\Integrations\Twilio\API;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_REST_Server;


/**
 * Twilio Rest Controller
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
		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to manage Twilio integration settings.', 'quillbooking' ),
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
				 'id'          => array(
					 'type'        => array( 'integer', 'string' ),
					 'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => false,
				 ),
				 'name'        => array(
					 'type'        => 'string',
					 'description' => __( 'Name of the account.', 'quillbooking' ),
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'required'    => false,
				 ),
				 'credentials' => array(
					 'type'                 => 'object',
					 'description'          => __( 'Credentials for the account.', 'quillbooking' ),
					 'context'              => array( 'view', 'edit', 'embed' ),
					 'required'             => true,
					 'properties'           => array(
						 'sms_number'      => array(
							 'type'        => 'string',
							 'description' => __( 'SMS number.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
						 'whatsapp_number' => array(
							 'type'        => 'string',
							 'description' => __( 'WhatsApp number.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => false,
						 ),
						 'account_sid'     => array(
							 'type'        => 'string',
							 'description' => __( 'Account SID.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
						 'auth_token'      => array(
							 'type'        => 'string',
							 'description' => __( 'Auth token.', 'quillbooking' ),
							 'context'     => array( 'view', 'edit', 'embed' ),
							 'required'    => true,
						 ),
					 ),
					 'additionalProperties' => true,
				 ),
				 'config'      => array(
					 'type'                 => 'object',
					 'description'          => __( 'Configuration for the account.', 'quillbooking' ),
					 'context'              => array( 'view', 'edit', 'embed' ),
					 'required'             => true,
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
			$params          = $request->get_params();
			$settings        = Arr::get( $params, 'settings' );
			$sms_number      = Arr::get( $settings, 'credentials.sms_number' );
			$whatsapp_number = Arr::get( $settings, 'credentials.whatsapp_number' );
			$account_sid     = Arr::get( $settings, 'credentials.account_sid' );
			$auth_token      = Arr::get( $settings, 'credentials.auth_token' );

			if ( empty( $whatsapp_number ) ) {
				return new WP_Error( 'missing_required_fields', __( 'Whatsapp number is required.', 'quillbooking' ), array( 'status' => 400 ) );
			}
			if ( empty( $sms_number ) ) {
				return new WP_Error( 'missing_required_fields', __( 'SMS number is required.', 'quillbooking' ), array( 'status' => 400 ) );
			}
			if ( empty( $account_sid ) ) {
				return new WP_Error( 'missing_required_fields', __( 'Account SID is required.', 'quillbooking' ), array( 'status' => 400 ) );
			}
			if ( empty( $auth_token ) ) {
				return new WP_Error( 'missing_required_fields', __( 'Auth token is required.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			try {
				$api  = new API( $sms_number, $whatsapp_number, $account_sid, $auth_token );
				$data = $api->get_account_info();
				if ( ! Arr::get( $data, 'success' ) ) {
					throw new Exception( __( 'Invalid credentials.', 'quillbooking' ) );
				}

				// Account data to save
				$settings = array(
					'name'        => Arr::get( $data, 'data.friendly_name' ),
					'credentials' => array(
						'sms_number'      => $sms_number,
						'whatsapp_number' => $whatsapp_number,
						'account_sid'     => $account_sid,
						'auth_token'      => $auth_token,
					),
					'config'      => array(),
				);

				// Update settings
				$this->integration->update_settings( $settings );

				return new WP_REST_Response( $data, 200 );
			} catch ( Exception $e ) {
				return new WP_Error( 'update_twilio_account_error', $e->getMessage(), array( 'status' => 500 ) );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
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
						'message' => __( 'Global Twilio settings deleted successfully.', 'quillbooking' ),
					),
					200
				);
			}

			// Delete account-specific settings
			$this->integration->delete_settings( $id );
			return new WP_REST_Response(
				array(
					'message' => __( 'Twilio settings deleted successfully.', 'quillbooking' ),
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}
}
