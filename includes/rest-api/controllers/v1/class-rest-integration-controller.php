<?php
/**
 * Class Rest_Integration_Controller
 * This class is responsible for handling the Integration REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use Exception;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Managers\Integrations_Manager;

/**
 * Rest Integration Controller
 */
class REST_Integration_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'integrations';

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/(?P<slug>[\w-]+)",
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
			)
		);
	}

	/**
	 * Get item schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'integration',
			'type'       => 'object',
			'properties' => array(
				'slug'     => array(
					'description' => __( 'Integration Slug', 'quillbookin' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'settings' => array(
					'description' => __( 'Integration Settings', 'quillbooking' ),
					'type'        => 'object',
					'required'    => true,
				),
			),
		);
	}

	/**
	 * Get Integration
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get( WP_REST_Request $request ) {
		try {
			$slug        = $request->get_param( 'slug' );
			$integration = Integrations_Manager::instance()->get_integration( $slug );
			$settings    = $integration->get_settings();

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
	 * Update Integration
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update( WP_REST_Request $request ) {
		try {
			$slug        = $request->get_param( 'slug' );
			$settings    = $request->get_param( 'settings' ) ?? array();
			$integration = Integrations_Manager::instance()->get_integration( $slug );
			$validator   = $integration->validate( $settings );
			if ( ! $validator ) {
				return new WP_Error( 'rest_invalid_request', __( 'Invalid settings.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$integration->update_settings( $settings );

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
