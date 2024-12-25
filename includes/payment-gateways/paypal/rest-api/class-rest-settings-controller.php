<?php
/**
 * Class Settings REST Controller
 * This class is responsible for handling the Settings REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Paypal\REST_API;

use QuillBooking\Payment_Gateway\REST_API\REST_Settings_Controller as Abstract_REST_Settings_Controller;

/**
 * Rest Settings Controller
 */
class REST_Settings_Controller extends Abstract_REST_Settings_Controller {

	/**
	 * Get item schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'payment_gateway',
			'type'       => 'object',
			'properties' => array(
				'mode'                 => array(
					'description' => __( 'Mode', 'quillbooking' ),
					'type'        => 'string',
					'enum'        => array( 'sandbox', 'live' ),
					'default'     => 'sandbox',
				),
				'live_email'           => array(
					'description' => __( 'Live Email', 'quillbooking' ),
					'type'        => 'string',
				),
				'sandbox_email'        => array(
					'description' => __( 'Sandbox Email', 'quillbooking' ),
					'type'        => 'string',
				),
				'disable_verification' => array(
					'description' => __( 'Disable Verification', 'quillbooking' ),
					'type'        => 'boolean',
					'default'     => false,
				),
			),
		);
	}
}
