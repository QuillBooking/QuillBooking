<?php
/**
 * Class: Products
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe;

/**
 * Utils Class
 *
 * @since 1.0.0
 */
class Utils {

	/**
	 * Zero-decimal currencies
	 * UGX removed from the list, see special cases
	 * https://stripe.com/docs/currencies#zero-decimal
	 */
	const ZERO_DECIMAL_CURRENCIES = array( 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'VND', 'VUV', 'XAF', 'XOF', 'XPF' );

	/**
	 * Convert amount to stripe amount
	 *
	 * @since 1.0.0
	 *
	 * @param integer|float $value
	 * @param string        $currency
	 * @return integer
	 */
	public static function to_stripe_amount( $value, $currency ) {
		if ( in_array( strtoupper( $currency ), self::ZERO_DECIMAL_CURRENCIES, true ) ) {
			return intval( $value );
		} else {
			return intval( $value * 100 );
		}
	}

	/**
	 * Get amount from stripe amount
	 *
	 * @since 1.0.0
	 *
	 * @param integer $value
	 * @param string  $currency
	 * @return integer|float
	 */
	public static function from_stripe_amount( $value, $currency ) {
		if ( in_array( strtoupper( $currency ), self::ZERO_DECIMAL_CURRENCIES, true ) ) {
			return intval( $value );
		} else {
			return floatval( $value / 100 );
		}
	}

}
