<?php
/**
 * REST_Settings_Controller class.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\V1;

use QuillBooking\Settings;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Payment_Gateway\Payment_Validator;

/**
 * REST_Settings_Controller class.
 *
 * @since 1.0.0
 */
class REST_Settings_Controller extends REST_Controller {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'settings';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 *
	 * @return void
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
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Retrieves schema, conforming to JSON Schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_schema() {
		$schema = array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'settings',
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'general'  => array(
					'type'        => 'object',
					'description' => __( 'General settings', 'quillbooking' ),
					'properties'  => array(
						'admin_email'             => array(
							'type'        => 'string',
							'description' => __( 'Admin email', 'quillbooking' ),
							'default'     => '',
						),
						'start_from'              => array(
							'type'        => 'string',
							'description' => __( 'Start from', 'quillbooking' ),
							'default'     => 'Monday',
						),
						'time_format'             => array(
							'type'        => 'string',
							'description' => __( 'Time format', 'quillbooking' ),
							'default'     => '12',
						),
						'auto_cancel_after'       => array(
							'type'        => 'integer',
							'description' => __( 'Auto cancel after', 'quillbooking' ),
							'default'     => 30,
						),
						'auto_complete_after'     => array(
							'type'        => 'integer',
							'description' => __( 'Auto complete after', 'quillbooking' ),
							'default'     => 30,
						),
						'default_country_code'    => array(
							'type'        => 'string',
							'description' => __( 'Default country Code', 'quillbooking' ),
							'default'     => '+1',
						),
						'enable_summary_email'    => array(
							'type'        => 'boolean',
							'description' => __( 'Enable summary email', 'quillbooking' ),
							'default'     => false,
						),
						'summary_email_frequency' => array(
							'type'        => 'string',
							'description' => __( 'Summary email frequency', 'quillbooking' ),
							'default'     => 'daily',
						),
					),
				),
				'payments' => array(
					'type'        => 'object',
					'description' => __( 'Payments settings', 'quillbooking' ),
					'properties'  => array(
						'currency' => array(
							'type'        => 'string',
							'description' => __( 'Currency', 'quillbooking' ),
							'default'     => '',
						),
					),
				),
				'email'    => array(
					'type'        => 'object',
					'description' => __( 'Email settings', 'quillbooking' ),
					'properties'  => array(
						'from_name'               => array(
							'type'        => 'string',
							'description' => __( 'From name', 'quillbooking' ),
							'default'     => '',
						),
						'from_email'              => array(
							'type'        => 'string',
							'description' => __( 'From email', 'quillbooking' ),
							'default'     => '',
						),
						'reply_to_name'           => array(
							'type'        => 'string',
							'description' => __( 'Reply to Name', 'quillbooking' ),
							'default'     => '',
						),
						'reply_to_email'          => array(
							'type'        => 'string',
							'description' => __( 'Reply to Email', 'quillbooking' ),
							'default'     => '',
						),
						'use_host_from_name'      => array(
							'type'        => 'boolean',
							'description' => __( 'Use host from name', 'quillbooking' ),
							'default'     => false,
						),
						'use_host_reply_to_email' => array(
							'type'        => 'boolean',
							'description' => __( 'Use host reply to email', 'quillbooking' ),
							'default'     => false,
						),
						'include_ics'             => array(
							'type'        => 'boolean',
							'description' => __( 'Include ICS', 'quillbooking' ),
							'default'     => false,
						),
						'footer'                  => array(
							'type'        => 'string',
							'description' => __( 'Footer', 'quillbooking' ),
							'default'     => '',
						),
					),
				),
				'theme'    => array(
					'type'        => 'object',
					'description' => __( 'Theme settings', 'quillbooking' ),
					'properties'  => array(
						'color_scheme' => array(
							'type'        => 'string',
							'description' => __( 'Color scheme', 'quillbooking' ),
							'default'     => 'system',
						),
					),
				),
			),
		);
		return $schema;
	}

	/**
	 * Retrieves settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get( $request ) 	{ // phpcs:ignore
		$settings = Settings::get_all();

		$result = array();
		foreach ( $this->get_schema()['properties'] as $group_key => $group_schema ) {
			$result[ $group_key ] = array();
			foreach ( $group_schema['properties'] as $setting_key => $setting_schema ) {
				$result[ $group_key ][ $setting_key ] = $settings[ $group_key ][ $setting_key ] ?? $setting_schema['default'];
			}
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Checks if a given request has access to get settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Updates settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update( $request ) {
		$settings = $request->get_json_params();

		Settings::update_many( $settings );
		return new WP_REST_Response( array( 'success' => true ), 200 );
	}

	/**
	 * Checks if a given request has access to update settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function update_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

}
