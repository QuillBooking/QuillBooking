<?php
/**
 * Class Payment_Gateway REST Controller
 * This class is responsible for handling the Payment_Gateway REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateway\REST_API;

use QuillBooking\Payment_Gateway\Payment_Gateway;
use QuillBooking\Abstracts\REST_Controller;
use WP_REST_Server;
use WP_REST_Response;
use WP_Error;
use Exception;

/**
 * Rest Payment_Gateway Controller
 */
abstract class REST_Settings_Controller extends REST_Controller {

	/**
	 * Payment_Gateway.
	 *
	 * @var Payment_Gateway
	 */
	protected $payment_gateway;

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $rest_base = 'payment-gateways';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Payment_Gateway $payment_gateway
	 */
	public function __construct( Payment_Gateway $payment_gateway ) {
		$this->payment_gateway = $payment_gateway;
		$this->rest_base       = "{$this->rest_base}/{$this->payment_gateway->slug}";

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get' ),
					'permission_callback' => array( $this, 'get_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
					'args'                => rest_get_endpoint_args_for_schema( $this->get_schema(), WP_REST_Server::CREATABLE ),
				),
			)
		);
	}

	/**
	 * Get Payment_Gateway
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get( $request ) {
		try {
			$settings = $this->payment_gateway->get_settings();

			return new WP_REST_Response(
				array(
					'settings' => $settings,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Update Payment_Gateway
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update( $request ) {
		try {
			$settings  = $request->get_json_params();
			$validator = $this->payment_gateway->validate( $settings );
			if ( is_wp_error( $validator ) ) {
				return $validator;
			}

			$this->payment_gateway->update_settings( $settings );

			return new WP_REST_Response(
				array(
					'settings' => $settings,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get Permissions Check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Update Permissions Check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
