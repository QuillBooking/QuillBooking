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
		$event_type = $event->type;
		
		// Handle payment_intent.succeeded event
		if ($event_type === 'payment_intent.succeeded') {
			$payment_intent = $event->data->object;
			$booking_hash_id = $payment_intent->metadata->booking_id ?? null;
			
			if (!$booking_hash_id) {
				error_log('No booking_id found in payment intent metadata');
				return;
			}
			
			// Get booking by hash_id
			$booking = Booking_Model::getByHashId($booking_hash_id);
			
			if (!$booking) {
				error_log('Booking not found with hash_id: ' . $booking_hash_id);
				return;
			}
			
			// Update booking status to confirmed/paid
			$booking->changeStatus('confirmed');
			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __('Payment completed', 'quillbooking'),
					'details' => __('Payment completed via Stripe', 'quillbooking'),
				)
			);
			
			// Trigger action for other plugins
			do_action('quillbooking_stripe_payment_completed', $booking, $payment_intent);
		}
		
		// Handle payment_intent.payment_failed event
		if ($event_type === 'payment_intent.payment_failed') {
			$payment_intent = $event->data->object;
			$booking_hash_id = $payment_intent->metadata->booking_id ?? null;
			
			if (!$booking_hash_id) {
				error_log('No booking_id found in payment intent metadata');
				return;
			}
			
			// Get booking by hash_id
			$booking = Booking_Model::getByHashId($booking_hash_id);
			
			if (!$booking) {
				error_log('Booking not found with hash_id: ' . $booking_hash_id);
				return;
			}
			
			// Update booking status to failed
			$booking->changeStatus('cancelled');
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __('Payment failed', 'quillbooking'),
					'details' => __('Payment failed via Stripe', 'quillbooking'),
				)
			);
			
			// Trigger action for other plugins
			do_action('quillbooking_stripe_payment_failed', $booking, $payment_intent);
		}
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
