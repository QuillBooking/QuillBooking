<?php
/**
 * Payment Gateway Return Handler
 *
 * @since 1.0.0
 * @package QuillBooking
 */

use QuillBooking\Models\Booking_Model;

/**
 * Initialize the payment return handler
 */
function quillbooking_payment_return_handler() {
    // Check if this is a payment return
    if (isset($_GET['quillbooking_payment'])) {
        $mode = sanitize_text_field($_GET['quillbooking_payment']);
        $method = isset($_GET['method']) ? sanitize_text_field($_GET['method']) : '';
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
        $booking_id = isset($_GET['booking_id']) ? sanitize_text_field($_GET['booking_id']) : '';
        
        if (!$booking_id) {
            wp_die(__('Invalid booking ID.', 'quillbooking'));
        }
        
        try {
            $booking = Booking_Model::getByHashId($booking_id);
            
            if (!$booking) {
                wp_die(__('Booking not found.', 'quillbooking'));
            }
            
            // Log the payment return
            $booking->logs()->create([
                'type'    => 'info',
                'message' => sprintf(__('Payment %s return from %s', 'quillbooking'), $action, $method),
                'details' => sprintf(__('User returned from payment gateway: %s', 'quillbooking'), $method),
            ]);
            
            // Determine redirect URL based on action
            if ($action === 'return') {
                // Redirect to confirmation page - use home_url() which includes the full site path
                $redirect_url = home_url("/?quillbooking=booking&id={$booking_id}&type=confirm");
            } elseif ($action === 'cancel') {
                // Redirect to cancel page - use home_url() which includes the full site path
                $redirect_url = home_url("/?quillbooking=booking&id={$booking_id}&type=cancel");
            } else {
                // Default to confirmation page - use home_url() which includes the full site path
                $redirect_url = home_url("/?quillbooking=booking&id={$booking_id}&type=confirm");
            }
            
            // Log the redirection URL (helpful for debugging)
            error_log('QuillBooking: Redirecting payment return to: ' . $redirect_url);
            
            // Redirect the user
            wp_redirect($redirect_url);
            exit;
            
        } catch (Exception $e) {
            wp_die($e->getMessage());
        }
    }
}
add_action('init', 'quillbooking_payment_return_handler', 5); 