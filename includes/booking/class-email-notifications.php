<?php

/**
 * Class Email_Notifications
 *
 * This class is responsible for handling email notifications
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use Illuminate\Support\Arr;
use QuillBooking\Emails\Emails;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Managers\Merge_Tags_Manager;
use QuillBooking\QuillBooking;

/**
 * Class Email_Notifications
 *
 * This class is responsible for handling email notifications
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */
final class Email_Notifications {



	/**
	 * Merge Tags Manager
	 *
	 * @since 1.0.0
	 *
	 * @var Merge_Tags_Manager
	 */
	protected $merge_tags_manager;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		 $this->merge_tags_manager = Merge_Tags_Manager::instance();
		$this->init_hooks();
	}

	/**
	 * Init Hooks
	 *
	 * @since 1.0.0
	 */
	public function init_hooks() {
		// Use priority 99 to ensure emails are sent AFTER all integrations have processed
		// (e.g., Zoom/Google Meet creating meetings and updating location with meeting links)
		add_action( 'quillbooking_booking_created', array( $this, 'send_booking_created_email' ), 99 );
		add_action( 'quillbooking_booking_attendee_cancelled', array( $this, 'send_attendee_cancelled_email' ), 99 );
		add_action( 'quillbooking_booking_organizer_cancelled', array( $this, 'send_organizer_cancelled_email' ), 99 );
		add_action( 'quillbooking_booking_organizer_rescheduled', array( $this, 'send_organizer_rescheduled_email' ), 99 );
		add_action( 'quillbooking_booking_attendee_rescheduled', array( $this, 'send_attendee_rescheduled_email' ), 99 );
		add_action( 'quillbooking_booking_pending', array( $this, 'send_booking_pending_email' ), 99 );
		add_action( 'quillbooking_booking_confirmed', array( $this, 'send_booking_confirmed_email' ), 99 );
		add_action( 'quillbooking_booking_rejected', array( $this, 'send_booking_rejected_email' ), 99 );

		add_action( 'init', array( $this, 'send_reminder_emails' ) );
	}

	/**
	 * Send Reminder Emails
	 *
	 * @since 1.0.0
	 */
	public function send_reminder_emails() {
		QuillBooking::instance()->tasks->register_callback( 'booking_organizer_reminder', array( $this, 'send_organizer_reminder_email' ) );
		QuillBooking::instance()->tasks->register_callback( 'booking_attendee_reminder', array( $this, 'send_attendee_reminder_email' ) );
	}

	/**
	 * Send Booking Rejected Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_booking_rejected_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$host_rejection = Arr::get( $email_notifications, 'host_rejection.enabled', true );
		if ( $host_rejection ) {
			$host_template = Arr::get( $email_notifications, 'host_rejection.template' );
			$email         = $booking->guest->email;
			$result        = $this->send_email( $booking, $host_template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Reject email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send reject email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Booking Confirmed Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_booking_confirmed_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$host_confirmation = Arr::get( $email_notifications, 'host_approved_attendee.enabled', true );
		if ( $host_confirmation ) {
			$host_template = Arr::get( $email_notifications, 'host_approved_attendee.template' );
			$email         = $booking->guest->email;
			$result        = $this->send_email( $booking, $host_template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Confirmation email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send confirmation email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Booking Pending Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_booking_pending_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$host_approval      = Arr::get( $email_notifications, 'host_approval.enabled', true );
		$attendee_submitted = Arr::get( $email_notifications, 'attendee_submitted.enabled', true );
		if ( $host_approval ) {
			$host_template = Arr::get( $email_notifications, 'host_approval.template' );
			$email         = $booking->calendar->user->user_email;
			$result        = $this->send_email( $booking, $host_template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Approval email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send approval email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}

		if ( $attendee_submitted ) {
			$attendee_template = Arr::get( $email_notifications, 'attendee_submitted.template' );
			$email             = $booking->guest->email;
			$result            = $this->send_email( $booking, $attendee_template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Submitted email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send submitted email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Organizer Reminder Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_organizer_reminder_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$organizer_reminder = Arr::get( $email_notifications, 'organizer_reminder.enabled', true );
		if ( $organizer_reminder ) {
			$template = Arr::get( $email_notifications, 'organizer_reminder.template' );
			$email    = $booking->calendar->user->user_email;
			$result   = $this->send_email( $booking, $template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Reminder email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send reminder email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Attendee Reminder Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_attendee_reminder_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$attendee_reminder = Arr::get( $email_notifications, 'attendee_reminder.enabled', true );
		if ( $attendee_reminder ) {
			$template = Arr::get( $email_notifications, 'attendee_reminder.template' );
			$email    = $booking->guest->email;
			$result   = $this->send_email( $booking, $template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Reminder email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send reminder email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Organizer Rescheduled Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_organizer_rescheduled_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$organizer_rescheduled = Arr::get( $email_notifications, 'organizer_rescheduled_attendee.enabled', true );
		if ( $organizer_rescheduled ) {
			$template = Arr::get( $email_notifications, 'organizer_rescheduled_attendee.template' );
			$email    = $booking->guest->email;
			$result   = $this->send_email( $booking, $template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Rescheduled email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send rescheduled email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Attendee Rescheduled Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_attendee_rescheduled_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$attendee_rescheduled = Arr::get( $email_notifications, 'attendee_rescheduled_organizer.enabled', true );
		if ( $attendee_rescheduled ) {
			$template = Arr::get( $email_notifications, 'attendee_rescheduled_organizer.template' );
			$email    = $booking->calendar->user->user_email;
			$result   = $this->send_email( $booking, $template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Rescheduled email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send rescheduled email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Organizer Cancelled Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_organizer_cancelled_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$organizer_cancellation = Arr::get( $email_notifications, 'organizer_cancelled_attendee.enabled', true );
		if ( $organizer_cancellation ) {
			$template = Arr::get( $email_notifications, 'organizer_cancelled_attendee.template' );
			$email    = $booking->guest->email;
			$result   = $this->send_email( $booking, $template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Cancellation email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send cancellation email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Attendee Cancelled Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_attendee_cancelled_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$attendee_cancellation = Arr::get( $email_notifications, 'attendee_cancelled_organizer.enabled', true );
		if ( $attendee_cancellation ) {
			$attendee_template = Arr::get( $email_notifications, 'attendee_cancelled_organizer.template' );
			$email             = $booking->calendar->user->user_email;
			$result            = $this->send_email( $booking, $attendee_template, $email );
			if ( $result ) {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'info',
						'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Cancellation email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			} else {
				$this->create_booking_log(
					$booking,
					array(
						'type'    => 'error',
						'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
						'details' => sprintf( __( 'Failed to send cancellation email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
					)
				);
			}
		}
	}

	/**
	 * Send Booking Created Email
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 */
	public function send_booking_created_email( $booking ) {
		$event               = $booking->event;
		$email_notifications = $event->email_notifications;

		$attendee_confirmation  = Arr::get( $email_notifications, 'attendee_confirmation.enabled', true );
		$organizer_notification = Arr::get( $email_notifications, 'organizer_notification.enabled', true );

		if ( $attendee_confirmation ) {
			$attendee_template = Arr::get( $email_notifications, 'attendee_confirmation.template' );
			$this->send_attendee_confirmation_email( $booking, $attendee_template );
		}

		if ( $organizer_notification ) {
			$organizer_template = Arr::get( $email_notifications, 'organizer_notification.template' );
			$this->send_organizer_notification_email( $booking, $organizer_template );
		}
	}

	/**
	 * Send Attendee Confirmation Email
	 *
	 * @param Booking_Model $booking
	 * @param array         $template
	 */
	private function send_attendee_confirmation_email( $booking, $template ) {
		$email  = $booking->guest->email;
		$result = $this->send_email( $booking, $template, $email );
		if ( $result ) {
			$this->create_booking_log(
				$booking,
				array(
					'type'    => 'info',
					'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
					'details' => sprintf( __( 'Confirmation email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
				)
			);
		} else {
			$this->create_booking_log(
				$booking,
				array(
					'type'    => 'error',
					'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
					'details' => sprintf( __( 'Failed to send confirmation email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
				)
			);
		}
	}

	/**
	 * Send Organizer Notification Email
	 *
	 * @param Booking_Model $booking
	 * @param array         $template
	 */
	private function send_organizer_notification_email( $booking, $template ) {
		$email  = $booking->calendar->user->user_email;
		$result = $this->send_email( $booking, $template, $email );
		if ( $result ) {
			$this->create_booking_log(
				$booking,
				array(
					'type'    => 'info',
					'message' => sprintf( __( 'Email sent to %s', 'quillbooking' ), $email ),
					'details' => sprintf( __( 'Notification email sent to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
				)
			);
		} else {
			$this->create_booking_log(
				$booking,
				array(
					'type'    => 'error',
					'message' => sprintf( __( 'Email not sent to %s', 'quillbooking' ), $email ),
					'details' => sprintf( __( 'Failed to send notification email to %s', 'quillbooking' ), $booking->calendar->user->user_email ),
				)
			);
		}
	}

	/**
	 * Send Email
	 *
	 * @param Booking_Model $booking
	 * @param array         $template
	 * @param string        $email
	 *
	 * @return bool
	 */
	private function send_email( $booking, $template, $email ) {
		$subject = Arr::get( $template, 'subject' );
		$body    = Arr::get( $template, 'message' );

		// Refresh booking from database to get the latest data
		// (e.g., meeting links added by integrations like Zoom/Google Meet)
		$booking = Booking_Model::find( $booking->id );

		$subject = $this->merge_tags_manager->process_merge_tags( $subject, $booking );
		$body    = $this->merge_tags_manager->process_merge_tags( $body, $booking );

		$emails = new Emails();
		$result = $emails->send( $email, $subject, $body, array(), $booking );

		// Log the result
		if ( $result ) {
			error_log( sprintf( '[QuillBooking] Email sent successfully to %s. Subject: %s', $email, $subject ) );
		} else {
			error_log( sprintf( '[QuillBooking] Failed to send email to %s. Subject: %s', $email, $subject ) );
		}

		return $result;
	}

	/**
	 * Create booking log
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking
	 * @param array         $data
	 *
	 * @return void
	 */
	public function create_booking_log( $booking, $data ) {
		$booking->logs()->create( $data );
	}
}
