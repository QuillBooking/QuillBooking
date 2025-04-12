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

use Illuminate\Support\Arr;
use QuillBooking\Payment_Gateway\REST_API\REST_Settings_Controller as Abstract_REST_Settings_Controller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

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
				'mode'                         => array(
					'description' => __( 'Mode', 'quillbooking' ),
					'type'        => 'string',
					'enum'        => array( 'sandbox', 'live' ),
					'default'     => 'sandbox',
				),
				'live_email'                   => array(
					'description' => __( 'Live Email', 'quillbooking' ),
					'type'        => 'string',
				),
				'sandbox_email'                => array(
					'description' => __( 'Sandbox Email', 'quillbooking' ),
					'type'        => 'string',
				),
				'sandbox_disable_verification' => array(
					'description' => __( 'Disable Verification', 'quillbooking' ),
					'type'        => 'boolean',
					'default'     => false,
				),
				'live_disable_verification'    => array(
					'description' => __( 'Disable Verification', 'quillbooking' ),
					'type'        => 'boolean',
					'default'     => false,
				),
			),
		);
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
		$settings             = $request->get_json_params();
		$mode                 = Arr::get( $settings, 'mode', 'sandbox' );
		$email                = Arr::get( $settings, $mode . '_email', '' );
		$disable_verification = Arr::get( $settings, $mode . '_disable_verification', false );

		if ( ! is_email( $email ) ) {
			return new \WP_Error( 'invalid_email', __( 'Invalid email.', 'quillbooking' ) );
		}

		if ( ! is_bool( $disable_verification ) ) {
			return new \WP_Error( 'invalid_disable_verification', __( 'Invalid disable verification.', 'quillbooking' ) );
		}

		$settings = array(
			'mode'                          => $mode,
			$mode . '_email'                => $email,
			$mode . '_disable_verification' => $disable_verification,
		);

		$this->payment_gateway->update_settings( $settings );

		return new WP_REST_Response(
			array(
				'success' => true,
				/* translators: %s: Mode. */
				'message' => sprintf( esc_html__( 'Account connected successfully at %s mode.', 'quillbooking' ), $mode ),
				'updated' => true,
			)
		);
	}

}
