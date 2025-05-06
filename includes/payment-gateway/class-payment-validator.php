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

		if ( $enable_payment && ! empty( $items ) ) {
			// Check if at least one payment gateway is enabled
			$found_gateway    = false;
			$payment_gateways = Payment_Gateways_Manager::instance()->get_items();

			if ( ! empty( $payment_gateways ) ) {
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

		return true;
	}
}
