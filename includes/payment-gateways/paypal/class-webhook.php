<?php
/**
 * Webhook class.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Paypal;

use Illuminate\Support\Arr;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Payment_Gateways\Paypal\Payment_Gateway;

/**
 * Webhook class.
 */
class Webhook {

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
		$webhook_mode = sanitize_text_field( Arr::get( $_GET, 'quillbooking_paypal_webhook', null ) );
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

		$webhook_event = @file_get_contents( 'php://input' );
		if ( empty( $webhook_event ) ) {
			$this->respond( 400, __( 'Invalid webhook payload.', 'quillbooking' ) );
		}

		$event_data = array();
		parse_str( $webhook_event, $event_data );

		if ( empty( $event_data ) ) {
			$this->respond( 400, __( 'Failed to parse webhook event data.', 'quillbooking' ) );
		}

		$booking_hash = sanitize_text_field( Arr::get( $event_data, 'custom', null ) );
		$booking_hash = explode( '=', $booking_hash );
		$booking_id   = end( $booking_hash );
		$booking      = Booking_Model::getByHashId( $booking_id );
		if ( ! $booking || ! $booking->order ) {
			$this->respond( 400, __( 'Invalid booking.', 'quillbooking' ) );
		}

		if ( ! $this->validate_ipn( $webhook_event, $mode_settings ) ) {
			$booking->changeStatus( 'cancelled' );
			$this->respond( 400, __( 'Invalid IPN verification.', 'quillbooking' ) );
		}

		$status = strtolower( Arr::get( $event_data, 'payment_status', '' ) );
		if ( $booking->order->status === $status && $status !== 'pending' ) {
			$booking->changeStatus( 'cancelled' );
			$this->respond( 200, __( 'Webhook already processed.', 'quillbooking' ) );
		}

		switch ( $status ) {
			case 'completed':
				$this->process_completed( $booking, $event_data );
				break;

			case 'refunded':
			case 'reversed':
				$this->process_refund( $booking, $event_data );
				break;

			case 'pending':
				$this->process_pending( $booking, $event_data );
				break;

			default:
				$this->respond( 200, __( 'Unhandled payment status.', 'quillbooking' ) );
		}

		$this->respond( 200, __( 'Webhook processed successfully.', 'quillbooking' ) );
	}

	/**
	 * Process a refund webhook.
	 *
	 * @param Booking_Model $booking The booking model.
	 * @param array         $event_data The webhook event data.
	 * @return void
	 */
	private function process_refund( $booking, $event_data ) {
		$booking->changeStatus( 'cancelled' );
		$booking->order()->update(
			array(
				'status' => 'refunded',
			)
		);

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Payment refunded.', 'quillbooking' ),
				'details' => __( 'The payment for bookinghas been refunded.', 'quillbooking' ),
			)
		);
	}

	/**
	 * Process a completed webhook.
	 *
	 * @param Booking_Model $booking The booking model.
	 * @param array         $event_data The webhook event data.
	 * @return void
	 */
	private function process_completed( $booking, $event_data ) {
		$booking->changeStatus( 'scheduled' );
		$booking->order()->update(
			array(
				'status' => 'completed',
			)
		);

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Payment completed.', 'quillbooking' ),
				'details' => __( 'The payment for booking has been completed.', 'quillbooking' ),
			)
		);
	}

	/**
	 * Process a pending webhook.
	 *
	 * @param Booking_Model $booking The booking model.
	 * @param array         $event_data The webhook event data.
	 * @return void
	 */
	private function process_pending( $booking, $event_data ) {
		$booking->changeStatus( 'cancelled' );
		$pending_reason = Arr::get( $event_data, 'pending_reason', null );
		$pending_reason = $this->get_pending_reason( $pending_reason );

		$booking->logs()->create(
			array(
				'type'    => 'error',
				'message' => __( 'Payment pending.', 'quillbooking' ),
				'details' => sprintf( 'The payment for booking is pending. Reason: %s', $pending_reason ),
			)
		);
	}

	/**
	 * Validate PayPal IPN data.
	 *
	 * @param string $raw_ipn_data The raw IPN data received.
	 * @return bool Whether the IPN data is valid.
	 */
	private function validate_ipn( $raw_ipn_data ) {
		$ipn_data = array();
		parse_str( $raw_ipn_data, $ipn_data );

		$ipn_data['cmd'] = '_notify-validate';

		$is_sandbox = ( $this->payment_gateway->get_mode_settings()['mode'] === 'sandbox' );
		$paypal_url = $is_sandbox ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr' : 'https://ipnpb.paypal.com/cgi-bin/webscr';

		$response = wp_safe_remote_post(
			$paypal_url,
			array(
				'body'        => $ipn_data,
				'timeout'     => 60,
				'httpversion' => '1.1',
				'user-agent'  => 'QuillBooking/' . QUILLBOOKING_VERSION,
			)
		);

		if ( is_wp_error( $response ) || wp_remote_retrieve_body( $response ) !== 'VERIFIED' ) {
			return false;
		}

		return true;
	}

	/**
	 * Get the pending reason message.
	 *
	 * @since 1.0.0
	 *
	 * @param string $reason The pending reason code.
	 * @return string The localized message for the pending reason.
	 */
	private function get_pending_reason( $reason ) {
		$messages = array(
			'echeck'            => __( 'Payment made via eCheck and will clear automatically in 5-8 days.', 'quillbooking' ),
			'address'           => __( 'Payment requires a confirmed customer address and must be accepted manually through PayPal.', 'quillbooking' ),
			'intl'              => __( 'Payment must be accepted manually through PayPal due to international account regulations.', 'quillbooking' ),
			'multi-currency'    => __( 'Payment received in non-shop currency and must be accepted manually through PayPal.', 'quillbooking' ),
			'paymentreview'     => __( 'Payment is being reviewed by PayPal staff as high-risk or in possible violation of government regulations.', 'quillbooking' ),
			'regulatory_review' => __( 'Payment is being reviewed by PayPal staff as high-risk or in possible violation of government regulations.', 'quillbooking' ),
			'unilateral'        => __( 'Payment was sent to non-confirmed or non-registered email address.', 'quillbooking' ),
			'upgrade'           => __( 'PayPal account must be upgraded before this payment can be accepted.', 'quillbooking' ),
			'verify'            => __( 'PayPal account is not verified. Verify account in order to accept this payment.', 'quillbooking' ),
			'other'             => __( 'Payment is pending for unknown reasons. Contact PayPal support for assistance.', 'quillbooking' ),
		);

		$reason = strtolower( $reason );

		return isset( $messages[ $reason ] ) ? $messages[ $reason ] : __( 'Payment marked as pending.', 'quillbooking' );
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
