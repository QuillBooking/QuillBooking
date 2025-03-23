<?php

namespace QuillBooking;

use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Guest_Model;
use Exception;
use Illuminate\Support\Arr;

class Booking_Service {


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
	public function book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $invitees, $location, $status = 'scheduled', $fields = array() ) {
		$end_date = clone $start_date;
		$end_date->modify( "+{$duration} minutes" );
		$pending_type = null;

		if ( $event->requireConfirmation( $start_date ) ) {
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
			$booking->start_time  = $start_date->format( 'Y-m-d H:i:s' );
			$booking->end_time    = $end_date->format( 'Y-m-d H:i:s' );
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

			if ( ! empty( $fields ) ) {
				$booking->meta()->create(
					array(
						'meta_key'   => 'fields',
						'meta_value' => json_encode( $fields ),
					)
				);
			}

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
