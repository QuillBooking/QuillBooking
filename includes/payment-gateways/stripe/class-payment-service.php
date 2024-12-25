<?php
/**
 * Class Payment_Service
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe;

use Illuminate\Support\Arr;
use QuillBooking\Payment_Gateway\Payment_Service as Abstract_Payment_Service;
use Stripe\StripeClient;
use Stripe\PaymentIntent;

/**
 * Payment Service class.
 */
class Payment_Service extends Abstract_Payment_Service {

	/**
	 * Stripe client
	 *
	 * @var StripeClient
	 */
	private $stripe_client;

	/**
	 * Generate payment URL.
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param array         $args    Arguments.
	 *
	 * @return void
	 */
	public function process_payment() {
		$this->ajax_init_stripe_client();

		try {
			$event          = $this->booking->event;
			$customer_id    = $this->get_customer();
			$currency       = Arr::get( $event->payments_settings, 'currency', 'USD' );
			$total          = $event->getTotalPrice();
			$payment_intent = $this->create_payment_intent( $total, $currency, $customer_id );
			if ( empty( $payment_intent->client_secret ) ) {
				throw new Exception( 'Cannot find client secret of payment intent' );
			}

			wp_send_json_success(
				array(
					'id'            => $payment_intent->id,
					'client_secret' => $payment_intent->client_secret,
				)
			);
		} catch ( Throwable $e ) {
			$this->booking->changeStatus( 'cancelled' );
			wp_send_json_error( array( 'message' => esc_html__( 'Unexpected error', 'quillbooking' ) ), 500 );
		}
		exit;

	}

	/**
	 * Get customer
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	private function get_customer() {
		$name  = $this->booking->guest->name;
		$email = $this->booking->guest->email;
		if ( ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
			$email = null;
		}
		$customer_id = null;

		$customers = new Customers( $this->mode_settings );
		if ( $email ) {
			$customer_id = $customers->get( $email );
		}
		if ( ! $customer_id ) {
			$customer_id = $customers->create( $name, $email );
		}
		return $customer_id;
	}

	/**
	 * Create payment intent
	 *
	 * @since 1.0.0
	 *
	 * @param float   $amount
	 * @param string  $currency
	 * @param integer $booking_id
	 * @param string  $customer_id
	 * @return PaymentIntent
	 */
	private function create_payment_intent( $amount, $currency, $customer_id ) {
		return $this->stripe_client->paymentIntents->create(
			array(
				'amount'                    => Utils::to_stripe_amount( $amount, $currency ),
				'currency'                  => strtolower( $currency ),
				'description'               => get_bloginfo( 'name' ),
				'customer'                  => $customer_id,
				'automatic_payment_methods' => array(
					'enabled' => 'true',
				),
				'metadata'                  => array(
					'quillbooking' => true,
					'booking_id'   => $this->booking->id,
					'guest_name'   => $this->booking->guest->name,
					'guest_email'  => $this->booking->guest->email,
				),
			)
		);
	}

	/**
	 * Initialize mode settings for ajax request
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function ajax_init_stripe_client() {
		if ( ! $this->mode_settings ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Stripe is not configured', 'quillbooking' ) ), 500 );
			exit;
		}

		$this->stripe_client = new StripeClient( $this->mode_settings['secret_key'] );
	}
}
