<?php
/**
 * Booking Tasks
 *
 * This class is responsible for handling the booking tasks
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use QuillBooking\Models\Booking_Model;
use QuillBooking\QuillBooking;
use Illuminate\Support\Arr;

/**
 * Booking Tasks class
 */
class Booking_Tasks {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'quillbooking_booking_created', array( $this, 'schedule_booking_tasks' ) );
		add_action( 'quillbooking_booking_confirmed', array( $this, 'schedule_booking_tasks' ) );
		add_action( 'quillbooking_booking_rescheduled', array( $this, 'schedule_booking_tasks' ) );
	}

	/**
	 * Schedule booking tasks
	 *
	 * @param Booking_Model $booking The booking model.
	 */
	public function schedule_booking_tasks( $booking ) {
		$this->schedule_reminders( $booking, 'organizer_reminder', 'booking_organizer_reminder' );
		$this->schedule_reminders( $booking, 'attendee_reminder', 'booking_attendee_reminder' );
	}

	/**
	 * Schedule reminders for a specific type (organizer or attendee).
	 *
	 * @param Booking_Model $booking The booking model.
	 * @param string        $type    The type of reminder (e.g., 'organizer_reminder').
	 * @param string        $hook    The hook to trigger.
	 */
	private function schedule_reminders( $booking, $type, $hook ) {
		$reminders_enabled = Arr::get( $booking->event->email_notifications, "{$type}.enabled", false );
		if ( ! $reminders_enabled ) {
			return;
		}

		$times = Arr::get( $booking->event->email_notifications, "{$type}.times", array() );
		if ( empty( $times ) ) {
			return;
		}

		foreach ( $times as $time ) {
			$value = Arr::get( $time, 'value', 0 );
			$unit  = strtolower( Arr::get( $time, 'unit', 'minutes' ) );

			$interval = $this->get_date_interval( $value, $unit );
			if ( ! $interval ) {
				continue;
			}

			$start_timestamp    = strtotime( $booking->start_time );
			$reminder_timestamp = $start_timestamp - $this->get_seconds_from_interval( $interval );

			if ( $reminder_timestamp > time() ) {
				QuillBooking::instance()->tasks->schedule_single( $reminder_timestamp, $hook, $booking );
			} else {
				QuillBooking::instance()->tasks->schedule_single( time() + 10, $hook, $booking );
				error_log( "schedule_reminders: Skipping past {$type} reminder for " . date( 'Y-m-d H:i:s', $reminder_timestamp ) );
			}
		}
	}

	/**
	 * Get DateInterval object based on value and unit.
	 *
	 * @param int    $value The time value.
	 * @param string $unit  The time unit (minutes, hours, days).
	 *
	 * @return \DateInterval|null
	 */
	private function get_date_interval( $value, $unit ) {
		try {
			switch ( $unit ) {
				case 'minutes':
					return new \DateInterval( "PT{$value}M" );
				case 'hours':
					return new \DateInterval( "PT{$value}H" );
				case 'days':
					return new \DateInterval( "P{$value}D" );
				default:
					return null;
			}
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/**
	 * Convert a DateInterval object to seconds.
	 *
	 * @param \DateInterval $interval The DateInterval object.
	 *
	 * @return int
	 */
	private function get_seconds_from_interval( $interval ) {
		return ( $interval->d * 24 * 60 * 60 ) +
			( $interval->h * 60 * 60 ) +
			( $interval->i * 60 );
	}
}
