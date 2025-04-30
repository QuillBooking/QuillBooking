<?php
/**
 * Booking Validator
 *
 * This class is responsible for handling the booking validation
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Utils;
use DateTime;
use DateTimeZone;

/**
 * Booking Validator class
 */
class Booking_Validator {

	/**
	 * Validate a booking by its ID.
	 *
	 * @param string $id Booking ID.
	 *
	 * @return Booking_Model
	 * @throws \Exception If the booking is invalid.
	 */
	public static function validate_booking( $id ) {
		if ( empty( $id ) ) {
			throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
		}

		$booking = Booking_Model::getByHashId( $id );

		if ( ! $booking ) {
			throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
		}

		if ( $booking->isCompleted() ) {
			throw new \Exception( __( 'Booking is already completed', 'quillbooking' ) );
		}

		if ( $booking->isCancelled() ) {
			throw new \Exception( __( 'Booking is already cancelled', 'quillbooking' ) );
		}

		return $booking;
	}

	/**
	 * Validate event ID.
	 *
	 * @param string|int $id Event ID.
	 *
	 * @return Event_Model
	 * @throws \Exception If the event is invalid.
	 */
	public static function validate_event( $id ) {
		if ( empty( $id ) || $id === 0 ) {
			throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
		}

		$event = Event_Model::find( $id );
		if ( ! $event ) {
			throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
		}

		return $event;
	}

	/**
	 * Validate start date to ensure it's not in the past.
	 *
	 * @param string $start_date Start date.
	 * @param string $timezone Timezone.
	 *
	 * @return DateTime
	 * @throws \Exception If the start date is invalid.
	 */
	public static function validate_start_date( $start_date, $timezone ) {
		$start = new DateTime( $start_date, new DateTimeZone( $timezone ) );
		$now   = new DateTime( 'now', new DateTimeZone( $timezone ) );

		if ( $start->getTimestamp() <= $now->getTimestamp() ) {
			throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
		}

		return Utils::create_date_time( $start_date, $timezone );
	}

	/**
	 * Validate booking duration.
	 *
	 * @param mixed $duration Duration.
	 * @param mixed $default_duration Default duration.
	 *
	 * @return int
	 * @throws \Exception If the duration is invalid.
	 */
	public static function validate_duration( $duration, $default_duration = null ) {
		if ( $duration === null || $duration === '' || $duration === 0 ) {
			if ( $default_duration === null ) {
				throw new \Exception( __( 'Invalid duration', 'quillbooking' ) );
			}
			return (int) $default_duration;
		}

		if ( ! is_numeric( $duration ) || (float) $duration <= 0 ) {
			throw new \Exception( __( 'Invalid duration', 'quillbooking' ) );
		}

		return (int) $duration;
	}
}
