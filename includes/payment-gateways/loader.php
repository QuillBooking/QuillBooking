<?php
/**
 * Payment Gateways Loader
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

if (!defined('ABSPATH')) {
    exit;
}

// First, ensure all necessary classes are available to avoid circularity
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-gateway.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-service.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/return-handler.php';

// Pro version loads the payment gateways.