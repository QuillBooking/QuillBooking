<?php

/**
 * Class Apple Rest Controller
 *
 * This class is responsible for handling the Apple REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Apple\REST_API;

use QuillBooking\Integration\REST_API\REST_Integration_Controller as Abstract_REST_Integration_Controller;



/**
 * Apple Rest Controller
 */
class REST_Integration_Controller extends Abstract_REST_Integration_Controller {

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 parent::register_routes();
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
					 'required'   => true,
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
			 'required'   => array( 'app' ),
		 );
	}
}
