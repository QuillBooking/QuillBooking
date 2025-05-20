<?php
/**
 * Class Payment_Validator
 *
 * Utility class for validating payment-related settings.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateway;

use Illuminate\Support\Arr;
use QuillBooking\Managers\Payment_Gateways_Manager;
use WP_Error;

/**
 * Payment validator class
 */
class Payment_Validator {



	/**
	 * Validate that payment settings have at least one gateway enabled when payments are enabled.
	 *
	 * @param array $payments_settings The payment settings to validate.
	 * @return true|WP_Error True if valid, WP_Error if validation fails.
	 */
	public static function validate_payment_gateways( $payments_settings ) {
		if ( ! $payments_settings ) {
			return true;
		}

		$enable_payment = Arr::get( $payments_settings, 'enable_payment', false );
		$items          = Arr::get( $payments_settings, 'items', array() );
		$payment_type   = Arr::get( $payments_settings, 'type', 'native' );

		if ( $enable_payment && ! empty( $items ) ) {
			// Different validation based on payment type
			if ( $payment_type === 'woocommerce' ) {
				// For WooCommerce, check that a product is selected
				$woo_product = Arr::get( $payments_settings, 'woo_product', 0 );

				if ( empty( $woo_product ) ) {
					return new WP_Error(
						'woocommerce_product_required',
						__( 'Payment is enabled with WooCommerce checkout, but no WooCommerce product is selected. Please select a product.', 'quillbooking' ),
						array( 'status' => 400 )
					);
				}

				// Also check if WooCommerce is active
				if ( ! function_exists( 'WC' ) ) {
					return new WP_Error(
						'woocommerce_not_active',
						__( 'Payment is enabled with WooCommerce checkout, but WooCommerce is not active. Please activate WooCommerce or select a different payment method.', 'quillbooking' ),
						array( 'status' => 400 )
					);
				}
			} else {
				// For native payment, check if at least one payment gateway is enabled
				$found_gateway    = false;
				$payment_gateways = Payment_Gateways_Manager::instance()->get_items();
				$payment_methods  = Arr::get( $payments_settings, 'payment_methods', array() );

				if ( ! empty( $payment_methods ) ) {
					$found_gateway = true;
				} elseif ( ! empty( $payment_gateways ) ) {
					foreach ( $payment_gateways as $gateway ) {
						if ( Arr::get( $payments_settings, 'enable_' . $gateway->slug, false ) ) {
							$found_gateway = true;
							break;
						}
					}
				}

				if ( ! $found_gateway ) {
					return new WP_Error(
						'payment_gateway_required',
						__( 'Payment is enabled but no payment gateway is selected. Please select at least one payment gateway.', 'quillbooking' ),
						array( 'status' => 400 )
					);
				}
			}
		}

		return true;
	}
}
