<?php
/**
 * Stripe AJAX Handler
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe;

use QuillBooking\Models\Booking_Model;

/**
 * Initialize Stripe AJAX handlers
 */
function init_stripe_ajax_handlers() {
    add_action('wp_ajax_quillbooking_init_stripe', 'QuillBooking\Payment_Gateways\Stripe\ajax_init_stripe');
    add_action('wp_ajax_nopriv_quillbooking_init_stripe', 'QuillBooking\Payment_Gateways\Stripe\ajax_init_stripe');
}
add_action('init', 'QuillBooking\Payment_Gateways\Stripe\init_stripe_ajax_handlers');

/**
 * AJAX handler for initializing Stripe payment
 */
function ajax_init_stripe() {
    // Debug logging
    error_log('Stripe AJAX Init - Starting');
    
    try {
        // Get booking ID from POST data
        $booking_hash_id = isset($_POST['booking_id']) ? sanitize_text_field($_POST['booking_id']) : null;
        
        if (!$booking_hash_id) {
            throw new \Exception(__('Invalid booking ID', 'quillbooking'));
        }
        
        // Get the booking data
        $booking = Booking_Model::getByHashId($booking_hash_id);
        
        if (!$booking) {
            error_log('Stripe AJAX Init - Booking not found: ' . $booking_hash_id);
            throw new \Exception(__('Booking not found', 'quillbooking'));
        }

        // Validate the event exists
        $event = $booking->event;
        if (!$event) {
            error_log('Stripe AJAX Init - Event not found for booking: ' . $booking_hash_id);
            throw new \Exception(__('Event not found for this booking', 'quillbooking'));
        }

        // Validate payment is required
        if (!isset($event->payments_settings['enable_payment']) || !$event->payments_settings['enable_payment']) {
            error_log('Stripe AJAX Init - Payment not enabled for event: ' . $event->id);
            throw new \Exception(__('Payment is not enabled for this event', 'quillbooking'));
        }

        // Validate Stripe is enabled
        if (!isset($event->payments_settings['enable_stripe']) || !$event->payments_settings['enable_stripe']) {
            error_log('Stripe AJAX Init - Stripe not enabled for event: ' . $event->id);
            throw new \Exception(__('Stripe payment is not enabled for this event', 'quillbooking'));
        }
        
        // Create Stripe gateway instance
        $payment_gateway = new Payment_Gateway();
        
        // Check if Stripe is configured
        $mode_settings = $payment_gateway->get_mode_settings();
        if (!$mode_settings) {
            error_log('Stripe AJAX Init - Configuration missing');
            throw new \Exception(__('Stripe is not properly configured', 'quillbooking'));
        }
        
        if (!$payment_gateway->is_configured()) {
            error_log('Stripe AJAX Init - Gateway not properly configured');
            throw new \Exception(__('Stripe is not properly configured', 'quillbooking'));
        }
        
        // Initialize payment service
        $payment_service = new Payment_Service($payment_gateway);
        $payment_service->set_booking($booking);
        $payment_service->set_mode_settings($mode_settings);
        
        // Let the payment service handle the rest
        $payment_service->ajax_init_stripe();
        
    } catch (\Exception $e) {
        error_log('Stripe AJAX Init - Error: ' . $e->getMessage());
        wp_send_json_error(
            array(
                'message' => $e->getMessage(),
            )
        );
    }
} 