<?php
/**
 * Stripe hooks
 *
 * @since 1.0.0
 * @package QuillBooking
 */

use QuillBooking\Payment_Gateways\Stripe\Payment_Gateway;
use QuillBooking\Payment_Gateways\Stripe\Payment_Service;
use QuillBooking\Payment_Gateways\Stripe\Webhook;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Initialize Stripe Payment Service and register AJAX handlers
 */
function quillbooking_init_stripe_payment_service() {
	// Check if the Stripe Payment Service class exists before initializing
	if (class_exists('\\QuillBooking\\Payment_Gateways\\Stripe\\Payment_Service')) {
		// Create an instance of the payment gateway
		$payment_gateway = new Payment_Gateway();

        		// Make sure we have settings configured
		$mode_settings = $payment_gateway->get_mode_settings();
		if (!$mode_settings) {
			error_log('Stripe Payment Service - Configuration missing');
			return;
		}
		
		error_log('Stripe Payment Service - Gateway configured: ' . json_encode($mode_settings));
		
		// Initialize Webhook handler
		if (class_exists('\\QuillBooking\\Payment_Gateways\\Stripe\\Webhook')) {
			new Webhook($payment_gateway);
		}
		
		// Register AJAX handlers
		add_action('wp_ajax_quillbooking_init_stripe', 'quillbooking_ajax_init_stripe');
		add_action('wp_ajax_nopriv_quillbooking_init_stripe', 'quillbooking_ajax_init_stripe');
	}
}
add_action('plugins_loaded', 'quillbooking_init_stripe_payment_service');

/**
 * AJAX handler for initializing Stripe payment
 */
function quillbooking_ajax_init_stripe() {
	// Debug logging
	error_log('Stripe AJAX Init - Starting');
	error_log('POST data: ' . print_r($_POST, true));
	
	try {
		// Create Stripe gateway instance
		$payment_gateway = new Payment_Gateway();
		
		// Check if Stripe is configured
		$mode_settings = $payment_gateway->get_mode_settings();
		if (!$mode_settings) {
			error_log('Stripe AJAX Init - Configuration missing');
			wp_send_json_error(array('message' => __('Stripe is not properly configured', 'quillbooking')));
			return;
		}
		
		error_log('Stripe AJAX Init - Gateway configured: ' . json_encode($mode_settings));
		
		// Initialize payment service
		$payment_service = new Payment_Service($payment_gateway);
		
		// Call the ajax_init_stripe method
		$payment_service->ajax_init_stripe();
	} catch (Exception $e) {
		error_log('Stripe AJAX Init - Exception: ' . $e->getMessage());
		wp_send_json_error(array('message' => $e->getMessage()));
	}
}

/**
 * Process Stripe payment
 *
 * @param \QuillBooking\Models\Booking_Model $booking
 * @param array                              $args
 * @return void
 */
function quillbooking_process_stripe_payment( $booking, $args ) {
	$payment_method = isset( $args['payment_method'] ) ? sanitize_text_field( $args['payment_method'] ) : '';

	// Check if this is a Stripe payment
	if ( $payment_method !== 'stripe' ) {
		return;
	}

	// Create Stripe gateway instance
	$payment_gateway = new Payment_Gateway();

	// Check if Stripe is configured
	if ( ! $payment_gateway->is_configured() ) {
		wp_send_json_error(
			array(
				'message' => __( 'Stripe is not properly configured', 'quillbooking' ),
			)
		);
		return;
	}

	// Initialize payment service
	$payment_service = new Payment_Service( $payment_gateway );

	// Set booking and mode settings
	$mode_settings = $payment_gateway->get_mode_settings();
	$payment_service->set_booking( $booking );
	$payment_service->set_mode_settings( $mode_settings );

	try {
		// For Stripe, we'll return the client-side data needed to create a payment session
		// This will be used by the Stripe JS SDK to open the payment form

		// Initialize Stripe client
		$stripe_client = new \Stripe\StripeClient( $mode_settings['secret_key'] );

		// Create a payment intent for this booking
		$amount   = $booking->event->getTotalPrice();
		$currency = isset( $booking->event->payments_settings['currency'] ) ?
			$booking->event->payments_settings['currency'] : 'USD';

		// Convert to cents/smallest currency unit for Stripe
		$amount_in_cents = round( $amount * 100 );

		// Create a payment intent
		$payment_intent = $stripe_client->paymentIntents->create(
			array(
				'amount'                    => $amount_in_cents,
				'currency'                  => strtolower( $currency ),
				'description'               => sprintf( __( 'Booking: %s', 'quillbooking' ), $booking->hash_id ),
				'metadata'                  => array(
					'booking_id'  => $booking->hash_id,
					'event_id'    => $booking->event->id,
					'guest_email' => $booking->guest->email,
				),
				'automatic_payment_methods' => array(
					'enabled' => true,
				),
			)
		);

		// Create or update order in our system
		$booking->order()->create(
			array(
				'payment_method' => 'stripe',
				'status'         => 'pending',
				'total'          => $amount,
				'currency'       => $currency,
				'transaction_id' => $payment_intent->id,
			)
		);

		// Return the client secret to the frontend
		wp_send_json_success(
			array(
				'client_secret'   => $payment_intent->client_secret,
				'publishable_key' => $mode_settings['publishable_key'],
				'booking_id'      => $booking->hash_id,
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
add_action( 'quillbooking_process_payment', 'quillbooking_process_stripe_payment', 10, 2 );