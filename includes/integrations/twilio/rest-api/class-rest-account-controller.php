<?php
/**
 * Class REST Integration Account Controller
 *
 * This class is responsible for handling the Integration Account REST API
 *
 * @since 1.0.0
 */

namespace QuillBooking\Integrations\Twilio\REST_API;

use QuillBooking\Integration\REST_API\REST_Account_Controller as Abstract_REST_Account_Controller;
use QuillBooking\Integrations\Twilio\API;
use WP_REST_Response;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;

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
	 * Create item
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_item( $request ) {
		return new WP_REST_Response( array( 'message' => 'Hello, world!' ), 200 );
		$params          = $request->get_params();
		$sms_number      = Arr::get( $params, 'credentials.sms_number' );
		$whatsapp_number = Arr::get( $params, 'credentials.whatsapp_number' );
		$account_sid     = Arr::get( $params, 'credentials.account_sid' );
		$auth_token      = Arr::get( $params, 'credentials.auth_token' );
		$host_id         = $request->get_param( 'calendar_id' );

		if ( empty( $sms_number ) || empty( $account_sid ) || empty( $auth_token ) ) {
			return new WP_Error( 'missing_required_fields', __( 'Missing required fields.', 'quillbooking' ), array( 'status' => 400 ) );
		}

		try {
			$api  = new API( $sms_number, $whatsapp_number, $account_sid, $auth_token );
			$data = $api->get_account_info();
			if ( ! Arr::get( $data, 'success' ) ) {
				throw new Exception( __( 'Could not add Twilio account.', 'quillbooking' ) );
			}

			$this->integration->set_host( $host_id );
			
			// Get existing accounts
			$existing_accounts = $this->integration->accounts->get_accounts();
			
			// Account data to save
			$account_data = array(
				'name'        => Arr::get( $data, 'data.friendly_name' ),
				'credentials' => array(
					'sms_number'      => $sms_number,
					'whatsapp_number' => $whatsapp_number,
					'account_sid'     => $account_sid,
					'auth_token'      => $auth_token,
				),
				'config'      => array(),
			);
			
			// If an account exists, update it instead of removing and adding
			if ( ! empty( $existing_accounts ) ) {
				// Get the first account ID (we only want one account)
				$existing_account_id = array_key_first( $existing_accounts );
				
				// Update the existing account
				$this->integration->accounts->update_account( $existing_account_id, $account_data );
			} else {
				// No existing account, add a new one
				$this->integration->accounts->add_account( $account_sid, $account_data );
			}

			return new WP_REST_Response( $data, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'add_twilio_account_error', $e->getMessage(), array( 'status' => 500 ) );
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
}
