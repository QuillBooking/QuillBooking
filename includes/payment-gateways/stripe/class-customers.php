<?php
/**
 * Class: Customers
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe;

use Stripe\StripeClient;

/**
 * Customers Class
 *
 * @since 1.0.0
 */
class Customers {

	/**
	 * Stripe Client
	 *
	 * @since 1.0.0
	 *
	 * @var StripeClient
	 */
	private $stripe_client;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param array|null $mode_settings Mode settings or null for current mode.
	 */
	public function __construct( $mode_settings = null ) {
		if ( ! $mode_settings ) {
			$mode_settings = Payment_Gateway::instance()->get_mode_settings();
		}

		$this->stripe_client = new StripeClient( $mode_settings['secret_key'] );
	}

	/**
	 * Get customer by email
	 *
	 * @since 1.0.0
	 *
	 * @param string $email Email.
	 * @return string|null
	 */
	public function get( $email ) {
		$customers = $this->stripe_client->customers->all(
			array(
				'email' => $email,
			)
		);
		return $customers->data[0]->id ?? null;
	}

	/**
	 * Create customer
	 *
	 * @since 1.0.0
	 *
	 * @param string|null $name Name.
	 * @param string|null $email Email.
	 * @return string
	 */
	public function create( $name, $email ) {
		$customer = $this->stripe_client->customers->create(
			$this->filter_params(
				array(
					'name'  => $name,
					'email' => $email,
				)
			)
		);
		return $customer->id;
	}

	/**
	 * Filter params
	 *
	 * @since 1.0.0
	 *
	 * @param array $array Array to filter.
	 * @return array
	 */
	private function filter_params( $array ) {
		return array_filter(
			$array,
			function( $element ) {
				return $element !== null;
			}
		);
	}

}
