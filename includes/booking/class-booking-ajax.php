<?php
/**
 * Class Booking Ajax
 * Handles the booking ajax actions
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Guest_Model;
use Illuminate\Support\Arr;

class Booking_Ajax {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'wp_ajax_quillbooking_booking_slots', array( $this, 'booking_details' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_booking_slots', array( $this, 'booking_details' ) );
		add_action( 'wp_ajax_quillbooking_booking', array( $this, 'booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_booking', array( $this, 'booking' ) );
		add_action( 'wp_ajax_quillbooking_cancel_booking', array( $this, 'ajax_cancel_booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_cancel_booking', array( $this, 'ajax_cancel_booking' ) );
		add_action( 'wp_ajax_quillbooking_reschedule_booking', array( $this, 'ajax_reschedule_booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_reschedule_booking', array( $this, 'ajax_reschedule_booking' ) );
	}

	/**
	 * Ajax booking
	 *
	 * @return void
	 */
	public function booking() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id    = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : null;
			$event = Booking_Validator::validate_event( $id );

			$payment_method = isset( $_POST['payment_method'] ) ? sanitize_text_field( $_POST['payment_method'] ) : null;
			if ( ! $payment_method && $event->requirePayment() ) {
				throw new \Exception( __( 'Invalid payment method', 'quillbooking' ) );
			}

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			$start_date = Booking_Validator::validate_start_date( $start_date, $timezone );

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $event->duration;
			$duration = Booking_Validator::validate_duration( $duration, $event->duration );

			$location = isset( $_POST['location'] ) ? sanitize_text_field( $_POST['location'] ) : null;
			if ( ! $location ) {
				throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
			}

			// Validate invitees if needed
			$invitee = isset( $_POST['invitee'] ) ? $_POST['invitee'] : array();
			if ( empty( $invitee ) ) {
				throw new \Exception( __( 'Please, add invitee', 'quillbooking' ) );
			}

			$validate_invitee = $this->validate_invitee( $event, $invitee );
			if ( 'group' !== $event->type && count( $validate_invitee ) > 1 ) {
				throw new \Exception( __( 'Invalid event type', 'quillbooking' ) );
			}

			$available_slots = $event->get_booking_available_slots( $start_date, $duration, $timezone );
			if ( ! $available_slots ) {
				throw new \Exception( __( 'Sorry, This booking is not available', 'quillbooking' ) );
			}

			if ( $available_slots < count( $validate_invitee ) ) {
				throw new \Exception( __( 'You have selected an invalid slot', 'quillbooking' ) );
			}

			$calendar_id = $event->calendar_id;
			$booking     = $this->book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $validate_invitee, $location );

			do_action(
				'quillbooking_after_booking_created',
				$booking,
				array(
					'payment_method' => $payment_method,
				)
			);

			wp_send_json_success( array( 'message' => __( 'Booking successful', 'quillbooking' ) ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Ajax Get booking slots
	 *
	 * @return void
	 */
	public function booking_details() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : null;
			if ( ! $id ) {
				throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
			}

			$event = Booking_Validator::validate_event( $id );

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $event->duration;
			$duration = Booking_Validator::validate_duration( $duration, $event->duration );

			$available_slots = $event->get_available_slots( $start_date, $timezone, $duration );

			wp_send_json_success( array( 'slots' => $available_slots ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Ajax Cancel booking
	 *
	 * @return void
	 */
	public function ajax_cancel_booking() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id      = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : null;
			$booking = Booking_Validator::validate_booking( $id );

			if ( $booking->isCompleted() ) {
				throw new \Exception( __( 'Booking is already completed', 'quillbooking' ) );
			}

			$booking->status = 'cancelled';
			$booking->save();

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Booking cancelled', 'quillbooking' ),
					'details' => __( 'Booking cancelled by Attendee', 'quillbooking' ),
				)
			);

			do_action( 'quillbooking_booking_attendee_cancelled', $booking );
			do_action( 'quillbooking_booking_cancelled', $booking );

			wp_send_json_success( array( 'message' => __( 'Booking cancelled', 'quillbooking' ) ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Ajax Reschedule booking
	 *
	 * @return void
	 */
	public function ajax_reschedule_booking() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id      = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : null;
			$booking = Booking_Validator::validate_booking( $id );

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			// Use the Booking_Validator to validate the start date
			$start_date = Booking_Validator::validate_start_date( $start_date, $timezone );

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $booking->slot_time;
			$duration = Booking_Validator::validate_duration( $duration, $booking->slot_time );

			if ( $booking->isCompleted() ) {
				throw new \Exception( __( 'Booking is already completed', 'quillbooking' ) );
			}

			// Check if the booking is same as the current booking
			$booking_start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
			if ( $start_date->getTimestamp() === $booking_start_date->getTimestamp() && $duration === $booking->slot_time ) {
				throw new \Exception( __( 'Booking is already scheduled for this time', 'quillbooking' ) );
			}

			$available_slots = $booking->event->get_booking_available_slots( $start_date, $duration, $timezone );
			if ( ! $available_slots ) {
				throw new \Exception( __( 'Sorry, This booking is not available', 'quillbooking' ) );
			}

			$end_date = clone $start_date;
			$end_date->modify( "+{$duration} minutes" );

			$booking->start_time = $start_date->format( 'Y-m-d H:i:s' );
			$booking->end_time   = $end_date->format( 'Y-m-d H:i:s' );
			$booking->save();

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Booking rescheduled', 'quillbooking' ),
					'details' => __( 'Booking rescheduled by Attendee', 'quillbooking' ),
				)
			);

			do_action( 'quillbooking_booking_attendee_rescheduled', $booking );
			do_action( 'quillbooking_booking_rescheduled', $booking );

			wp_send_json_success( array( 'message' => __( 'Booking rescheduled', 'quillbooking' ) ) );
		} catch ( \Exception $e ) {
			error_log( 'error: ' . $e->getMessage() );
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Book an event slot.
	 *
	 * @param Event_Model $event The event being booked.
	 * @param int         $calendar_id The calendar ID.
	 * @param \DateTime   $start_date The start date/time of the booking.
	 * @param int         $duration The duration of the booking in minutes.
	 * @param string      $timezone The timezone of the booking.
	 * @param array       $invitees The invitees for the booking.
	 * @param string      $location The location of the booking.
	 *
	 * @return Booking_Model
	 * @throws \Exception If booking fails.
	 */
	private function book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $invitees, $location ) {
		$slot_start = clone $start_date;
		$slot_start->setTimezone( new \DateTimeZone( 'UTC' ) );
		$slot_end = clone $slot_start;
		$slot_end->modify( "+{$duration} minutes" );
		$pending_type = null;
		$status       = 'scheduled';
		if ( $event->requireConfirmation( $slot_start ) ) {
			$pending_type = 'confirmation';
			$status       = 'pending';
		}

		if ( $event->requirePayment() ) {
			$pending_type = 'payment';
			$status       = 'pending';
		}

		foreach ( $invitees as $invitee ) {
			$guest        = new Guest_Model();
			$guest->name  = $invitee['name'];
			$guest->email = $invitee['email'];
			if ( ! $guest->save() ) {
				throw new \Exception( __( 'Failed to book', 'quillbooking' ) );
			}

			$booking              = new Booking_Model();
			$booking->event_id    = $event->id;
			$booking->calendar_id = $calendar_id;
			$booking->start_time  = $slot_start->format( 'Y-m-d H:i:s' );
			$booking->end_time    = $slot_end->format( 'Y-m-d H:i:s' );
			$booking->status      = $status;
			$booking->event_url   = home_url();
			$booking->source      = 'event-page';
			$booking->slot_time   = $duration;
			$booking->guest_id    = $guest->id;

			if ( ! $booking->save() ) {
				$guest->delete();
				throw new \Exception( __( 'Failed to book', 'quillbooking' ) );
			}

			$booking->location = $location;
			$booking->timezone = $timezone;
			$booking->save();

			$guest->booking_id = $booking->id;
			if ( ! $guest->save() ) {
				$booking->delete();
				throw new \Exception( __( 'Failed to book', 'quillbooking' ) );
			}

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Booking created', 'quillbooking' ),
					'details' => sprintf( __( 'Booking created by %s', 'quillbooking' ), $guest->name ),
				)
			);

			if ( 'pending' === $status && 'confirmation' === $pending_type ) {
				do_action( 'quillbooking_booking_pending', $booking );
			} else {
				do_action( 'quillbooking_booking_created', $booking );
			}
		}

		return $booking;
	}

	/**
	 * Validate invitee
	 *
	 * @param Event_Model $event
	 * @param array       $invitee
	 *
	 * @throws \Exception
	 * @return array
	 */
	private function validate_invitee( $event, $invitee ) {
		// invitee should be an array of {name, email}
		// First, we need to sanitize the invitee
		$invitee = array_map(
			function( $item ) {
				$name  = sanitize_text_field( Arr::get( $item, 'name', null ) );
				$email = sanitize_email( Arr::get( $item, 'email', null ) );

				if ( ! $name || ! $email ) {
					throw new \Exception( __( 'Invalid invitee', 'quillbooking' ) );
				}

				$guest = array(
					'name'  => $name,
					'email' => $email,
				);

				if ( $user = get_user_by( 'email', $email ) ) {
					$guest['user_id'] = $user->ID;
				}

				return $guest;
			},
			$invitee
		);

		if ( 'group' !== $event->type && count( $invitee ) > 1 ) {
			throw new \Exception( __( 'Invalid event type', 'quillbooking' ) );
		}

		return $invitee;
	}
}
