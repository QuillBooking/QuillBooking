<?php
/**
 * PayPal AJAX Handler
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\PayPal;

use QuillBooking\Payment_Gateways\Paypal\Payment_Gateway;
use QuillBooking\Payment_Gateways\PayPal\Payment_Service;
use QuillBooking\Models\Booking_Model;

/**
 * Initialize PayPal AJAX handlers
 */
function init_paypal_ajax_handlers() {
    add_action('wp_ajax_quillbooking_init_paypal', 'QuillBooking\Payment_Gateways\PayPal\ajax_init_paypal');
    add_action('wp_ajax_nopriv_quillbooking_init_paypal', 'QuillBooking\Payment_Gateways\PayPal\ajax_init_paypal');
}
add_action('init', 'QuillBooking\Payment_Gateways\PayPal\init_paypal_ajax_handlers');

/**
 * AJAX handler for initializing PayPal payment
 */
function ajax_init_paypal() {
    // Debug logging
    error_log('PayPal AJAX Init - Starting');
    
    try {
        // Get booking ID from POST data
        $booking_hash_id = isset($_POST['booking_id']) ? sanitize_text_field($_POST['booking_id']) : null;
        
        if (!$booking_hash_id) {
            throw new \Exception(__('Invalid booking ID', 'quillbooking'));
        }
        
        // Get the booking data
        $booking = Booking_Model::getByHashId($booking_hash_id);
        
        if (!$booking) {
            throw new \Exception(__('Booking not found', 'quillbooking'));
        }
        
        // Create PayPal gateway instance
        $payment_gateway = new Payment_Gateway();
        
        // Check if PayPal is configured
        if (!$payment_gateway->is_configured()) {
            throw new \Exception(__('PayPal is not properly configured', 'quillbooking'));
        }
        
        // Initialize payment service
        $payment_service = new Payment_Service($payment_gateway);
        $payment_service->set_booking($booking);
        
        // Get PayPal payment URL
        $payment_url = $payment_service->get_payment_url();
        
        if (is_wp_error($payment_url)) {
            throw new \Exception($payment_url->get_error_message());
        }
        
        // Return the payment URL to the frontend
        wp_send_json_success(
            array(
                'redirect_url' => $payment_url,
            )
        );
    } catch (\Exception $e) {
        wp_send_json_error(
            array(
                'message' => $e->getMessage(),
            )
        );
    }
} 