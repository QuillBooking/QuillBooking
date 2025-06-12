<?php
/**
 * Payment Gateway Loader
 *
 * @since 1.0.0
 * @package QuillBooking
 */

if (!defined('ABSPATH')) {
    exit;
}

// Load abstract payment gateway classes
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-gateway.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-service.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-validator.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/rest-api/class-rest-api.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/rest-api/class-rest-settings-controller.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/return-handler.php';

// Load the Payment Gateways Manager
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/managers/class-payment-gateways-manager.php';

// Initialize the Payment Gateways Manager
\QuillBooking\Managers\Payment_Gateways_Manager::instance();