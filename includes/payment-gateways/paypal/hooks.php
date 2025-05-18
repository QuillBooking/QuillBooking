<?php
/**
 * PayPal hooks
 *
 * @since 1.0.0
 * @package QuillBooking
 */

use QuillBooking\Payment_Gateways\Paypal\Payment_Gateway;
use QuillBooking\Payment_Gateways\PayPal\Payment_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Process PayPal payment
 *
 * @param \QuillBooking\Models\Booking_Model $booking
 * @param array                              $args
 * @return void
 */
function quillbooking_process_paypal_payment( $booking, $args ) {
	$payment_method = isset( $args['payment_method'] ) ? sanitize_text_field( $args['payment_method'] ) : '';

	// Check if this is a PayPal payment
	if ( $payment_method !== 'paypal' ) {
		return;
	}

	// Create PayPal gateway instance
	$payment_gateway = new Payment_Gateway();

	// Check if PayPal is configured
	if ( ! $payment_gateway->is_configured() ) {
		wp_send_json_error(
			array(
				'message' => __( 'PayPal is not properly configured', 'quillbooking' ),
			)
		);
		return;
	}

	// Initialize payment service
	$payment_service = new Payment_Service( $payment_gateway );
	$payment_service->set_booking( $booking );

	try {
		// Get PayPal payment URL
		$payment_url = $payment_service->get_payment_url();

		if ( is_wp_error( $payment_url ) ) {
			wp_send_json_error(
				array(
					'message' => $payment_url->get_error_message(),
				)
			);
			return;
		}

		// Return success with redirect URL
		wp_send_json_success(
			array(
				'redirect_url' => $payment_url,
				'message'      => __( 'Redirecting to PayPal...', 'quillbooking' ),
			)
		);
	} catch ( \Exception $e ) {
		wp_send_json_error(
			array(
				'message' => $e->getMessage(),
			)
		);
	}
}

// Hook into the payment processing action
add_action( 'quillbooking_process_payment', 'quillbooking_process_paypal_payment', 10, 2 );