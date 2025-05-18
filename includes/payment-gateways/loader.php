<?php
/**
 * Payment Gateways Loader
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// First, ensure all necessary classes are available to avoid circularity
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-gateway.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/class-payment-service.php';

// Payment gateway files
require_once dirname( __FILE__ ) . '/paypal/class-payment-gateway.php';
require_once dirname( __FILE__ ) . '/paypal/class-payment-service.php';
require_once dirname( __FILE__ ) . '/paypal/class-webhook.php';

require_once dirname( __FILE__ ) . '/stripe/class-payment-gateway.php';
require_once dirname( __FILE__ ) . '/stripe/class-payment-service.php';
require_once dirname( __FILE__ ) . '/stripe/class-webhook.php';
require_once dirname( __FILE__ ) . '/stripe/class-customers.php';
require_once dirname( __FILE__ ) . '/stripe/class-utils.php';

// Use the gateway classes
use QuillBooking\Payment_Gateways\Paypal\Payment_Gateway as Paypal_Payment_Gateway;
use QuillBooking\Payment_Gateways\Stripe\Payment_Gateway as Stripe_Payment_Gateway;

// Initialize payment gateways
Paypal_Payment_Gateway::instance();
Stripe_Payment_Gateway::instance();

// Load payment gateway hooks - these must come after the gateways are initialized
require_once dirname( __FILE__ ) . '/paypal/hooks.php';
require_once dirname( __FILE__ ) . '/stripe/hooks.php';