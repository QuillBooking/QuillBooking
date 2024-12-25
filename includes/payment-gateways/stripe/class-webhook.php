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
use QuillBooking\Payment_Gateways\PayPal\Payment_Gateway;
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
	 * Processes the PayPal webhook.
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
		} catch ( Throwable $e ) {
			$this->respond( 400 );
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
