<?php
/**
 * Class Event_Fields
 *
 * This class is responsible for handling the event fields
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Fields;

use Illuminate\Support\Arr;
use QuillBooking\Utils;
use QuillBooking\Traits\Singleton;

/**
 * Event Fields class
 */
class Event_Fields {

	use Singleton;

	/**
	 * Get system fields
	 *
	 * @return array
	 */
	public function get_system_fields() {
		$default_fields = array(
			'name'    => array(
				'label'          => __( 'Your Name', 'quillbooking' ),
				'type'           => 'text',
				'required'       => true,
				'group'          => 'system',
				'event_location' => 'all',
				'placeholder'    => __( 'Enter your name', 'quillbooking' ),
				'order'          => 1,
			),
			'email'   => array(
				'label'          => __( 'Your Email', 'quillbooking' ),
				'type'           => 'email',
				'required'       => true,
				'group'          => 'system',
				'event_location' => 'all',
				'placeholder'    => __( 'Enter your email', 'quillbooking' ),
				'order'          => 2,
			),
			'message' => array(
				'label'          => __( 'What is this meeting about?', 'quillbooking' ),
				'type'           => 'textarea',
				'required'       => false,
				'group'          => 'system',
				'event_location' => 'all',
				'placeholder'    => __( 'Enter your message', 'quillbooking' ),
				'order'          => 3,
			),
		);

		return $default_fields;
	}

	/**
	 * Get default additional settings values
	 *
	 * @since 1.0.0
	 *
	 * @param string $event_type Event type
	 *
	 * @return array
	 */
	public function get_default_additional_settings( $event_type ) {
		$values = array(
			'allow_attendees_to_select_duration' => false,
			'default_duration'                   => '',
			'selectable_durations'               => array(
				15,
			),
		);

		switch ( $event_type ) {
			case 'one-to-one':
			case 'round-robin':
			case 'collective':
				$values['invitee'] = array(
					'allow_additional_guests' => false,
				);
				break;
			case 'group':
				$values['invitees'] = array(
					'max_invitees'   => 4,
					'show_remaining' => false,
				);
				break;
		}

		return $values;
	}

	/**
	 * Get duration options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_duration_options() {
		// Range from 5 minutes to 480 minutes
		$minutes = range( 5, 480, 5 );
		$options = array();

		foreach ( $minutes as $minute ) {
			$options[ $minute ] = sprintf( _n( '%d minute', '%d minutes', $minute, 'quillbooking' ), $minute );
		}

		return $options;
	}

	/**
	 * Get default limit settings values
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_limit_settings() {
		$values = array(
			'general'       => array(
				'buffer_before'       => 0,
				'buffer_after'        => 0,
				'minimum_notices'     => 4,
				'minimum_notice_unit' => 'hours',
				'time_slot'           => 0,
			),
			'frequency'     => array(
				'enable' => false,
				'limits' => array(
					array(
						'limit' => 5,
						'unit'  => 'days',
					),
				),
			),
			'duration'      => array(
				'enable' => false,
				'limits' => array(
					array(
						'limit' => 120,
						'unit'  => 'hours',
					),
				),
			),
			'timezone_lock' => array(
				'enable'   => false,
				'timezone' => wp_timezone_string(),
			),
		);

		return $values;
	}

	/**
	 * Get email notification settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_email_notification_settings() {
		return array(
			'attendee_confirmation'          => array(
				'label'    => __( 'Attendee Confirmation', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Confirmation', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'attendee_confirmation' ),
				),
			),
			'organizer_notification'         => array(
				'label'    => __( 'Organizer Notification', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'New Booking', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'organizer_notification' ),
				),
			),
			'attendee_reminder'              => array(
				'label'    => __( 'Attendee Reminder', 'quillbooking' ),
				'default'  => false,
				'template' => array(
					'subject' => __( 'Booking Reminder', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'attendee_reminder' ),
				),
				'times'    => array(
					array(
						'unit'  => 'hours',
						'value' => 24,
					),
				),
			),
			'organizer_reminder'             => array(
				'label'    => __( 'Organizer Reminder', 'quillbooking' ),
				'default'  => false,
				'template' => array(
					'subject' => __( 'Booking Reminder', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'organizer_reminder' ),
				),
				'times'    => array(
					array(
						'unit'  => 'hours',
						'value' => 24,
					),
				),
			),
			'attendee_cancelled_organizer'   => array(
				'label'    => __( 'Booking Cancelled by Attendee to Organizer', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Cancelled', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'attendee_cancelled_organizer' ),
				),
			),
			'organizer_cancelled_attendee'   => array(
				'label'    => __( 'Booking Cancelled by Organizer to Attendee', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Cancelled', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'organizer_cancelled_attendee' ),
				),
			),
			'attendee_rescheduled_organizer' => array(
				'label'    => __( 'Booking Rescheduled by Attendee to Organizer', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Rescheduled', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'attendee_rescheduled_organizer' ),
				),
			),
			'organizer_rescheduled_attendee' => array(
				'label'    => __( 'Booking Rescheduled by Organizer to Attendee', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Rescheduled', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'organizer_rescheduled_attendee' ),
				),
			),
			'host_approval'                  => array(
				'label'    => __( 'Host Approval', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Request', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'host_approval' ),
				),
			),
			'host_rejection'                 => array(
				'label'    => __( 'Host Rejection', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Rejected', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'host_rejection' ),
				),
			),
			'host_approved_attendee'         => array(
				'label'    => __( 'Host Approved to Attendee', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Your Booking is Confirmed!', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'host_approved_attendee' ),
				),
			),
			'attendee_submitted'             => array(
				'label'    => __( 'Booking Submitted by Attendee', 'quillbooking' ),
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Pending Confirmation', 'quillbooking' ),
					'message' => $this->get_default_email_body_template( 'attendee_submitted' ),
				),
			),
		);
	}

	/**
	 * Get default email body template
	 *
	 * @since 1.0.0
	 *
	 * @param string $template Template
	 *
	 * @return string
	 */
	public function get_default_email_body_template( $template ) {
		$attendee_confirmation = '
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
			<h1 style="color: #0073aa; text-align: center;">Booking Confirmation</h1>
			<p style="margin-bottom: 20px;">Dear {{guest:name}},</p>
			<p>Your booking has been confirmed successfully. Below are the details of your booking:</p>
			<h2 style="color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Booking Details</h2>
			<p><strong>Event Name:</strong> {{booking:event_name}}</p>
			<p><strong>Start Time:</strong> {{booking:start_time format="F j, Y, g:i a" timezone="attendee"}}</p>
			<p><strong>End Time:</strong> {{booking:end_time format="F j, Y, g:i a" timezone="attendee"}}</p>
			<p><strong>Location:</strong> {{booking:event_location}}</p>
			<h2 style="color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Host Details</h2>
			<p><strong>Name:</strong> {{host:name}}</p>
			<p><strong>Email:</strong> {{host:email}}</p>
			<div style="margin: 20px 0; display: flex;">
				<a href="{{booking:reschedule_url}}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0073aa; text-decoration: none; border-radius: 3px; margin-right:20px">Reschedule Booking</a>
				<a href="{{booking:cancel_url}}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #e74c3c; text-decoration: none; border-radius: 3px;">Cancel Booking</a>
			</div>
			<p>If you have any questions, feel free to contact us.</p>
			<p>Best regards,</p>
		</div>';

		$host_confirmation = '
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
			<h1 style="color: #0073aa; text-align: center;">New Booking Notification</h1>
			<p style="margin-bottom: 20px;">Dear {{host:name}},</p>
			<p>A new booking has been successfully created for your event. Below are the details of the booking:</p>
			<h2 style="color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Booking Details</h2>
			<p><strong>Event Name:</strong> {{booking:event_name}}</p>
			<p><strong>Start Time:</strong> {{booking:start_time format="F j, Y, g:i a" timezone="host"}}</p>
			<p><strong>End Time:</strong> {{booking:end_time format="F j, Y, g:i a" timezone="host"}}</p>
			<p><strong>Location:</strong> {{booking:event_location}}</p>
			<h2 style="color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Guest Details</h2>
			<p><strong>Name:</strong> {{guest:name}}</p>
			<p><strong>Email:</strong> {{guest:email}}</p>
			<p><strong>Note:</strong> {{guest:note}}</p>
			<p style="margin: 20px 0;"><a href="{{booking:details_url}}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0073aa; text-decoration: none; border-radius: 3px;">View Booking Details</a></p>
		</div>';

		$attendee_reschedule = '
		<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">The booking has been rescheduled!</h1>
				<p style="font-size: 16px; color: #555; line-height: 1.5;">Here are the updated details of the rescheduled booking:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Attendee Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Attendee Email:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:email}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">New Start Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:start_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">New End Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:end_time}}</td>
					</tr>
				</table>
				<p style="font-size: 16px; color: #555; margin-top: 20px;">You can view the booking details and make further adjustments using the link below.</p>
				<a href="{{booking:details_url}}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #0073aa; color: #fff; text-decoration: none; border-radius: 4px; font-size: 16px;">View Booking Details</a>
			</div>
		</div>';

		$organizer_rescheduled = '
		<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Your booking has been rescheduled by the host!</h1>
				<p style="font-size: 16px; color: #555; line-height: 1.5;">Here are the updated details of your booking:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">New Start Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:start_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">New End Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:end_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Location:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_location}}</td>
					</tr>
				</table>
				<p style="font-size: 16px; color: #555; margin-top: 20px;">If you have any questions or need further assistance, please reach out.</p>
				<div style="margin-top: 20px;">
					<a href="{{booking:details_url}}" style="display: inline-block; margin-right: 10px; padding: 10px 20px; background-color: #0073aa; color: #fff; text-decoration: none; border-radius: 4px; font-size: 16px;">View Booking Details</a>
					<a href="{{booking:cancel_url}}" style="display: inline-block; padding: 10px 20px; background-color: #d9534f; color: #fff; text-decoration: none; border-radius: 4px; font-size: 16px;">Cancel Booking</a>
				</div>
			</div>
		</div>';

		$organizer_cancel = '
		<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">We regret to inform you that your booking has been cancelled.</h1>
				<p style="font-size: 16px; color: #555; line-height: 1.5;">Here are the details of the cancelled booking:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled Start Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:start_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled End Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:end_time}}</td>
					</tr>
				</table>
				<p style="font-size: 16px; color: #555; margin-top: 20px;">If you have any questions or need assistance, feel free to contact us.</p>
			</div>
		</div>';

		$attendee_cancel = '
		<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">The following booking has been cancelled by the attendee.</h1>
				<p style="font-size: 16px; color: #555; line-height: 1.5;">Here are the details of the cancelled booking:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Attendee Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Attendee Email:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:email}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled Start Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:start_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled End Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:end_time}}</td>
					</tr>
				</table>
				<p style="font-size: 16px; color: #555; margin-top: 20px;">If you have any questions or need further details, please reach out to the attendee directly.</p>
			</div>
		</div>';

		$attendee_reminder = '
		<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">We\'re looking forward to seeing you soon!</h1>
				<p style="font-size: 16px; color: #555; line-height: 1.5;">Here are the details of your upcoming booking:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Your Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled Start Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:start_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled End Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:end_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Location:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_location}}</td>
					</tr>
				</table>
				<p style="font-size: 16px; color: #555; margin-top: 20px;">If you need to reschedule or cancel, please use the links below:</p>
				<p style="font-size: 16px; color: #555; margin-top: 10px;">Cancel Booking: {{booking:cancel_url}}</p>
			</div>
		</div>';

		$organizer_reminder = '
		<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
				<h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">A booking is coming up soon!</h1>
				<p style="font-size: 16px; color: #555; line-height: 1.5;">Here are the details of the scheduled booking:</p>
				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Guest Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Guest Email:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{guest:email}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Name:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_name}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled Start Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:start_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Scheduled End Time:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:end_time}}</td>
					</tr>
					<tr>
						<td style="font-weight: bold; color: #333; padding: 8px; border-bottom: 1px solid #ddd;">Event Location:</td>
						<td style="color: #555; padding: 8px; border-bottom: 1px solid #ddd;">{{booking:event_location}}</td>
					</tr>
				</table>
				<p style="font-size: 16px; color: #555; margin-top: 20px;">For more details, you can view the booking:</p>
				<p style="font-size: 16px; color: #555; margin-top: 10px;">
					<a href="{{booking:details_url}}" style="color: #0073aa; text-decoration: none;">View Booking Details</a>
				</p>
			</div>
		</div>';

		$host_approve = '
		<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
			<p>A new booking has been confirmed for your event.</p>
			<p>Here are the details of the booking:</p>
			<ul>
				<li><strong>Booking Name:</strong> {{booking:name}}</li>
				<li><strong>Start Time:</strong> {{booking:start_time format="F j, Y g:i A" timezone="host"}}</li>
				<li><strong>End Time:</strong> {{booking:end_time format="F j, Y g:i A" timezone="host"}}</li>
				<li><strong>Guest Name:</strong> {{guest:name}}</li>
				<li><strong>Guest Email:</strong> {{guest:email}}</li>
			</ul>
			<div style="margin-top: 20px; display: flex;">
				<a href="{{booking:confirm_url}}" style="background-color: #28a745; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Confirm Booking</a>
				<a href="{{booking:reject_url}}" style="background-color: #dc3545; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Reject Booking</a>
			</div>
		</div>';

		$host_approved_attendee = '
		<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
			<p>Good news! Your booking has been confirmed.</p>
			<p>Booking Details:</p>
			<ul>
				<li><strong>Event Name:</strong> {{booking:event_name}}</li>
				<li><strong>Start Time:</strong> {{booking:start_time format="F j, Y g:i A" timezone="attendee"}}</li>
				<li><strong>End Time:</strong> {{booking:end_time format="F j, Y g:i A" timezone="attendee"}}</li>
				<li><strong>Host Name:</strong> {{host:name}}</li>
			</ul>
			<p>
				<a href="{{booking:cancel_url}}" style="background-color: #dc3545; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Cancel Booking</a>
			</p>
		</div>';

		$attendee_submitted = '
		<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
			<p>Your booking has been submitted and is awaiting confirmation from the host.</p>
			<p>Booking Details:</p>
			<ul>
				<li><strong>Event Name:</strong> {{booking:event_name}}</li>
				<li><strong>Start Time:</strong> {{booking:start_time format="F j, Y g:i A" timezone="attendee"}}</li>
				<li><strong>End Time:</strong> {{booking:end_time format="F j, Y g:i A" timezone="attendee"}}</li>
				<li><strong>Host Name:</strong> {{host:name}}</li>
			</ul>
			<p>You will receive a confirmation email once the host confirms the booking.</p>
		</div>';

		$host_reject_attendee = '
		<div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;">
			<p>We regret to inform you that your booking request has been rejected.</p>
			<p>Here are the details of your booking:</p>
			<ul>
				<li><strong>Booking Name:</strong> {{booking:name}}</li>
				<li><strong>Start Time:</strong> {{booking:start_time format="F j, Y g:i A" timezone="attendee"}}</li>
				<li><strong>End Time:</strong> {{booking:end_time format="F j, Y g:i A" timezone="attendee"}}</li>
			</ul>
			<p>If you have any questions, please contact the organizer.</p>
		</div>';

		$templates = array(
			'attendee_confirmation'          => $attendee_confirmation,
			'organizer_notification'         => $host_confirmation,
			'attendee_reminder'              => $attendee_reminder,
			'organizer_reminder'             => $organizer_reminder,
			'attendee_cancelled_organizer'   => $attendee_cancel,
			'organizer_cancelled_attendee'   => $organizer_cancel,
			'attendee_rescheduled_organizer' => $attendee_reschedule,
			'organizer_rescheduled_attendee' => $organizer_rescheduled,
			'host_approval'                  => $host_approve,
			'host_approved_attendee'         => $host_approved_attendee,
			'attendee_submitted'             => $attendee_submitted,
			'host_rejection'                 => $host_reject_attendee,
		);

		return Arr::get( $templates, $template, '' );
	}

	/**
	 * SMS notification settings.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_sms_notification_settings() {
		return array(
			'attendee_confirmation'  => array(
				'label'    => __( 'Attendee Confirmation', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'attendee_confirmation' ),
				),
				'default'  => true,
			),
			'organizer_confirmation' => array(
				'label'    => __( 'Organizer Confirmation', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'organizer_confirmation' ),
				),
				'default'  => true,
			),
			'organizer_cancellation' => array(
				'label'    => __( 'Organizer Cancellation', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'organizer_cancellation' ),
				),
				'default'  => true,
			),
			'attendee_cancellation'  => array(
				'label'    => __( 'Attendee Cancellation', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'attendee_cancellation' ),
				),
				'default'  => true,
			),
			'organizer_reschedule'   => array(
				'label'    => __( 'Organizer Reschedule', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'organizer_reschedule' ),
				),
				'default'  => true,
			),
			'attendee_reschedule'    => array(
				'label'    => __( 'Attendee Reschedule', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'attendee_reschedule' ),
				),
				'default'  => true,
			),
			'organizer_reminder'     => array(
				'label'    => __( 'Organizer Reminder', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'organizer_reminder' ),
				),
				'default'  => true,
			),
			'attendee_reminder'      => array(
				'label'    => __( 'Attendee Reminder', 'quillbooking' ),
				'template' => array(
					'type'    => 'sms',
					'message' => $this->get_sms_notification_template( 'attendee_reminder' ),
				),
				'default'  => true,
			),
		);
	}

	/**
	 * Get sms notification template.
	 *
	 * @since 1.0.0
	 *
	 * @param string $template
	 *
	 * @return string
	 */
	public function get_sms_notification_template( $template ) {
		$attendee_confirmation = 'Dear {{guest:name}}, Your booking for the event "{{booking:event_name}}" scheduled from {{booking:start_time format="F j, Y g:i A" timezone="attendee"}} to {{booking:end_time format="F j, Y g:i A" timezone="attendee"}} ({{booking:timezone}}) has been successfully created.';

		$host_confirmation = 'Dear {{host:name}}, A new booking has been successfully created for the event "{{booking:event_name}}" scheduled from {{booking:start_time format="F j, Y g:i A" timezone="host"}} to {{booking:end_time format="F j, Y g:i A" timezone="host"}} ({{host:timezone}}). If you need further details, please check the booking in your dashboard. Thank you.';

		$organizer_sms_cancellation = 'Dear {{host:name}}, The attendee {{guest:name}} has canceled their booking for the event "{{booking:event_name}}" scheduled for {{booking:start_time format="F j, Y g:i A" timezone="host"}}. If you need further details, please check the booking in your dashboard. Thank you.';

		$attendee_sms_cancellation = 'Dear {{guest:name}}, Your booking for the event "{{booking:event_name}}" scheduled for {{booking:start_time format="F j, Y g:i A" timezone="attendee"}} has been canceled. If you have any questions, please contact the organizer.';

		$organizer_sms_reschedule = 'Dear {{host:name}}, The attendee {{guest:name}} has rescheduled their booking for the event "{{booking:event_name}}" scheduled for {{booking:start_time format="F j, Y g:i A" timezone="host"}}. If you need further details, please check the booking in your dashboard. Thank you.';

		$attendee_sms_reschedule = 'Dear {{guest:name}}, Your booking for the event "{{booking:event_name}}" scheduled for {{booking:start_time format="F j, Y g:i A" timezone="attendee"}} has been rescheduled. If you have any questions, please contact the organizer.';

		$organizer_sms_reminder = 'Dear {{host:name}}, Just a reminder that you have a booking for the event "{{booking:event_name}}" scheduled for {{booking:start_time format="F j, Y g:i A" timezone="host"}}.';

		$attendee_sms_reminder = 'Dear {{guest:name}}, Just a reminder that you have a booking for the event "{{booking:event_name}}" scheduled for {{booking:start_time format="F j, Y g:i A" timezone="attendee"}}.';

		$templates = array(
			'attendee_confirmation'  => $attendee_confirmation,
			'organizer_confirmation' => $host_confirmation,
			'organizer_cancellation' => $organizer_sms_cancellation,
			'attendee_cancellation'  => $attendee_sms_cancellation,
			'organizer_reschedule'   => $organizer_sms_reschedule,
			'attendee_reschedule'    => $attendee_sms_reschedule,
			'organizer_reminder'     => $organizer_sms_reminder,
			'attendee_reminder'      => $attendee_sms_reminder,
		);

		return Arr::get( $templates, $template, '' );
	}

	/**
	 * Get default booking advanced settings values
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_advanced_settings() {
		return array(
			'submit_button_text'           => __( 'Submit Booking', 'quillbooking' ),
			'redirect_after_submit'        => false,
			'redirect_url'                 => '',
			'require_confirmation'         => false,
			'confirmation_time'            => 'always',
			'confirmation_time_value'      => 24,
			'confirmation_time_unit'       => 'hours',
			'allow_multiple_bookings'      => false,
			'maximum_bookings'             => 1,
			'attendee_cannot_cancel'       => false,
			'cannot_canel_time'            => 'event_start',
			'cannot_cancel_time_value'     => 24,
			'cannot_cancel_time_unit'      => 'hours',
			'permission_denied_message'    => __( 'You do not have permission to view this page.', 'quillbooking' ),
			'attendee_cannot_reschedule'   => false,
			'cannot_reschedule_time'       => 'event_start',
			'cannot_reschedule_time_value' => 24,
			'cannot_reschedule_time_unit'  => 'hours',
			'reschedule_denied_message'    => __( 'You do not have permission to view this page.', 'quillbooking' ),
			'event_slug'                   => '',
		);
	}



	/**
	 * Get default payment settings values
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_payments_settings() {
		return array(
			'enable_payment'                 => false,
			'type'                           => 'native',
			'enable_items_based_on_duration' => false,
			'woo_product'                    => '',
			'enable_paypal'                  => false,
			'enable_stripe'                  => false,
			'items'                          => array(
				array(
					'item'  => 'Booking',
					'price' => 100,
				),
			),
			'multi_duration_items'           => array(),
			'currency'                       => 'USD',
		);
	}

	/**
	 * Get time slot options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_time_slot_options() {
		$minutes = range( 5, 120, 5 );
		$options = array();

		foreach ( $minutes as $minute ) {
			$options[ $minute ] = sprintf( _n( '%d minute', '%d minutes', $minute, 'quillbooking' ), $minute );
		}

		return $options;
	}
}
