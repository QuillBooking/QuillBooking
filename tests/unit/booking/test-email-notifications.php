<?php

use phpmock\phpunit\PHPMock;
use QuillBooking\Booking\Email_Notifications;


class Test_Email_Notifications extends WP_UnitTestCase {


	use PHPMock;
	protected $email_notifications;
	protected $booking;
	private $mock_wp_mail;

	public function setUp(): void {
		parent::setUp();

		$this->booking = new  FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
			)
		);

		$this->mock_wp_mail = $this->getFunctionMock( 'QuillBooking\Emails', 'wp_mail' );

		$this->email_notifications = new Email_Notifications();
	}

	public function tearDown(): void {
		// Clean up any data or state after each test
		parent::tearDown();
	}

	public function test_sending_booking_rejected_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'rejected',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'host_rejection.enabled'  => true,
			'host_rejection.template' => array(
				'subject' => 'Booking Rejected {{booking_id}}',
				'message' => 'Your booking has been rejected. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );

		$this->email_notifications->send_booking_rejected_email( $new_booking );

		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Reject email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_sending_booking_rejected_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'rejected',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'host_rejection.enabled'  => true,
			'host_rejection.template' => array(
				'subject' => 'Booking Rejected {{booking_id}}',
				'message' => 'Your booking has been rejected. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );

		$this->email_notifications->send_booking_rejected_email( $new_booking );

		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send reject email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_booking_confirmed_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'confirmed',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'host_confirmation.enabled'  => true,
			'host_confirmation.template' => array(
				'subject' => 'Booking Confirmed {{booking_id}}',
				'message' => 'Your booking has been confirmed. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );

		$this->email_notifications->send_booking_confirmed_email( $new_booking );

		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Confirmation email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_booking_confirmed_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'confirmed',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'host_confirmation.enabled'  => true,
			'host_confirmation.template' => array(
				'subject' => 'Booking Confirmed {{booking_id}}',
				'message' => 'Your booking has been confirmed. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );

		$this->email_notifications->send_booking_confirmed_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send confirmation email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_booking_pending_email() {
		$new_booking = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);

		$new_booking->event->email_notifications = array(
			'host_approval.enabled'       => true,
			'attendee_submitted.enabled'  => true,
			'host_approval.template'      => array(
				'subject' => 'Booking Pending {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
			'attendee_submitted.template' => array(
				'subject' => 'Booking Pending {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		$this->mock_wp_mail->expects( $this->exactly( 2 ) )
			->with(
				$this->anything()
			)
			->willReturn( true );

		$this->email_notifications->send_booking_pending_email( $new_booking );

		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Approval email sent to ' . $new_booking->calendar->user->user_email );

		$this->assertEquals( $new_booking->logs[1]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[1]['message'], 'Email sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[1]['details'], 'Submitted email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_booking_pending_email_failed() {
		$new_booking = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);

		$new_booking->event->email_notifications = array(
			'host_approval.enabled'       => true,
			'attendee_submitted.enabled'  => true,
			'host_approval.template'      => array(
				'subject' => 'Booking Pending {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
			'attendee_submitted.template' => array(
				'subject' => 'Booking Pending {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
		);

		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		$this->mock_wp_mail->expects( $this->exactly( 2 ) )
			->with(
				$this->anything()
			)
			->willReturn( false );
		$this->email_notifications->send_booking_pending_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send approval email to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[1]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[1]['message'], 'Email not sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[1]['details'], 'Failed to send submitted email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_organizer_reminder_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'organizer_reminder.enabled'  => true,
			'organizer_reminder.template' => array(
				'subject' => 'Booking Reminder {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );
		$this->email_notifications->send_organizer_reminder_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Reminder email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_organizer_reminder_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'organizer_reminder.enabled'  => true,
			'organizer_reminder.template' => array(
				'subject' => 'Booking Reminder {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );
		$this->email_notifications->send_organizer_reminder_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send reminder email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_attendee_reminder_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'attendee_reminder.enabled'  => true,
			'attendee_reminder.template' => array(
				'subject' => 'Booking Reminder {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );
		$this->email_notifications->send_attendee_reminder_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Reminder email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_attendee_reminder_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'attendee_reminder.enabled'  => true,
			'attendee_reminder.template' => array(
				'subject' => 'Booking Reminder {{booking_id}}',
				'message' => 'Your booking is pending. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );
		$this->email_notifications->send_attendee_reminder_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send reminder email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_organizer_rescheduled_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'organizer_rescheduled.enabled'  => true,
			'organizer_rescheduled.template' => array(
				'subject' => 'Booking Rescheduled {{booking_id}}',
				'message' => 'Your booking has been rescheduled. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );
		$this->email_notifications->send_organizer_rescheduled_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Rescheduled email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_organizer_rescheduled_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'organizer_rescheduled.enabled'  => true,
			'organizer_rescheduled.template' => array(
				'subject' => 'Booking Rescheduled {{booking_id}}',
				'message' => 'Your booking has been rescheduled. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );
		$this->email_notifications->send_organizer_rescheduled_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send rescheduled email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_attendee_rescheduled_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'attendee_rescheduled.enabled'  => true,
			'attendee_rescheduled.template' => array(
				'subject' => 'Booking Rescheduled {{booking_id}}',
				'message' => 'Your booking has been rescheduled. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );
		$this->email_notifications->send_attendee_rescheduled_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Rescheduled email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_attendee_rescheduled_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'attendee_rescheduled.enabled'  => true,
			'attendee_rescheduled.template' => array(
				'subject' => 'Booking Rescheduled {{booking_id}}',
				'message' => 'Your booking has been rescheduled. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );
		$this->email_notifications->send_attendee_rescheduled_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send rescheduled email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_attendee_cancelled_email() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'attendee_cancelled.enabled'  => true,
			'attendee_cancelled.template' => array(
				'subject' => 'Booking Cancelled {{booking_id}}',
				'message' => 'Your booking has been cancelled. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( true );
		$this->email_notifications->send_attendee_cancelled_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Cancellation email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_attendee_cancelled_email_failed() {
		$new_booking                             = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);
		$new_booking->event->email_notifications = array(
			'attendee_cancelled.enabled'  => true,
			'attendee_cancelled.template' => array(
				'subject' => 'Booking Cancelled {{booking_id}}',
				'message' => 'Your booking has been cancelled. {{booking_id}}',
			),
		);
		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';
		$this->mock_wp_mail->expects( $this->once() )->willReturn( false );
		$this->email_notifications->send_attendee_cancelled_email( $new_booking );
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send cancellation email to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_booking_created_email() {
		$new_booking = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);

		// Setting up email notifications for both attendee and organizer
		$new_booking->event->email_notifications = array(
			'attendee_confirmation.enabled'   => true,
			'organizer_notification.enabled'  => true,
			'attendee_confirmation.template'  => array(
				'subject' => 'Booking Created {{booking_id}}',
				'message' => 'Your booking has been created. {{booking_id}}',
			),
			'organizer_notification.template' => array(
				'subject' => 'Booking Created {{booking_id}}',
				'message' => 'The booking has been created. {{booking_id}}',
			),
		);

		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		// Mocking wp_mail for two email sends (one for attendee and one for organizer)
		$this->mock_wp_mail->expects( $this->exactly( 2 ) )->willReturn( true );

		// Call the method that sends the emails
		$this->email_notifications->send_booking_created_email( $new_booking );

		// Assertions for attendee email
		$this->assertEquals( $new_booking->logs[0]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Confirmation email sent to ' . $new_booking->calendar->user->user_email );

		// Assertions for organizer email
		$this->assertEquals( $new_booking->logs[1]['type'], 'info' );
		$this->assertEquals( $new_booking->logs[1]['message'], 'Email sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[1]['details'], 'Notification email sent to ' . $new_booking->calendar->user->user_email );
	}

	public function test_send_booking_created_email_failed() {
		$new_booking = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'pending',
				'slug'   => 'booking',
			)
		);

		// Setting up email notifications for both attendee and organizer
		$new_booking->event->email_notifications = array(
			'attendee_confirmation.enabled'   => true,
			'organizer_notification.enabled'  => true,
			'attendee_confirmation.template'  => array(
				'subject' => 'Booking Created {{booking_id}}',
				'message' => 'Your booking has been created. {{booking_id}}',
			),
			'organizer_notification.template' => array(
				'subject' => 'Booking Created {{booking_id}}',
				'message' => 'The booking has been created. {{booking_id}}',
			),
		);

		$new_booking->guest->email               = 'ahmed.galal@gmail.com';
		$new_booking->calendar->user->user_email = 'ahahmed.galal@gmail.com';

		// Mocking wp_mail for two email sends (one for attendee and one for organizer)
		$this->mock_wp_mail->expects( $this->exactly( 2 ) )->willReturn( false );
		// Call the method that sends the emails
		$this->email_notifications->send_booking_created_email( $new_booking );
		// Assertions for attendee email
		$this->assertEquals( $new_booking->logs[0]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[0]['message'], 'Email not sent to ' . $new_booking->guest->email );
		$this->assertEquals( $new_booking->logs[0]['details'], 'Failed to send confirmation email to ' . $new_booking->calendar->user->user_email );
		// Assertions for organizer email
		$this->assertEquals( $new_booking->logs[1]['type'], 'error' );
		$this->assertEquals( $new_booking->logs[1]['message'], 'Email not sent to ' . $new_booking->calendar->user->user_email );
		$this->assertEquals( $new_booking->logs[1]['details'], 'Failed to send notification email to ' . $new_booking->calendar->user->user_email );
	}
}
