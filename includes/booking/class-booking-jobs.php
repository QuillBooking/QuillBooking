<?php

/**
 * Booking Jobs class
 *
 * Handle the actions related to booking jobs, such as update booking status based on payment checks.
 *
 * @since 1.0.0
 * @package QuillBooking\Booking
 */

namespace QuillBooking\Booking;

use QuillBooking\Tasks;
use QuillBooking\Models\Booking_Model;

/**
 * Booking Jobs class
 */
class Booking_Jobs {


	/**
	 * Task group name
	 */
	const PAYMENT_TASK_GROUP = 'quillbooking_payment';

	/**
	 * Tasks instance
	 *
	 * @var Tasks
	 */
	private $tasks;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->tasks = new Tasks( self::PAYMENT_TASK_GROUP );

		// Register callback for checking payment status
		$this->tasks->register_callback( 'check_payment_status', array( $this, 'check_payment_status' ) );

		// Hook into booking creation to schedule payment check
		add_action( 'quillbooking_payment_status', array( $this, 'schedule_payment_check' ), 10, 1 );
	}

	/**
	 * Schedule a payment status check for a booking
	 *
	 * @param \QuillBooking\Models\Booking_Model $booking Booking model
	 * @return void
	 */
	public function schedule_payment_check( $booking ) {
		// Only schedule checks for bookings that require payment
		if ( ! $booking->event->requirePayment() ) {
			return;
		}

		// Only schedule checks for bookings that are in 'pending' status
		if ( 'pending' !== $booking->status ) {
			return;
		}

		// Schedule a check in 10 seconds
		$timestamp = time() + 10;
		$this->tasks->schedule_single( $timestamp, 'check_payment_status', $booking->id );
	}

	/**
	 * Check payment status for a booking
	 *
	 * @param int $booking_id Booking ID
	 * @return void
	 */
	public function check_payment_status( $booking_id ) {
		// Get the booking
		$booking = Booking_Model::find( $booking_id );

		// If booking doesn't exist, bail
		if ( ! $booking ) {
			return;
		}

		// If booking has been cancelled or completed already, bail
		if ( $booking->isCancelled() || $booking->isCompleted() || 'pending' !== $booking->status ) {
			return;
		}

		// Check the payment status, if it's still pending, cancel the booking
		if ( 'pending' === $booking->status ) {
			// Cancel the booking
			$booking->cancelled_by = 'system';
			$booking->status       = 'cancelled';
			$booking->save();

			// Log the cancellation
			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Booking automatically cancelled', 'quillbooking' ),
					'details' => __( 'Booking was cancelled because payment was not received within 30 minutes', 'quillbooking' ),
				)
			);

			// Fire the cancellation hooks
			do_action( 'quillbooking_booking_cancelled', $booking );
		}
	}
}
