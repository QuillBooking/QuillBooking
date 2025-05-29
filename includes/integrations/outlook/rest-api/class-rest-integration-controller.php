<?php

/**
 * Class Outlook Rest Controller
 *
 * This class is responsible for handling the Outlook REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Outlook\REST_API;

use QuillBooking\Integration\REST_API\REST_Integration_Controller as Abstract_REST_Integration_Controller;
use QuillBooking\Models\Calendar_Model;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Outlook Rest Controller
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
			"/{$this->rest_base}/auth",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'auth_uri' ),
					'permission_callback' => array( $this, 'auth_uri_permissions_check' ),
				),
			)
		);
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
				 'app'   => array(
					 'type'       => 'object',
					 'context'    => array( 'view' ),
					 'properties' => array(
						 'cache_time' => array(
							 'label'    => __( 'Cache Time', 'quillbooking' ),
							 'type'     => 'number',
							 'required' => true,
							 'context'  => array( 'view' ),
						 ),
					 ),
				 ),
				 'hosts' => array(
					 'type'                 => 'object',
					 'context'              => array( 'view' ),
					 'additionalProperties' => true,
				 ),
			 ),
		 );
	}

	/**
	 * Get auth uri
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function auth_uri( $request ) {
		/** @var App $app */
		$host_id = $request->get_param( 'host_id' );
		if ( empty( $host_id ) ) {
			return new WP_Error( 'no_host_id', esc_html__( 'No host ID provided!', 'quillbooking' ) );
		}

		$calendar = Calendar_Model::find( $host_id );
		if ( empty( $calendar ) || 'host' !== $calendar->type ) {
			return new WP_Error( 'no_host', esc_html__( 'No host found!', 'quillbooking' ) );
		}

		$app      = $this->integration->app;
		$auth_uri = $app->get_auth_uri( $host_id );

		return new WP_REST_Response( array( 'auth_uri' => $auth_uri ) );
	}

	/**
	 * Auth uri permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function auth_uri_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
