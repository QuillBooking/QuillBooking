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
		// Payment_Service and Webhook are now initialized via hooks
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
		if ( ! in_array( $mode, array( 'sandbox', 'live' ), true ) ) {
			return false;
		}

		$result = array(
			'mode' => $mode,
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

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'publishable_key' => array(
				'type'        => 'text',
				'label'       => __( 'Publishable Key', 'quillbooking' ),
				'description' => __( 'The publishable key for the Stripe account.', 'quillbooking' ),
				'required'    => true,
			),
			'secret_key'      => array(
				'type'        => 'text',
				'label'       => __( 'Secret Key', 'quillbooking' ),
				'description' => __( 'The secret key for the Stripe account.', 'quillbooking' ),
				'required'    => true,
			),
		);
	}
}
