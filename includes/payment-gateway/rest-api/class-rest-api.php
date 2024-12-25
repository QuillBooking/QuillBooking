<?php
/**
 * REST API class.
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateway\REST_API;

use QuillBooking\Payment_Gateway\Payment_Gateway;

/**
 * REST class.
 *
 * @since 1.0.0
 */
class REST_API {

	/**
	 * Payment_Gateway
	 *
	 * @var Payment_Gateway
	 */
	protected $payment_gateway;

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		// 'settings_controller' => REST_Settings_Controller::class,
	);

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Payment_Gateway $payment_gateway payment_gateway.
	 */
	public function __construct( $payment_gateway ) {
		$this->payment_gateway = $payment_gateway;

		if ( ! empty( static::$classes['settings_controller'] ?? null ) ) {
			new static::$classes['settings_controller']( $this->payment_gateway );
		}
	}
}
