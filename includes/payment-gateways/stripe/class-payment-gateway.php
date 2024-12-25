<?php
/**
 * Payment Gateway class.
 *
 * This class is responsible for handling the Payment Gateway
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe;

use QuillBooking\Payment_Gateway\Payment_Gateway as Abstract_Payment_Gateway;
use QuillBooking\Payment_Gateways\Stripe\REST_API\REST_API;

/**
 * Payment Gateway class
 */
class Payment_Gateway extends Abstract_Payment_Gateway {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Stripe';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'stripe';

	/**
	 * Description
	 *
	 * @var string
	 */
	public $description = 'Stripe Payment Gateway';

	/**
	 * Classes
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
		$mode     = $mode ?? $settings['mode'] ?? null;
		if ( ! in_array( $mode, array( 'test', 'live' ), true ) ) {
			return false;
		}

		$result = array(
			'mode'                    => $mode,
			'customer_elements_label' => $settings['customer_elements_label'],
			'customer_checkout_label' => $settings['customer_checkout_label'],
		);
		$keys   = array( 'publishable_key', 'secret_key', 'webhook_id', 'webhook_secret' );
		foreach ( $keys as $key ) {
			if ( empty( $settings[ "{$mode}_$key" ] ) ) {
				return false;
			}
			$result[ $key ] = $settings[ "{$mode}_$key" ];
		}

		return $result;
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
	 * Is currency supported by the gateway
	 *
	 * @since 1.0.0
	 *
	 * @param string $currency Currency.
	 * @return boolean
	 */
	public function is_currency_supported( $currency ) { // phpcs:ignore
		return true;
	}
}
