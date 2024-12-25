<?php
/**
 * Twilio Notifications
 *
 * This class is responsible for handling the Twilio notifications
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations;

use QuillBooking\Integrations\Twilio\REST_API\REST_API;
use QuillBooking\Managers\Merge_Tags_Manager;

/**
 * Twilio Notifications class
 */
class Notifications {

	/**
	 * Merge Tags Manager
	 *
	 * @since 1.0.0
	 *
	 * @var Merge_Tags_Manager
	 */
	private $merge_tags_manager;

	/**
	 * Inetgration
	 *
	 * @var Integration
	 */
	private $integration;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration Integration.
	 */
	public function __construct( $integration ) {
		$this->integration        = $integration;
		$this->merge_tags_manager = Merge_Tags_Manager::instance();
		$this->init();
	}

	/**
	 * Initialize
	 */
	public function init() {
		add_action( 'quillbooking_booking_created', array( $this, 'send_booking_created_sms' ) );
		add_action( 'quillbooking_booking_attendee_cancelled', array( $this, 'send_attendee_cancelled_sms' ) );
		add_action( 'quillbooking_booking_organizer_cancelled', array( $this, 'send_organizer_cancelled_sms' ) );
		add_action( 'quillbooking_booking_organizer_rescheduled', array( $this, 'send_organizer_rescheduled_sms' ) );
		add_action( 'quillbooking_booking_attendee_rescheduled', array( $this, 'send_attendee_rescheduled_sms' ) );

		add_action( 'init', array( $this, 'send_reminder_sms' ) );
	}

	/**
	 * Send Reminder SMS
	 *
	 * @since 1.0.0
	 */
	public function send_reminder_sms() {
		QuillBooking::instance()->tasks->register_callback( 'booking_organizer_reminder', array( $this, 'send_organizer_reminder_sms' ) );
		QuillBooking::instance()->tasks->register_callback( 'booking_attendee_reminder', array( $this, 'send_attendee_reminder_sms' ) );
	}

	/**
	 * Send Booking Created SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_booking_created_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$attendee_confirmation  = Arr::get( $sms_notifications, 'attendee_confirmation.enabled', true );
		$organizer_confirmation = Arr::get( $sms_notifications, 'organizer_confirmation.enabled', true );
		if ( $attendee_confirmation ) {
			$attendee_template = Arr::get( $sms_notifications, 'attendee_confirmation.template' );
			$this->send_message( $booking, $attendee_template );
		}

		if ( $organizer_confirmation ) {
			$organizer_template = Arr::get( $sms_notifications, 'organizer_confirmation.template' );
			$this->send_message( $booking, $organizer_template );
		}
	}

	/**
	 * Send Attendee Cancelled SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_attendee_cancelled_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$attendee_cancellation = Arr::get( $sms_notifications, 'attendee_cancellation.enabled', true );
		if ( $attendee_cancellation ) {
			$attendee_template = Arr::get( $sms_notifications, 'attendee_cancellation.template' );
			$this->send_message( $booking, $attendee_template );
		}
	}

	/**
	 * Send Organizer Cancelled SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_organizer_cancelled_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$organizer_cancellation = Arr::get( $sms_notifications, 'organizer_cancellation.enabled', true );
		if ( $organizer_cancellation ) {
			$organizer_template = Arr::get( $sms_notifications, 'organizer_cancellation.template' );
			$this->send_message( $booking, $organizer_template );
		}
	}

	/**
	 * Send Organizer Rescheduled SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_organizer_rescheduled_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$organizer_rescheduled = Arr::get( $sms_notifications, 'organizer_reschedule.enabled', true );
		if ( $organizer_rescheduled ) {
			$organizer_template = Arr::get( $sms_notifications, 'organizer_reschedule.template' );
			$this->send_message( $booking, $organizer_template );
		}
	}

	/**
	 * Send Attendee Rescheduled SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_attendee_rescheduled_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$attendee_rescheduled = Arr::get( $sms_notifications, 'attendee_reschedule.enabled', true );
		if ( $attendee_rescheduled ) {
			$attendee_template = Arr::get( $sms_notifications, 'attendee_reschedule.template' );
			$this->send_message( $booking, $attendee_template );
		}
	}

	/**
	 * Send Booking Pending SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_booking_pending_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$pending = Arr::get( $sms_notifications, 'pending.enabled', true );
		if ( $pending ) {
			$template = Arr::get( $sms_notifications, 'pending.template' );
			$this->send_message( $booking, $template );
		}
	}

	/**
	 * Send Organizer Reminder SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_organizer_reminder_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$reminder = Arr::get( $sms_notifications, 'organizer_reminder.enabled', true );
		if ( $reminder ) {
			$template = Arr::get( $sms_notifications, 'organizer_reminder.template' );
			$this->send_message( $booking, $template );
		}
	}

	/**
	 * Send Attendee Reminder SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_attendee_reminder_sms( $booking ) {
		$event = $booking->event;
		$this->set_host( $event->calendar );
		$sms_notifications = $event->sms_notifications;

		$reminder = Arr::get( $sms_notifications, 'attendee_reminder.enabled', true );
		if ( $reminder ) {
			$template = Arr::get( $sms_notifications, 'attendee_reminder.template' );
			$this->send_message( $booking, $template );
		}
	}

	/**
	 * Send Attendee Confirmation Message
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param string        $template Template.
	 */
	public function send_message( $booking, $template ) {
		$type    = Arr::get( $template, 'type', 'sms' );
		$message = Arr::get( $template, 'message' );

		if ( 'sms' === $type ) {
			$this->send_sms( $booking->attendee_phone, $message, $booking );
		} else {
			$this->send_whatsapp_message( $booking->attendee_phone, $message, $booking );
		}
	}

	/**
	 * Send SMS
	 *
	 * @since 1.0.0
	 *
	 * @param string        $to To.
	 * @param string        $message Message.
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_sms( $to, $message, $booking ) {
		// For Testing.
		$to       = '+201006692679';
		$accounts = $this->accounts->get_accounts();
		foreach ( $accounts as $account_id => $account ) {
			$api = $this->integration->connect( $booking->calendar->id, $account_id );
			if ( is_wp_error( $api ) ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error Connecting to Twilio', 'quillbooking' ),
						'details' => sprintf( 'Error connecting to host %s with twilio account %s', $booking->calendar->name, $account_id ),
					)
				);
				continue;
			}

			$message = $this->merge_tags_manager->process_merge_tags( $message, $booking );
			$result  = $api->send_sms( $to, $message );
			error_log( 'SMS Result: ' . wp_json_encode( $result ) );
		}
	}

	/**
	 * Send WhatsApp Message
	 *
	 * @since 1.0.0
	 *
	 * @param string        $to To.
	 * @param string        $message Message.
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_whatsapp_message( $to, $message, $booking ) {
		$accounts = $this->accounts->get_accounts();
		foreach ( $accounts as $account_id => $account ) {
			$api = $this->integration->connect( $this->host_id, $account_id );
			if ( is_wp_error( $api ) ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error Connecting to Twilio', 'quillbooking' ),
						'details' => sprintf( 'Error connecting to host %s with twilio account %s', $booking->calendar->name, $account_id ),
					)
				);
				continue;
			}

			$message = $this->merge_tags_manager->process_merge_tags( $message, $booking );
			$result  = $api->send_whatsapp_message( $to, $message );
		}
	}
}
