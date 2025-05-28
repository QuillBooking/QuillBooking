<?php
/**
 * REST API: class REST_WooCommerce_Controller
 *
 * @since 1.0.0
 * @package QuillBooking
 * @subpackage REST_API
 */

namespace QuillBooking\REST_API\Controllers\v1;

use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\WooCommerce\WooCommerce;
use QuillBooking\Models\Event_Model;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * REST WooCommerce Controller.
 *
 * @since 1.0.0
 */
class REST_WooCommerce_Controller extends REST_Controller {



	/**
	 * Constructor.
	 */
	public function __construct() {
		 $this->namespace = 'quillbooking/v1';
		$this->rest_base  = 'woocommerce';
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/product-price/(?P<id>\d+)',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_product_price' ),
					'permission_callback' => '__return_true',
					'args'                => array(
						'id'       => array(
							'required'    => true,
							'type'        => 'integer',
							'description' => __( 'Event ID', 'quillbooking' ),
						),
						'duration' => array(
							'required'    => false,
							'type'        => 'string',
							'description' => __( 'Duration value for multi-duration events', 'quillbooking' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Get product price.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_product_price( $request ) {
		$event_id = $request->get_param( 'id' );
		$event    = Event_Model::find( $event_id );

		if ( ! $event ) {
			return new WP_Error(
				'quillbooking_event_not_found',
				__( 'Event not found.', 'quillbooking' ),
				array( 'status' => 404 )
			);
		}

		// Check if a specific duration was requested
		$duration = $request->get_param( 'duration' );

		// Use the updated get_product_price method with duration parameter
		$price_data = WooCommerce::get_product_price( $event->payments_settings, $duration );

		if ( ! $price_data ) {
			return new WP_Error(
				'quillbooking_woo_product_not_found',
				$duration ?
				sprintf( __( 'WooCommerce product for duration %s not found or payment not enabled.', 'quillbooking' ), $duration ) :
				__( 'WooCommerce product not found or payment not enabled.', 'quillbooking' ),
				array( 'status' => 404 )
			);
		}

		// Add duration to the response if it was provided
		if ( $duration ) {
			$price_data['duration'] = $duration;
		}

		return rest_ensure_response( $price_data );
	}
}
