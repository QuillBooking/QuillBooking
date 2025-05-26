<?php
/**
 * Class Payment_Service
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Paypal;

use Illuminate\Support\Arr;
use QuillBooking\Payment_Gateway\Payment_Service as Abstract_Payment_Service;

/**
 * Payment Service class.
 */
class Payment_Service extends Abstract_Payment_Service {

	/**
	 * Generate payment URL.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function process_payment() {
		// Get payment URL.
		$payment_url = $this->get_payment_url( $this->booking );
		if ( is_wp_error( $payment_url ) ) {
			wp_send_json_error( $payment_url->get_error_message() );
		}

		wp_send_json_success(
			array(
				'redirect_url' => $payment_url,
				'booking'      => $this->booking,
			)
		);
	}

	/**
	 * Get payment URL.
	 *
	 * @since 1.0.0
	 *
	 * @return string|\WP_Error
	 */
	public function get_payment_url() {
		$event = $this->booking->event;
		$items = $this->booking->event->getItems();
		if ( empty( $items ) ) {
			return new \WP_Error( 'no_items', __( 'No items found', 'quillbooking' ) );
		}

		$currency = Arr::get( $event->payments_settings, 'currency', 'USD' );
		$items    = $this->prepare_items( $items );
		$args     = array(
			'cmd'           => '_cart',
			'upload'        => '1',
			'rm'            => is_ssl() ? '2' : '1',
			'business'      => $this->mode_settings['email'],
			'email'         => $this->booking->guest->email,
			'no_shipping'   => '1',
			'shipping'      => '0',
			'no_note'       => '1',
			'currency_code' => $currency,
			'charset'       => 'UTF-8',
			'notify_url'    => esc_url_raw( $this->get_notify_url() ),
			'return'        => esc_url_raw( $this->get_return_url() ),
			'cancel_return' => esc_url_raw( $this->get_cancel_url() ),
			'custom'        => http_build_query(
				array(
					'booking_id' => $this->booking->hash_id,
				)
			),
			'items'         => $items,
		);

		$this->booking->order()->create(
			array(
				'payment_method' => 'paypal',
				'status'         => 'pending',
				'total'          => $this->booking->event->getTotalPrice(),
				'items'          => $items,
				'currency'       => $currency,
			)
		);

		// Generate payment URL.
		$payment_url = $this->generate_payment_url( $args );

		return $payment_url;
	}

	/**
	 * Prepare items.
	 *
	 * @since 1.0.0
	 *
	 * @param array $items   Items.
	 *
	 * @return array
	 */
	public function prepare_items( $items ) {
		$prepared_items = array();
		foreach ( $items as $index => $item ) {
			$index            = $index + 1;
			$prepared_items[] = array(
				"item_name_{$index}" => $item['item'],
				"amount_{$index}"    => $item['price'],
				"quantity_{$index}"  => 1,
			);
		}

		return $prepared_items;
	}

	/**
	 * Generate payment URL.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args Arguments.
	 *
	 * @return string
	 */
	public function generate_payment_url( $args ) {
		if ( 'live' === $this->mode_settings['mode'] ) {
			$paypal_url = 'https://www.paypal.com/cgi-bin/webscr/';
		} else {
			$paypal_url       = 'https://www.sandbox.paypal.com/cgi-bin/webscr/';
			$args['test_ipn'] = 1;
		}

		$items = $args['items'];
		unset( $args['items'] );
		$paypal_url  = $paypal_url . '?' . http_build_query( $args );
		$payment_url = add_query_arg( $items, $paypal_url );

		return $payment_url;
	}

	/**
	 * Get notify URL.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_notify_url() {
		return home_url( "?quillbooking_paypal_webhook={$this->mode_settings['mode']}" );
	}

	/**
	 * Get return URL.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_return_url() {
		return home_url( "?quillbooking_payment={$this->mode_settings['mode']}&method={$this->payment_gateway->slug}&action=return&booking_id={$this->booking->hash_id}" );
	}

	/**
	 * Get cancel URL.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_cancel_url() {
		return home_url( "?quillbooking_payment={$this->mode_settings['mode']}&method={$this->payment_gateway->slug}&action=cancel&booking_id={$this->booking->hash_id}" );
	}

		/**
		 * Set booking for the payment service.
		 *
		 * @since 1.0.0
		 *
		 * @param \QuillBooking\Models\Booking_Model $booking The booking model.
		 * @return self
		 */
	public function set_booking( $booking ) {
		$this->booking       = $booking;
		$this->mode_settings = $this->payment_gateway->get_mode_settings();
		return $this;
	}
}
