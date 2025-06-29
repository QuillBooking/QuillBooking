<?php

/**
 * Booking Actions
 *
 * This class is responsible for handling booking actions
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use DateTime;
use DateTimeZone;
use Exception;
use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use Illuminate\Support\Arr;
use QuillBooking\Models\User_Model;
use QuillBooking\Renderer;
use QuillBooking\Settings;

class Booking_Actions {

	// --- Dependency Properties ---
	private string $calendarModelClass;
	private string $eventModelClass;
	private string $bookingValidatorClass; // Inject validator class name too
	private string $globalSettingsClass;

	public function __construct(
		string $calendarModelClass = Calendar_Model::class,
		string $eventModelClass = Event_Model::class,
		string $bookingValidatorClass = Booking_Validator::class,
		string $GlobalSettingsClass = Settings::class
	) {
		$this->calendarModelClass    = $calendarModelClass;
		$this->eventModelClass       = $eventModelClass;
		$this->bookingValidatorClass = $bookingValidatorClass;
		$this->globalSettingsClass   = $GlobalSettingsClass;

		add_action( 'wp_loaded', array( $this, 'init' ) );
	}

	

	public function init() {
		$this->booking_actions();
	}


	public function process_booking_action( $action_type, $new_status, $log_message, $log_details ) {
		$action = Arr::get( $_GET, 'quillbooking_action', null );
		if ( $action_type !== $action ) {
			return;
		}

		try {
			$id      = sanitize_text_field( Arr::get( $_GET, 'id', null ) );
			$booking = $this->bookingValidatorClass::validate_booking( $id );

			if ( $booking->status === $new_status ) {
				throw new \Exception( sprintf( __( 'Booking is already %s', 'quillbooking' ), $new_status ) );
			}

			$booking->status = $new_status;
			$booking->save();

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => $log_message,
					'details' => $log_details,
				)
			);

			do_action( "quillbooking_booking_{$action_type}", $booking );

			wp_send_json_success( $this->generate_success_message( ucfirst( $action_type ), $new_status ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( $this->generate_error_message( ucfirst( $action_type ), $e->getMessage() ) );
		}
	}

	public function generate_success_message( $action, $status ) {
		return array(
			'status'  => 'success',
			'title'   => sprintf( __( '%s Successful', 'quillbooking' ), ucfirst( $action ) ),
			'message' => sprintf( __( 'The booking has been successfully %s.', 'quillbooking' ), $status ),
		);
	}

	public function generate_error_message( $action, $message ) {
		return array(
			'status'  => 'error',
			'title'   => sprintf( __( '%s Failed', 'quillbooking' ), ucfirst( $action ) ),
			'message' => $message,
		);
	}



	private function booking_actions() {
		$this->process_booking_action( 'reject', 'rejected', __( 'Booking rejected', 'quillbooking' ), __( 'Booking rejected by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'confirm', 'scheduled', __( 'Booking confirmed', 'quillbooking' ), __( 'Booking confirmed by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'reschedule', 'rescheduled', __( 'Booking rescheduled', 'quillbooking' ), __( 'Booking rescheduled by Attendee', 'quillbooking' ) );
		$this->process_booking_action( 'cancel', 'cancelled', __( 'Booking cancelled', 'quillbooking' ), __( 'Booking cancelled by Attendee', 'quillbooking' ) );
	}

}