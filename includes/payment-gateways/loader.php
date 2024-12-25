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

use QuillBooking\Payment_Gateways\Paypal\Payment_Gateway as Paypal_Payment_Gateway;
use QuillBooking\Payment_Gateways\Stripe\Payment_Gateway as Stripe_Payment_Gateway;

Paypal_Payment_Gateway::instance();
Stripe_Payment_Gateway::instance();
