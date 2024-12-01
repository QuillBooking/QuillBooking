<?php
/**
 * Class Booking
 *
 * This class is responsible for handling the booking
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Guest_Model;
use Illuminate\Support\Arr;
use QuillBooking\Utils;

/**
 * Booking class
 */
class Booking {

	/**
	 * Instance
	 *
	 * @var Booking
	 */
	private static $instance;

	/**
	 * Instance
	 *
	 * @return Booking
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) && ! ( self::$instance instanceof Booking ) ) {
			self::$instance = new Booking();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		// Ajax actions
		add_action( 'wp_ajax_quillbooking_booking_slots', array( $this, 'booking_details' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_booking_slots', array( $this, 'booking_details' ) );
		add_action( 'wp_ajax_quillbooking_booking', array( $this, 'booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_booking', array( $this, 'booking' ) );
		add_action( 'wp_ajax_quillbooking_cancel_booking', array( $this, 'cancel_booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_cancel_booking', array( $this, 'cancel_booking' ) );
		add_action( 'wp_ajax_quillbooking_reschedule_booking', array( $this, 'reschedule_booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_reschedule_booking', array( $this, 'reschedule_booking' ) );
	}

	/**
	 * Reschedule booking
	 */
	public function reschedule_booking() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : null;
			error_log( 'id: ' . $id );
			if ( ! $id ) {
				throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
			}

			$booking = Booking_Model::getByHashId( $id );
			if ( ! $booking ) {
				throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
			}

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $booking->slot_time;
			if ( ! $duration ) {
				throw new \Exception( __( 'Invalid duration', 'quillbooking' ) );
			}

			if ( $booking->isCompleted() ) {
				throw new \Exception( __( 'Booking is already completed', 'quillbooking' ) );
			}

			$start_date = Utils::create_date_time( $start_date, $timezone );
			// Check if start date is in the past
			$now = new \DateTime( 'now', new \DateTimeZone( 'UTC' ) );
			if ( $start_date->getTimestamp() < $now->getTimestamp() ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}
			// Check if the booking is same as the current booking
			$booking_start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
			if ( $start_date->getTimestamp() === $booking_start_date->getTimestamp() && $duration === $booking->slot_time ) {
				throw new \Exception( __( 'Booking is already scheduled for this time', 'quillbooking' ) );
			}

			$available_slots = $booking->event->get_booking_available_slots( $start_date, $duration );

			if ( ! $available_slots ) {
				throw new \Exception( __( 'Sorry, This booking is not available', 'quillbooking' ) );
			}

			$end_date = clone $start_date;
			$end_date->modify( "+{$duration} minutes" );

			$booking->start_time = $start_date->format( 'Y-m-d H:i:s' );
			$booking->end_time   = $end_date->format( 'Y-m-d H:i:s' );
			$booking->save();

			do_action( 'quillbooking_booking_rescheduled', $booking );

			wp_send_json_success( array( 'message' => __( 'Booking rescheduled', 'quillbooking' ) ) );
		} catch ( \Exception $e ) {
			error_log( 'error: ' . $e->getMessage() );
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Cancel booking
	 */
	public function cancel_booking() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : null;
			if ( ! $id ) {
				throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
			}

			$booking = Booking_Model::getByHashId( $id );
			if ( ! $booking ) {
				throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
			}

			if ( $booking->isCompleted() ) {
				throw new \Exception( __( 'Booking is already completed', 'quillbooking' ) );
			}

			$booking->status = 'cancelled';
			$booking->save();
			do_action( 'quillbooking_booking_cancelled', $booking );

			wp_send_json_success( array( 'message' => __( 'Booking cancelled', 'quillbooking' ) ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Booking details
	 */
	public function booking_details() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : null;
			if ( ! $id ) {
				throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
			}

			$event = Event_Model::find( $id );
			if ( ! $event ) {
				throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
			}

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $event->duration;
			if ( ! $duration ) {
				throw new \Exception( __( 'Invalid duration', 'quillbooking' ) );
			}

			$available_slots = $event->get_available_slots( $start_date, $timezone, $duration );

			wp_send_json_success( array( 'slots' => $available_slots ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}

	/**
	 * Booking
	 */
	public function booking() {
		// check_ajax_referer( 'quillbooking', 'nonce' );

		try {
			$id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : null;
			if ( ! $id ) {
				throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
			}

			$event = Event_Model::find( $id );
			if ( ! $event ) {
				throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
			}

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			// The start date should be in the future and in format Y-m-d H:i:s
			$start_date = new \DateTime( $start_date, new \DateTimeZone( $timezone ) );
			$now        = new \DateTime( 'now', new \DateTimeZone( $timezone ) );
			if ( $start_date->getTimestamp() < $now->getTimestamp() ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $event->duration;
			if ( ! $duration ) {
				throw new \Exception( __( 'Invalid duration', 'quillbooking' ) );
			}

			$location = isset( $_POST['location'] ) ? sanitize_text_field( $_POST['location'] ) : null;
			if ( ! $location ) {
				throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
			}

			// $event_duration = Arr::get( $this->settings, 'general.duration.allow_attendees_to_select_duration', false );
			// if ( !$event_duration ) {
			// $duration = $this->duration;
			// }

			$invitee = isset( $_POST['invitee'] ) ? $_POST['invitee'] : array();
			if ( empty( $invitee ) ) {
				throw new \Exception( __( 'Please, add invitee', 'quillbooking' ) );
			}

			$validate_invitee = $this->validate_invitee( $event, $invitee );
			$available_slots  = $event->get_booking_available_slots( $start_date, $duration );

			if ( ! $available_slots ) {
				throw new \Exception( __( 'Sorry, This booking is not available', 'quillbooking' ) );
			}

			if ( $available_slots < count( $validate_invitee ) ) {
				throw new \Exception( __( 'You have selected an invalid slot', 'quillbooking' ) );
			}

			if ( 'collective' === $event->type ) {
				$teamMembers = $event->calendar->getTeamMembers();
				foreach ( $teamMembers as $teamMember ) {
					$booking = $this->book_event_slot( $event, $teamMember, $start_date, $duration, $timezone, $validate_invitee, $location );
					$booking->save();
				}
			} else {
				$calendar_id = $event->calendar_id;
				$booking     = $this->book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $validate_invitee, $location );
				$booking->save();
			}

			wp_send_json_success( array( 'message' => __( 'Booking successful', 'quillbooking' ) ) );
		} catch ( \Exception $e ) {
			if ( isset( $booking->id ) ) {
				$booking->delete();
			}

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
	protected function book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $invitees, $location ) {
		foreach ( $invitees as $invitee ) {
			$guest        = new Guest_Model();
			$guest->name  = $invitee['name'];
			$guest->email = $invitee['email'];
			if ( ! $guest->save() ) {
				throw new \Exception( __( 'Failed to book', 'quillbooking' ) );
			}

			$slot_start = clone $start_date;
			$slot_start->setTimezone( new \DateTimeZone( 'UTC' ) );
			$slot_end = clone $slot_start;
			$slot_end->modify( "+{$duration} minutes" );

			$booking              = new Booking_Model();
			$booking->event_id    = $event->id;
			$booking->calendar_id = $calendar_id;
			$booking->start_time  = $slot_start->format( 'Y-m-d H:i:s' );
			$booking->end_time    = $slot_end->format( 'Y-m-d H:i:s' );
			$booking->status      = 'scheduled';
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
		}

		$booking->load( 'guest' );
		do_action( 'quillbooking_booking_created', $booking );

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
	public function validate_invitee( $event, $invitee ) {
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
