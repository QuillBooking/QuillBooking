<?php
/**
 * WooCommerce Hooks
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Process WooCommerce payment for a booking
 * 
 * @param object $booking The booking object
 * @param array  $args    Additional arguments
 */
function quillbooking_process_woocommerce_payment( $booking, $args ) {
    // Only process if payment method is WooCommerce
    if ( ! isset( $args['payment_method'] ) || 'woocommerce' !== $args['payment_method'] ) {
        return;
    }

    // Initialize WooCommerce class from QuillBooking
    $woocommerce = \QuillBooking\WooCommerce\WooCommerce::get_instance();
    
    // Process the booking with WooCommerce
    // The WooCommerce class handles all the logic including:
    // - Checking product availability
    // - Adding to cart
    // - Creating order
    // - Redirecting to checkout
    $woocommerce->after_booking_created( $booking, $args );
}

// Hook into the payment processing action
add_action( 'quillbooking_process_payment', 'quillbooking_process_woocommerce_payment', 10, 2 ); 