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

// Import REAL namespaces for type hints and default values
use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use DateTime;
use DateTimeZone;
use Exception; // Use base Exception or specific ones

/**
 * Booking Validator class (using static methods with injected class names)
 */
class Booking_Validator {


	// --- REMOVED Unused Constructor and Properties ---
	// private string $eventModelClass;
	// private string $bookingModelClass;
	// public function __construct(...) { ... }


	/**
	 * Validate a booking by its ID.
	 * Accepts the model class name to use for validation.
	 *
	 * @param mixed  $id         Booking hash ID.
	 * @param string $modelClass The Booking Model class name to use.
	 *
	 * @return object Returns the found booking object (instance of $modelClass).
	 * @throws Exception If the booking is invalid or fails checks.
	 */
	public static function validate_booking( $id, string $modelClass = Booking_Model::class ) {
		if ( empty( $id ) ) {
			throw new Exception( __( 'Invalid booking ID.', 'quillbooking' ) ); // Slightly clearer message
		}

		// Use the injected class name for the static call
		$booking = call_user_func( array( $modelClass, 'getByHashId' ), $id );

		if ( ! $booking ) {
			// Ensure $booking is an object before calling methods if needed,
			// but here we throw if not found.
			throw new Exception( __( 'Invalid booking.', 'quillbooking' ) );
		}

		// Check status using methods assumed to exist on the model instance
		// Ensure methods exist before calling, or rely on model's interface contract.
		if ( method_exists( $booking, 'isCompleted' ) && $booking->isCompleted() ) {
			throw new Exception( __( 'Booking is already completed.', 'quillbooking' ) );
		}

		if ( method_exists( $booking, 'isCancelled' ) && $booking->isCancelled() ) {
			throw new Exception( __( 'Booking is already cancelled.', 'quillbooking' ) );
		}

		return $booking;
	}

	/**
	 * Validate event ID.
	 * Accepts the model class name to use for validation.
	 *
	 * @param mixed  $id         Event ID.
	 * @param string $modelClass The Event Model class name to use.
	 *
	 * @return object Returns the found event object (instance of $modelClass).
	 * @throws Exception If the event is invalid.
	 */
	public static function validate_event( $id, string $modelClass = Event_Model::class ) {
		// Use absint to ensure positive integer if expecting numeric ID
		$event_id_abs = is_numeric( $id ) ? absint( $id ) : 0;

		if ( empty( $event_id_abs ) ) { // Check the sanitized integer ID
			throw new Exception( __( 'Invalid event ID.', 'quillbooking' ) ); // Clearer message
		}

		// Use the injected class name for the static call
		$event = call_user_func( array( $modelClass, 'find' ), $event_id_abs );

		if ( ! $event ) {
			throw new Exception( __( 'Invalid event.', 'quillbooking' ) );
		}

		// Add any other necessary event validation checks here (e.g., is active?)

		return $event;
	}

	/**
	 * Validate start date to ensure it's not in the past.
	 *
	 * @param string $start_date Start date string (e.g., 'Y-m-d H:i:s').
	 * @param string $timezone   Timezone identifier (e.g., 'UTC').
	 *
	 * @return DateTime Returns the validated DateTime object.
	 * @throws Exception If the start date is invalid or in the past.
	 */
	public static function validate_start_date( $start_date, $timezone ) {
		// Basic check for empty values
		if ( empty( $start_date ) || empty( $timezone ) ) {
			throw new Exception( __( 'Invalid start date or timezone provided.', 'quillbooking' ) );
		}

		try {
			$tz_object = new DateTimeZone( $timezone );
			$start     = new DateTime( $start_date, $tz_object );
			$now       = new DateTime( 'now', $tz_object ); // Ensure 'now' uses the same timezone
		} catch ( \Exception $e ) {
			// Catch errors from invalid timezone or date format
			throw new Exception( __( 'Invalid date format or timezone: ', 'quillbooking' ) . $e->getMessage() );
		}

		// Check if start time is in the past or present (<=)
		if ( $start->getTimestamp() <= $now->getTimestamp() ) {
			throw new Exception( __( 'Invalid start date. Date must be in the future.', 'quillbooking' ) );
		}

		// Use Utils::create_date_time ONLY if it adds value beyond new DateTime.
		// If it just wraps new DateTime, return the object we already created.
		// return Utils::create_date_time( $start_date, $timezone );
		return $start; // Return the validated DateTime object
	}

	/**
	 * Validate booking duration. Ensures it's a positive integer.
	 *
	 * @param mixed $duration         Input duration (can be string, int, null, float).
	 * @param mixed $default_duration Default duration if input is invalid (can be int, null).
	 *
	 * @return int Returns the validated positive integer duration.
	 * @throws Exception If the duration cannot be resolved to a positive integer.
	 */
	public static function validate_duration( $duration, $default_duration = null ) {
		$validated_duration = 0; // Default to invalid

		// Try to use the input duration if it's numeric and positive
		if ( $duration !== null && $duration !== '' && is_numeric( $duration ) ) {
			$duration_int = (int) $duration; // Convert to int (truncates floats)
			if ( $duration_int > 0 ) {
				$validated_duration = $duration_int;
			}
		}

		// If input was invalid or zero, try the default duration
		if ( $validated_duration <= 0 && $default_duration !== null && is_numeric( $default_duration ) ) {
			$default_duration_int = (int) $default_duration;
			if ( $default_duration_int > 0 ) {
				$validated_duration = $default_duration_int;
			}
		}

		// If we still don't have a positive duration, it's invalid
		if ( $validated_duration <= 0 ) {
			throw new Exception( __( 'Invalid duration. Must be a positive number.', 'quillbooking' ) );
		}

		return $validated_duration;
	}
}
