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

use Google\Service\Calendar\Setting;
use QuillBooking\Tasks;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Settings;

/**
 * Booking Jobs class
 */
class Booking_Jobs {

	/**
	 * Task group name
	 */
	const PAYMENT_TASK_GROUP = 'quillbooking_payment';

	/**
	 * Task group name for completion
	 */
	const COMPLETION_TASK_GROUP = 'quillbooking_completion';

	/**
	 * Tasks instance
	 *
	 * @var Tasks
	 */
	private $tasks;

	/**
	 * Completion tasks instance
	 *
	 * @var Tasks
	 */
	private $completion_tasks;

	/**
	 * Constructor
	 */
	public function __construct() {
		 $this->tasks           = new Tasks( self::PAYMENT_TASK_GROUP );
		$this->completion_tasks = new Tasks( self::COMPLETION_TASK_GROUP );

		// Register callback for checking payment status
		$this->tasks->register_callback( 'check_payment_status', array( $this, 'check_payment_status' ) );

		// Register callback for marking booking as completed
		$this->completion_tasks->register_callback( 'mark_booking_completed', array( $this, 'mark_booking_completed' ) );

		// Hook into booking creation to schedule payment check
		add_action( 'quillbooking_payment_status', array( $this, 'schedule_payment_check' ), 10, 1 );

		// Hook into booking creation and other relevant events to schedule completion check
		add_action( 'quillbooking_booking_created', array( $this, 'schedule_completion_check' ), 10, 1 );
		add_action( 'quillbooking_booking_rescheduled', array( $this, 'schedule_completion_check' ), 10, 1 );
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
		$settings     = Settings::get_all();
		$time_to_wait = $settings['general']['auto_cancel_after'] ?? 1800; // Default to 30 minutes if not set
		$timestamp    = time() + $time_to_wait;
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
					'details' => __( 'Booking was cancelled because payment was not completed' ),
				)
			);

			// Fire the cancellation hooks
			do_action( 'quillbooking_booking_cancelled', $booking );
		}
	}

	/**
	 * Schedule a completion check for a booking
	 *
	 * @param \QuillBooking\Models\Booking_Model $booking Booking model
	 * @return void
	 */
	public function schedule_completion_check( $booking ) {
		// Only schedule checks for bookings that are in 'scheduled' status
		if ( 'scheduled' !== $booking->status ) {
			return;
		}

		// Calculate the timestamp for when the booking should be marked as completed
		// This is based on the end time of the booking
		$end_time     = new \DateTime( $booking->end_time );
		$settings     = Settings::get_all();
		$time_to_wait = $settings['general']['auto_complete_after'] ?? 3600;

		// Calculate when to run the completion check
		$end_timestamp        = $end_time->format( 'U' );
		$completion_timestamp = $end_timestamp + $time_to_wait;

		// Schedule the task to run at the calculated time
		$this->completion_tasks->schedule_single( $completion_timestamp, 'mark_booking_completed', $booking->id );
	}

	/**
	 * Mark a booking as completed
	 *
	 * @param int $booking_id Booking ID
	 * @return void
	 */
	public function mark_booking_completed( $booking_id ) {
		// Get the booking
		$booking = Booking_Model::find( $booking_id );

		// If booking doesn't exist, bail
		if ( ! $booking ) {
			return;
		}

		// If booking has been cancelled or already explicitly marked as completed, bail
		if ( $booking->isCancelled() || 'completed' === $booking->status ) {
			return;
		}

		// Mark the booking as completed
		$booking->status = 'completed';
		$booking->save();

		// Log the completion
		$settings      = Settings::get_all();
		$time_in_hours = ( $settings['general']['auto_complete_after'] ?? 3600 ) / 3600;

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Booking automatically completed', 'quillbooking' ),
				'details' => sprintf( __( 'Booking was marked as completed automatically %s hour(s) after the end time', 'quillbooking' ), $time_in_hours ),
			)
		);

		// Fire the completion hooks
		do_action( 'quillbooking_booking_completed', $booking );
	}
}
