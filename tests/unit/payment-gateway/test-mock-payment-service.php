<?php
/**
 * Mock Payment Service for testing
 *
 * @package QuillBooking\Tests
 */

namespace QuillBooking\Tests\Mocks;

use QuillBooking\Payment_Gateway\Payment_Service;
use QuillBooking\Payment_Gateway\Payment_Gateway;

/**
 * Mock Payment Service implementation
 */
class Mock_Payment_Service extends Payment_Service {

	/**
	 * Flag to track if process_payment was called
	 */
	public $process_payment_called = false;

	/**
	 * Last booking processed
	 */
	public $last_booking = null;

	/**
	 * Last mode settings used
	 */
	public $last_mode_settings = null;

	/**
	 * Constructor
	 *
	 * @param Payment_Gateway $payment_gateway Payment gateway
	 */
	public function __construct( $payment_gateway ) {
		parent::__construct( $payment_gateway );
	}

	/**
	 * Process payment implementation
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function process_payment() {
		$this->process_payment_called = true;
		$this->last_booking           = $this->booking;
		$this->last_mode_settings     = $this->mode_settings;
	}

	/**
	 * Reset testing state
	 */
	public function reset() {
		$this->process_payment_called = false;
		$this->last_booking           = null;
		$this->last_mode_settings     = null;
	}

	/**
	 * This method gives us access to test the ensure_availability method
	 * We can't directly expose the private method, but we can wrap it in public method
	 *
	 * @param mixed $booking Booking model
	 * @return bool
	 */
	public function test_availability( $booking ) {
		// This is a workaround since we can't directly access the private method
		// Call after_booking_created with a matching payment method but check if it would process
		$this->reset();
		$args = array( 'payment_method' => $this->payment_gateway->slug );
		$this->after_booking_created( $booking, $args );
		return $this->process_payment_called;
	}
}
