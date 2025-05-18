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
use \Exception;

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
		// Initialize Stripe client if not already
		if (!$this->stripe_client && isset($this->mode_settings['secret_key'])) {
			$this->stripe_client = new StripeClient($this->mode_settings['secret_key']);
		}

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
					'booking_id'   => $this->booking->hash_id,
					'booking_numeric_id' => $this->booking->id,
					'guest_name'   => $this->booking->guest->name,
					'guest_email'  => $this->booking->guest->email,
				),
			)
		);
	}

	/**
	 * Initialize stripe client and fetch booking data
	 *
	 * @since 1.0.0
	 *
	 * @return array Returns booking and customer data
	 * @throws Exception
	 */
	private function ajax_init_stripe_client() {
		$booking_id = isset( $_POST['booking_id'] ) ? sanitize_text_field( $_POST['booking_id'] ) : null;
		if ( ! $booking_id ) {
			throw new Exception( __( 'Invalid booking ID', 'quillbooking' ) );
		}

		$booking = \QuillBooking\Models\Booking_Model::getByHashId( $booking_id );
		if ( ! $booking ) {
			throw new Exception( __( 'Booking not found', 'quillbooking' ) );
		}

		$event = $booking->event;
		if ( ! $event ) {
			throw new Exception( __( 'Event not found', 'quillbooking' ) );
		}

		// Check if payment is required
		if ( ! $event->requirePayment() ) {
			throw new Exception( __( 'Payment is not required for this event', 'quillbooking' ) );
		}

		// Initialize Stripe client
		if (!$this->stripe_client && isset($this->mode_settings['secret_key'])) {
			$this->stripe_client = new StripeClient($this->mode_settings['secret_key']);
		}

		// Set booking for further use
		$this->booking = $booking;

		return [
			'booking' => $booking,
			'event' => $event
		];
	}

	public function __construct($payment_gateway = null) {
		if ($payment_gateway === null) {
			$payment_gateway = new Payment_Gateway();
		}
		
		// Call parent constructor 
		parent::__construct($payment_gateway);
		
		$this->mode_settings = $this->payment_gateway->get_mode_settings();
		
		// Initialize Stripe client
		if (isset($this->mode_settings['secret_key'])) {
			$this->stripe_client = new StripeClient($this->mode_settings['secret_key']);
		}
		
		// Register init Stripe AJAX handler
		add_action('wp_ajax_quillbooking_init_stripe', array($this, 'ajax_init_stripe'));
		add_action('wp_ajax_nopriv_quillbooking_init_stripe', array($this, 'ajax_init_stripe'));
	}

	/**
	 * AJAX handler for initializing Stripe payment
	 */
	public function ajax_init_stripe() {
		try {
			$data = $this->ajax_init_stripe_client();
			$booking = $data['booking'];
			$event = $data['event'];

			// Get customer
			$name = $booking->guest->name;
			$email = $booking->guest->email;
			
			$customer = [
				'name' => $name,
				'email' => $email,
				'id' => null
			];
			
			// Create or get customer in Stripe
			$customers = new Customers($this->mode_settings);
			if ($email) {
				$customer['id'] = $customers->get($email);
			}
			if (!$customer['id']) {
				$customer['id'] = $customers->create($name, $email);
			}

			// Get payment amount
			$amount = $event->getTotalPrice();
			$currency = $event->payments_settings['currency'] ?? 'USD';

			// Create payment intent
			$payment_intent = $this->create_payment_intent($amount, $currency, $customer['id']);

			// Store payment intent ID in booking meta
			$booking->update_meta('stripe_payment_intent_id', $payment_intent->id);
			$booking->update_meta('payment_amount', $amount);
			$booking->update_meta('payment_currency', $currency);
			$booking->update_meta('payment_customer_id', $customer['id']);

			// Return client secret
			wp_send_json_success(
				array(
					'client_secret'   => $payment_intent->client_secret,
					'publishable_key' => $this->payment_gateway->get_mode_settings()['publishable_key'],
					'customer'        => $customer,
					'amount'          => $amount,
					'currency'        => $currency,
				)
			);
		} catch (Exception $e) {
			wp_send_json_error(array('message' => $e->getMessage()));
		}
	}
}
