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
use QuillBooking\Booking_Service;


class Booking_Ajax {




	// --- Dependency Properties ---
	private string $bookingValidatorClass;
	private string $bookingServiceClass;


	public function __construct(
		string $bookingValidatorClass = Booking_Validator::class,
		string $bookingServiceClass = Booking_Service::class
	) {
		$this->bookingValidatorClass = $bookingValidatorClass;
		$this->bookingServiceClass   = $bookingServiceClass;
		add_action( 'wp_ajax_quillbooking_booking_slots', array( $this, 'booking_details' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_booking_slots', array( $this, 'booking_details' ) );
		add_action( 'wp_ajax_quillbooking_booking', array( $this, 'booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_booking', array( $this, 'booking' ) );
		add_action( 'wp_ajax_quillbooking_cancel_booking', array( $this, 'ajax_cancel_booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_cancel_booking', array( $this, 'ajax_cancel_booking' ) );
		add_action( 'wp_ajax_quillbooking_reschedule_booking', array( $this, 'ajax_reschedule_booking' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_reschedule_booking', array( $this, 'ajax_reschedule_booking' ) );
		add_action( 'wp_ajax_quillbooking_process_payment', array( $this, 'ajax_process_payment' ) );
		add_action( 'wp_ajax_nopriv_quillbooking_process_payment', array( $this, 'ajax_process_payment' ) );
	}

	/**
	 * Ajax booking
	 *
	 * @return void
	 */
	public function booking() {
		xdebug_break();
		 // check_ajax_referer( 'quillbooking', 'nonce' );
		try {
			$id    = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : null;
			$event = $this->bookingValidatorClass::validate_event( $id );

			$payment_method = isset( $_POST['payment_method'] ) ? sanitize_text_field( $_POST['payment_method'] ) : null;

			// Check if payment method is provided but Pro plugin is not active
			if ( $payment_method && ! defined( 'QUILLBOOKING_PRO_VERSION' ) ) {
				throw new \Exception( __( 'Payment processing requires the Pro plugin to be active', 'quillbooking' ) );
			}

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
			$start_date = $this->bookingValidatorClass::validate_start_date( $start_date, $timezone );

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $event->duration;
			$duration = $this->bookingValidatorClass::validate_duration( $duration, $event->duration );

			$location = isset( $_POST['location'] ) ? json_decode( stripslashes( $_POST['location'] ), true ) : null;
			if ( ! $location ) {
				throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
			}

			// Validate invitees if needed
			$invitees = isset( $_POST['invitees'] ) ? json_decode( stripslashes( $_POST['invitees'] ), true ) : array();
			if ( empty( $invitees ) || ! is_array( $invitees ) ) {
				throw new \Exception( __( 'Please, add valid invitees', 'quillbooking' ) );
			}

			$booking_service = new $this->bookingServiceClass();

			$validate_invitee = $booking_service->validate_invitee( $event, $invitees );
			if ( 'group' !== $event->type && count( $validate_invitee ) > 1 ) {
				throw new \Exception( __( 'Invalid event type', 'quillbooking' ) );
			}

			$available_slots = $event->get_booking_available_slots( $start_date, $duration, $timezone );
			if ( ! $available_slots ) {
				throw new \Exception( __( 'Sorry, This booking is not available', 'quillbooking' ) );
			}
			// check type === group
			if ( $available_slots < count( $validate_invitee ) ) {
				throw new \Exception( __( 'You have selected an invalid slot', 'quillbooking' ) );
			}

			$status = 'scheduled';

			if ( isset( $_POST['status'] ) ) {
				$status = sanitize_text_field( $_POST['status'] );
			}

			$fields = array();
			if ( isset( $_POST['fields'] ) ) {
				$fields = json_decode( wp_unslash( $_POST['fields'] ), true );
			}

			$host_ids = isset( $_POST['host_ids'] ) ? $_POST['host_ids'] : null;
			if ( $host_ids ) {
				$host_ids = explode( ',', $host_ids );
				if ( $event->type === 'round-robin' ) {
					$host_id = $host_ids[0];
				} else {
					$host_id = $host_ids;
				}
			}

			$calendar_id = $event->calendar_id;
			$booking     = $booking_service->book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $validate_invitee, $location, $status, $fields, $host_id );

			do_action(
				'quillbooking_after_booking_created',
				$booking,
				array(
					'payment_method' => $payment_method,
				)
			);

			// Add this check after validating the event
			if ( $payment_method && ! defined( 'QUILLBOOKING_PRO_VERSION' ) ) {
				throw new \Exception( __( 'Payment processing requires the Pro plugin to be active', 'quillbooking' ) );
			}

			// resolve
			/*
				redirect_query_string
				:
				"{{booking:additional_guests}}{{guest:email}}"
				redirect_url
				:
				"https://www.google.com/"
			*/
			$redirect_query_string = isset( $booking->event->advanced_settings['redirect_query_string'] ) ? $booking->event->advanced_settings['redirect_query_string'] : null;
			// Merge tags
			$merge_tags_manager    = \QuillBooking\Managers\Merge_Tags_Manager::instance();
			$result                = $merge_tags_manager->process_merge_tags( $redirect_query_string, $booking );
			$redirect_query_string = $result;

			$redirect_url = isset( $booking->event->advanced_settings['redirect_url'] ) ? $booking->event->advanced_settings['redirect_url'] : null;
			// add query string to redirect url
			$redirect_url                  = $redirect_url . '?' . $redirect_query_string;
			$booking->booking_redirect_url = $redirect_url;
			wp_send_json_success( array( 'booking' => $booking ) );
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
			$id      = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : null;
			$user_id = isset( $_POST['user_id'] ) ? intval( $_POST['user_id'] ) : null;

			if ( ! $id ) {
				throw new \Exception( __( 'Invalid event', 'quillbooking' ) );
			}

			$event = $this->bookingValidatorClass::validate_event( $id );

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $event->duration;
			$duration = $this->bookingValidatorClass::validate_duration( $duration, $event->duration );

			$available_slots = $event->get_available_slots( $start_date, $timezone, $duration, $user_id );

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
			$id                  = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : null;
			$booking             = $this->bookingValidatorClass::validate_booking( $id );
			$cancellation_reason = isset( $_POST['cancellation_reason'] ) ? sanitize_text_field( $_POST['cancellation_reason'] ) : null;

			if ( $booking->isCompleted() ) {
				throw new \Exception( __( 'Booking is already completed', 'quillbooking' ) );
			}

			if ( $cancellation_reason ) {
				$booking->update_meta( 'cancellation_reason', $cancellation_reason );
			}

			$booking->cancelled_by = 'attendee';
			$booking->status       = 'cancelled';
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
			$id                = isset( $_POST['id'] ) ? sanitize_text_field( $_POST['id'] ) : null;
			$booking           = $this->bookingValidatorClass::validate_booking( $id );
			$reschedule_reason = isset( $_POST['reschedule_reason'] ) ? sanitize_text_field( $_POST['reschedule_reason'] ) : null;

			$start_date = isset( $_POST['start_date'] ) ? sanitize_text_field( $_POST['start_date'] ) : null;
			if ( ! $start_date ) {
				throw new \Exception( __( 'Invalid start date', 'quillbooking' ) );
			}

			$timezone = isset( $_POST['timezone'] ) ? sanitize_text_field( $_POST['timezone'] ) : null;
			if ( ! $timezone ) {
				throw new \Exception( __( 'Invalid timezone', 'quillbooking' ) );
			}

			// Use the Booking_Validator to validate the start date
			$start_date = $this->bookingValidatorClass::validate_start_date( $start_date, $timezone );

			$duration = isset( $_POST['duration'] ) ? intval( $_POST['duration'] ) : $booking->slot_time;
			$duration = $this->bookingValidatorClass::validate_duration( $duration, $booking->slot_time );

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

			$booking->start_time = $start_date->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );
			$booking->end_time   = $end_date->setTimezone( new \DateTimeZone( 'UTC' ) )->format( 'Y-m-d H:i:s' );

			if ( $reschedule_reason ) {
				$booking->update_meta( 'reschedule_reason', $reschedule_reason );
			}

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
	 * Ajax Process Payment
	 *
	 * @return void
	 */
	public function ajax_process_payment() {
		try {
			$booking_hash_id = isset( $_POST['booking_hash_id'] ) ? sanitize_text_field( $_POST['booking_hash_id'] ) : null;
			if ( ! $booking_hash_id ) {
				throw new \Exception( __( 'Invalid booking', 'quillbooking' ) );
			}

			$booking = $this->bookingValidatorClass::validate_booking( $booking_hash_id );

			$payment_method = isset( $_POST['payment_method'] ) ? sanitize_text_field( $_POST['payment_method'] ) : null;
			if ( ! $payment_method ) {
				throw new \Exception( __( 'Invalid payment method', 'quillbooking' ) );
			}

			$event = $booking->event;
			if ( ! $event ) {
				throw new \Exception( __( 'Event not found', 'quillbooking' ) );
			}

			// Check if payment is enabled for this event
			if ( ! isset( $event->payments_settings['enable_payment'] ) || ! $event->payments_settings['enable_payment'] ) {
				throw new \Exception( __( 'Payment is not enabled for this event', 'quillbooking' ) );
			}

			// Check if the selected payment method is enabled
			$method_enabled_key = 'enable_' . $payment_method;
			if ( ! isset( $event->payments_settings[ $method_enabled_key ] ) || ! $event->payments_settings[ $method_enabled_key ] ) {
				throw new \Exception( __( 'Selected payment method is not available', 'quillbooking' ) );
			}

			// Additional validation for WooCommerce payment method
			if ( 'woocommerce' === $payment_method ) {
				// Check if WooCommerce is active
				if ( ! class_exists( 'WooCommerce' ) ) {
					throw new \Exception( __( 'WooCommerce is not active', 'quillbooking' ) );
				}

				// Check if product is set
				if ( ! isset( $event->payments_settings['woo_product'] ) || empty( $event->payments_settings['woo_product'] ) ) {
					throw new \Exception( __( 'No WooCommerce product configured for this event', 'quillbooking' ) );
				}
			}

			// Add this check at the beginning of the try block
			if ( ! defined( 'QUILLBOOKING_PRO_VERSION' ) ) {
				throw new \Exception( __( 'Payment processing requires the Pro plugin to be active', 'quillbooking' ) );
			}

			// Process the payment through the payment gateway
			do_action(
				'quillbooking_process_payment',
				$booking,
				array(
					'payment_method' => $payment_method,
				)
			);

			// Log the payment attempt
			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Payment processing initiated', 'quillbooking' ),
					'details' => sprintf( __( 'Payment processing initiated with %s', 'quillbooking' ), $payment_method ),
				)
			);

			wp_send_json_success(
				array(
					'booking' => $booking,
					'message' => __( 'Payment processing initiated', 'quillbooking' ),
				)
			);
		} catch ( \Exception $e ) {
			wp_send_json_error( array( 'message' => $e->getMessage() ) );
		}
	}
}
