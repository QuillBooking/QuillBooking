<?php
/**
 * Class Payment_Service
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateway;

use Illuminate\Support\Arr;
use QuillBooking\Models\Booking_Model;

/**
 * Payment Service class.
 */
abstract class Payment_Service {

	/**
	 * Mode settings
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $mode_settings;

	/**
	 * Booking model.
	 *
	 * @var Booking_Model
	 */
	protected $booking;

	/**
	 * Payment Gateway
	 *
	 * @var Payment_Gateway
	 */
	protected $payment_gateway;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct( $payment_gateway ) {
		$this->payment_gateway = $payment_gateway;
		$this->init();
	}

	/**
	 * Initialize.
	 *
	 * @since 1.0.0
	 */
	public function init() {
		if ( ! $this->payment_gateway->is_configured() ) {
			return;
		}

		add_action( 'quillbooking_after_booking_created', array( $this, 'after_booking_created' ), 10, 2 );
	}

	/**
	 * Generate payment URL.
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $this->booking Booking model.
	 * @param array         $args    Arguments.
	 *
	 * @return void
	 */
	public function after_booking_created( $booking, $args ) {
		if ( $this->payment_gateway->slug !== Arr::get( $args, 'payment_method' ) || ! $this->ensure_availability( $booking ) ) {
			return;
		}

		$this->ajax_ensure_availability( $booking );
		$this->mode_settings = $this->payment_gateway->get_mode_settings();
		$this->booking       = $booking;

		$this->process_payment();
	}

	/**
	 * Process payment.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	abstract public function process_payment();

	/**
	 * Ensure availability of method
	 * This function ensure that the method is enabled and configured.
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return void
	 */
	private function ajax_ensure_availability( $booking ) {
		if ( ! Arr::get( $booking->event->payments_settings, 'enable_payment' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Payments are disabled for this event.', 'quillbooking' ) ), 400 );
			exit;
		}

		if ( ! Arr::get( $booking->event->payments_settings, "enable_{$this->payment_gateway->slug}" ) ) {
			wp_send_json_error( array( 'message' => esc_html__( "This payment method isn't enabled.", 'quillbooking' ) ), 400 );
			exit;
		}
		if ( ! $this->payment_gateway->is_configured() ) {
			wp_send_json_error( array( 'message' => esc_html__( "This payment method isn't configured.", 'quillbooking' ) ), 400 );
			exit;
		}
	}

	/**
	 * Ensure availability of method
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return bool
	 */
	private function ensure_availability( $booking ) {
		if ( 'native' !== Arr::get( $booking->event->payments_settings, 'type' ) ) {
			return false;
		}

		if ( ! Arr::get( $booking->event->payments_settings, 'enable_payment' ) ) {
			return false;
		}

		if ( ! Arr::get( $booking->event->payments_settings, "enable_{$this->payment_gateway->slug}" ) ) {
			return false;
		}

		if ( ! $this->payment_gateway->is_configured() ) {
			return false;
		}

		return true;
	}
}
