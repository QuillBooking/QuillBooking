<?php
/**
 * Class Payment_Gateways Manager
 * This class is responsible for handling the payment_gateways
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Managers;

use QuillBooking\Payment_Gateway\Payment_Gateway;
use QuillBooking\Abstracts\Manager;
use QuillBooking\Traits\Singleton;

/**
 * Payment_Gateways class
 */
final class Payment_Gateways_Manager extends Manager {

	use Singleton;

	/**
	 * Register Payment_Gateway
	 *
	 * @param Payment_Gateway $payment_gateway
	 */
	public function register_payment_gateway( Payment_Gateway $payment_gateway ) {
		parent::register(
			$payment_gateway,
			Payment_Gateway::class,
			'slug',
			array(
				'name'        => 'name',
				'description' => 'description',
				'settings'    => 'get_settings',
				'fields'      => 'get_fields',
				'enabled'     => 'is_enabled',
			)
		);
	}
}
