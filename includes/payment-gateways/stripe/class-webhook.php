<?php
/**
 * Webhook class.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe;

use Illuminate\Support\Arr;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Payment_Gateways\Stripe\Payment_Gateway;
use Stripe\StripeClient;
use Stripe\Webhook as StripeWebhook;

/**
 * Webhook class.
 */
class Webhook {

	/**
	 * Stripe client
	 *
	 * @var StripeClient
	 */
	private $stripe_client;

	/**
	 * Mode.
	 *
	 * @var string
	 */
	private $mode;

	/**
	 * Payment Gateway instance.
	 *
	 * @var Payment_Gateway
	 */
	protected $payment_gateway;

	/**
	 * Constructor.
	 *
	 * @param Payment_Gateway $payment_gateway Payment Gateway instance.
	 */
	public function __construct( $payment_gateway ) {
		$this->payment_gateway = $payment_gateway;

		// Hook into the loading process to process webhooks.
		add_action( 'quillbooking_loaded', array( $this, 'maybe_process_webhook' ) );
	}

	/**
	 * Processes the Stripe webhook.
	 *
	 * @return void
	 */
	public function maybe_process_webhook() {
		$webhook_mode = sanitize_text_field( Arr::get( $_GET, 'quillbooking_stripe_webhook', null ) );
		if ( ! $webhook_mode ) {
			return;
		}

		$mode_settings = $this->payment_gateway->get_mode_settings();

		if ( ! $mode_settings ) {
			$this->respond( 200, __( 'Mode settings not configured.', 'quillbooking' ) );
		}

		if ( $mode_settings['mode'] !== $webhook_mode ) {
			$this->respond( 200, __( 'Webhook mode mismatch.', 'quillbooking' ) );
		}

		$this->mode          = $mode_settings['mode'];
		$this->stripe_client = new StripeClient( $mode_settings['secret_key'] );

		try {
			$payload = @file_get_contents( 'php://input' );
			$event   = StripeWebhook::constructEvent(
				$payload,
				$_SERVER['HTTP_STRIPE_SIGNATURE'],
				$mode_settings['webhook_secret']
			);

			error_log( 'Webhook Event Data: ' . wp_json_encode( $event ) );
			
			// Process the webhook event
			$this->process_webhook_event($event);
			
		} catch ( \Throwable $e ) {
			error_log('Stripe Webhook Error: ' . $e->getMessage());
			$this->respond( 400, $e->getMessage() );
		}
		
		// If we got here, everything went well
		$this->respond( 200, 'Webhook processed successfully' );
	}
	
	/**
	 * Process webhook event
	 *
	 * @param \Stripe\Event $event Stripe event.
	 * @return void
	 */
	private function process_webhook_event($event) {
		switch ($event->type) {
			case 'payment_intent.succeeded':
				$payment_intent = $event->data->object;
				$this->process_payment_intent_succeeded($payment_intent);
				break;
			
			case 'payment_intent.payment_failed':
				$payment_intent = $event->data->object;
				$this->process_payment_intent_failed($payment_intent);
				break;
				
			// Handle other webhook events as needed
		}
	}

	/**
	 * Process a successful payment intent
	 *
	 * @param object $payment_intent The payment intent object from Stripe
	 */
	private function process_payment_intent_succeeded($payment_intent) {
		// Find booking by payment intent ID
		$booking = $this->find_booking_by_payment_intent($payment_intent->id);
		
		if (!$booking) {
			return;
		}
		
		// Update booking payment status
		$booking->setPaymentStatus('completed');
		
		// Log the payment
		$booking->logs()->create([
			'type' => 'info',
			'message' => __('Payment processed', 'quillbooking'),
			'details' => sprintf(
				__('Payment of %s %s processed successfully via Stripe', 'quillbooking'),
				$payment_intent->amount / 100,
				strtoupper($payment_intent->currency)
			),
		]);
		
		// Create order if it doesn't exist
		if (!$booking->order) {
			$booking->order()->create([
				'items' => $booking->event->getItems(),
				'total' => $payment_intent->amount / 100,
				'currency' => strtoupper($payment_intent->currency),
				'payment_method' => 'stripe',
				'status' => 'completed',
			]);
		} else {
			$booking->order->status = 'completed';
			$booking->order->save();
		}
	}

	/**
	 * Process a failed payment intent
	 *
	 * @param object $payment_intent The payment intent object from Stripe
	 */
	private function process_payment_intent_failed($payment_intent) {
		// Find booking by payment intent ID
		$booking = $this->find_booking_by_payment_intent($payment_intent->id);
		
		if (!$booking) {
			return;
		}
		
		// Update booking payment status
		$booking->setPaymentStatus('failed');
		
		// Log the payment failure
		$booking->logs()->create([
			'type' => 'error',
			'message' => __('Payment failed', 'quillbooking'),
			'details' => sprintf(
				__('Payment of %s %s failed: %s', 'quillbooking'),
				$payment_intent->amount / 100,
				strtoupper($payment_intent->currency),
				$payment_intent->last_payment_error ? $payment_intent->last_payment_error->message : 'Unknown error'
			),
		]);
	}

	/**
	 * Find booking by payment intent ID
	 *
	 * @param string $payment_intent_id The payment intent ID
	 * @return \QuillBooking\Models\Booking_Model|null
	 */
	private function find_booking_by_payment_intent($payment_intent_id) {
		global $wpdb;
		
		$table_name = $wpdb->prefix . 'quillbooking_booking_meta';
		
		$query = $wpdb->prepare(
			"SELECT booking_id FROM {$table_name} WHERE meta_key = 'stripe_payment_intent_id' AND meta_value = %s LIMIT 1",
			$payment_intent_id
		);
		
		$booking_id = $wpdb->get_var($query);
		
		if (!$booking_id) {
			return null;
		}
		
		return \QuillBooking\Models\Booking_Model::find($booking_id);
	}

	/**
	 * Respond to a webhook request.
	 *
	 * @param int    $status HTTP status code.
	 * @param string $content Response content.
	 * @return void
	 */
	private function respond( $status, $content = '' ) {
		http_response_code( $status );
		if ( ! empty( $content ) ) {
			echo esc_html( $content );
		}
		exit;
	}
}
