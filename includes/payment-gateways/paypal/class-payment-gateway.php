<?php
/**
 * Payment Gateway class.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Paypal;

use Illuminate\Support\Arr;
use QuillBooking\Payment_Gateway\Payment_Gateway as Abstract_Payment_Gateway;
use QuillBooking\Payment_Gateways\Paypal\Payment_Service;
use QuillBooking\Payment_Gateways\Paypal\REST_API\REST_API;
use QuillBooking\Payment_Gateways\Paypal\Webhook;

/**
 * Payment Gateway class.
 */
class Payment_Gateway extends Abstract_Payment_Gateway {

	/**
	 * Payment Gateway Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Paypal';

	/**
	 * Payment Gateway Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'paypal';

	/**
	 * Payment Gateway Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Paypal Payment Gateway';

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		'rest_api' => REST_API::class,
	);

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		parent::__construct();
		new Payment_Service( $this );
		new Webhook( $this );
	}

	/**
	 * Get mode settings
	 *
	 * @since 1.0.0
	 *
	 * @param string $mode Mode. Current mode will be used if not specified.
	 * @return array|false
	 */
	public function get_mode_settings( $mode = null ) {
		$settings = $this->get_settings();
		$mode     = Arr::get( $settings, 'mode', null );
		if ( ! in_array( $mode, array( 'sandbox', 'live' ), true ) ) {
			return false;
		}

		$mode_settings = array(
			'mode' => $mode,
		);
		$keys          = array( 'email', 'disable_verification' );
		foreach ( $keys as $key ) {
			if ( empty( Arr::get( $settings, "{$mode}_$key", '' ) ) ) {
				return false;
			}
			$mode_settings[ $key ] = Arr::get( $settings, "{$mode}_$key", '' );
		}

		return $mode_settings;
	}

	/**
	 * Is currency supported by the gateway
	 *
	 * @since 1.0.0
	 *
	 * @param string $currency Currency.
	 * @return boolean
	 */
	public function is_currency_supported( $currency ) {
		$supported_currencies = array( 'AUD', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'RUB', 'SGD', 'SEK', 'CHF', 'THB', 'USD' );
		return in_array( strtoupper( $currency ), $supported_currencies, true );
	}

	/**
	 * validate the integration
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 *
	 * @return bool
	 */
	public function validate( $settings ) {
		$mode                         = Arr::get( $settings, 'mode', null );
		$sandbox_email                = Arr::get( $settings, 'sandbox_email', '' );
		$live_email                   = Arr::get( $settings, 'live_email', '' );
		$sandbox_disable_verification = Arr::get( $settings, 'sandbox_disable_verification', false );
		$live_disable_verification    = Arr::get( $settings, 'live_disable_verification', false );
		$disable_verification         = $mode === 'sandbox' ? $sandbox_disable_verification : $live_disable_verification;

		if ( ! in_array( $mode, array( 'sandbox', 'live' ), true ) ) {
			return new \WP_Error( 'invalid_mode', __( 'Invalid mode.', 'quillbooking' ) );
		}

		if ( ! empty( $sandbox_email ) && ! is_email( $sandbox_email ) ) {
			return new \WP_Error( 'invalid_sandbox_email', __( 'Invalid sandbox email.', 'quillbooking' ) );
		}

		if ( ! empty( $live_email ) && ! is_email( $live_email ) ) {
			return new \WP_Error( 'invalid_live_email', __( 'Invalid live email.', 'quillbooking' ) );
		}

		if ( ! is_bool( $disable_verification ) ) {
			return new \WP_Error( 'invalid_disable_verification', __( 'Invalid disable verification.', 'quillbooking' ) );
		}

		return true;
	}

	/**
	 * Is gateway and method configured
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public function is_configured() { // phpcs:ignore
		return (bool) $this->get_mode_settings();
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'email'                => array(
				'type'        => 'email',
				'label'       => __( 'Email', 'quillbooking' ),
				'description' => __( 'The email address for the PayPal account.', 'quillbooking' ),
				'required'    => true,
			),
			'disable_verification' => array(
				'type'        => 'checkbox',
				'label'       => __( 'Disable Verification', 'quillbooking' ),
				'description' => __( 'Disable verification for the PayPal account.', 'quillbooking' ),
				'required'    => false,
			),
		);
	}
}
