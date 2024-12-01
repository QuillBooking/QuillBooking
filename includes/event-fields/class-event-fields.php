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

use QuillBooking\Utils;

/**
 * Event Fields class
 */
class Event_Fields {

	/**
	 * Instance
	 *
	 * @var Event_Fields
	 */
	private static $instance;

	/**
	 * Get instance
	 *
	 * @return Event_Fields
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

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
	 * Get additional settings
	 *
	 * @since 1.0.0
	 *
	 * @param string $event_type Event type
	 *
	 * @return array
	 */
	public function get_additional_settings( $event_type ) {
		$settings = array(
			'duration' => array(
				'allow_attendees_to_select_duration' => array(
					'label'   => __( 'Allow attendees to select duration', 'quillbooking' ),
					'type'    => 'checkbox',
					'default' => false,
				),
				'duration'                           => array(
					'label'      => __( 'Duration Options', 'quillbooking' ),
					'type'       => 'select',
					'options'    => $this->get_duration_options(),
					'conditions' => array(
						array(
							'field'    => 'duration.allow_attendees_to_select_duration',
							'operator' => '==',
							'value'    => true,
						),
					),
				),
			),
		);

		switch ( $event_type ) {
			case 'one-to-one':
			case 'round-robin':
			case 'collective':
				$settings['invitee'] = array(
					'allow_additional_guests' => array(
						'label'   => __( 'Allow additional guests', 'quillbooking' ),
						'type'    => 'checkbox',
						'default' => false,
					),
				);
				break;
			case 'group':
				$settings['invitee'] = array(
					'max_invites'    => array(
						'label'   => __( 'Maximum Invites', 'quillbooking' ),
						'type'    => 'number',
						'default' => 4,
					),
					'show_remaining' => array(
						'label'   => __( 'Show remaining invites', 'quillbooking' ),
						'type'    => 'checkbox',
						'default' => false,
					),
				);
				break;
		}

		return $settings;
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
		$settings = $this->get_additional_settings( $event_type );
		$values   = array();

		foreach ( $settings as $section => $fields ) {
			foreach ( $fields as $field => $data ) {
				$values[ $section ][ $field ] = $data['default'] ?? null;
			}
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
	 * Get limit settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_limit_settings() {
		return array(
			'general'       => array(
				'buffer_before'       => array(
					'label'   => __( 'Buffer Before', 'quillbooking' ),
					'type'    => 'number',
					'default' => 0,
				),
				'buffer_after'        => array(
					'label'   => __( 'Buffer After', 'quillbooking' ),
					'type'    => 'number',
					'default' => 0,
				),
				'minimum_notices'     => array(
					'label'   => __( 'Minimum Notice', 'quillbooking' ),
					'type'    => 'number',
					'default' => 4,
				),
				'minimum_notice_unit' => array(
					'label'   => __( 'Minimum Notice Unit', 'quillbooking' ),
					'type'    => 'select',
					'options' => array(
						'minutes' => __( 'Minutes', 'quillbooking' ),
						'hours'   => __( 'Hours', 'quillbooking' ),
						'days'    => __( 'Days', 'quillbooking' ),
					),
					'default' => 'hours',
				),
				'time_slot'           => array(
					'label'   => __( 'Time Slot', 'quillbooking' ),
					'type'    => 'select',
					'default' => 0,
					'options' => $this->get_time_slot_options(),
				),
			),
			'frequency'     => array(
				'enable' => array(
					'label'   => __( 'Limit booking frequency', 'quillbooking' ),
					'desc'    => __( 'Limit how often a user can book this event', 'quillbooking' ),
					'type'    => 'checkbox',
					'default' => false,
				),
				'limits' => array(
					'label'      => __( 'Frequency Limits', 'quillbooking' ),
					'type'       => 'repeater',
					'default'    => array(
						array(
							'limit' => 1,
							'unit'  => 'days',
						),
					),
					'fields'     => array(
						'limit' => array(
							'label' => __( 'Limit (Booking)', 'quillbooking' ),
							'type'  => 'number',
						),
						'unit'  => array(
							'label'   => __( 'Unit', 'quillbooking' ),
							'type'    => 'select',
							'options' => array(
								'minutes' => __( 'Minutes', 'quillbooking' ),
								'hours'   => __( 'Hours', 'quillbooking' ),
								'days'    => __( 'Days', 'quillbooking' ),
								'weeks'   => __( 'Weeks', 'quillbooking' ),
								'months'  => __( 'Months', 'quillbooking' ),
							),
							'default' => 'days',
						),
					),
					'conditions' => array(
						array(
							'field'    => 'frequency.enable',
							'operator' => '==',
							'value'    => true,
						),
					),
				),
			),
			'duration'      => array(
				'enable' => array(
					'label'   => __( 'Limit booking duration', 'quillbooking' ),
					'desc'    => __( 'Limit how long a user can book this event', 'quillbooking' ),
					'type'    => 'checkbox',
					'default' => false,
				),
				'limits' => array(
					'label'      => __( 'Duration Limits', 'quillbooking' ),
					'type'       => 'repeater',
					'default'    => array(
						array(
							'limit' => 120,
							'unit'  => 'hours',
						),
					),
					'fields'     => array(
						'limit' => array(
							'label' => __( 'Limit (Minutes)', 'quillbooking' ),
							'type'  => 'number',
						),
						'unit'  => array(
							'label'   => __( 'Unit', 'quillbooking' ),
							'type'    => 'select',
							'options' => array(
								'minutes' => __( 'Minutes', 'quillbooking' ),
								'hours'   => __( 'Hours', 'quillbooking' ),
								'days'    => __( 'Days', 'quillbooking' ),
								'weeks'   => __( 'Weeks', 'quillbooking' ),
								'months'  => __( 'Months', 'quillbooking' ),
							),
							'default' => 'hours',
						),
					),
					'conditions' => array(
						array(
							'field'    => 'duration.enable',
							'operator' => '==',
							'value'    => true,
						),
					),
				),
			),
			'timezone_lock' => array(
				'enable'   => array(
					'label'   => __( 'Lock timezone on booking page', 'quillbooking' ),
					'type'    => 'checkbox',
					'default' => false,
				),
				'timezone' => array(
					'label'      => __( 'Timezone', 'quillbooking' ),
					'type'       => 'select',
					'options'    => Utils::get_timezones(),
					'default'    => wp_timezone_string(),
					'conditions' => array(
						array(
							'field'    => 'timezone.enable',
							'operator' => '==',
							'value'    => true,
						),
					),
				),
			),
		);
	}

	/**
	 * Get default limit settings values
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_limit_settings() {
		$settings = $this->get_limit_settings();
		$values   = array();

		foreach ( $settings as $section => $fields ) {
			foreach ( $fields as $field => $data ) {
				$values[ $section ][ $field ] = $data['default'] ?? null;
			}
		}

		return $values;
	}

	/**
	 * Get email notification settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_email_notification_settings() {
		return array(
			'attendee_confirmation'          => array(
				'label'    => __( 'Attendee Confirmation', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Confirmation', 'quillbooking' ),
					'message' => __( 'Thank you for booking with us. Your booking is confirmed.', 'quillbooking' ),
				),
			),
			'organizer_notification'         => array(
				'label'    => __( 'Organizer Notification', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => true,
				'template' => array(
					'subject' => __( 'New Booking', 'quillbooking' ),
					'message' => __( 'A new booking has been made.', 'quillbooking' ),
				),
			),
			'attendee_reminder'              => array(
				'label'    => __( 'Attendee Reminder', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => false,
				'template' => array(
					'subject' => __( 'Booking Reminder', 'quillbooking' ),
					'message' => __( 'This is a reminder for your booking.', 'quillbooking' ),
					'times'   => array(
						array(
							'unit'  => 'hours',
							'value' => 24,
						),
					),
				),
			),
			'organizer_reminder'             => array(
				'label'    => __( 'Organizer Reminder', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => false,
				'template' => array(
					'subject' => __( 'Booking Reminder', 'quillbooking' ),
					'message' => __( 'This is a reminder for your booking.', 'quillbooking' ),
					'times'   => array(
						array(
							'unit'  => 'hours',
							'value' => 24,
						),
					),
				),
			),
			'attendee_cancelled_organizer'   => array(
				'label'    => __( 'Booking Cancelled by Attendee to Organizer', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Cancelled', 'quillbooking' ),
					'message' => __( 'Your booking has been cancelled.', 'quillbooking' ),
				),
			),
			'organizer_cancelled_attendee'   => array(
				'label'    => __( 'Booking Cancelled by Organizer to Attendee', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Cancelled', 'quillbooking' ),
					'message' => __( 'Your booking has been cancelled.', 'quillbooking' ),
				),
			),
			'attendee_rescheduled_orgnizer'  => array(
				'label'    => __( 'Booking Rescheduled by Attendee to Organizer', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Rescheduled', 'quillbooking' ),
					'message' => __( 'Your booking has been rescheduled.', 'quillbooking' ),
				),
			),
			'organizer_rescheduled_attendee' => array(
				'label'    => __( 'Booking Rescheduled by Organizer to Attendee', 'quillbooking' ),
				'type'     => 'checkbox',
				'default'  => true,
				'template' => array(
					'subject' => __( 'Booking Rescheduled', 'quillbooking' ),
					'message' => __( 'Your booking has been rescheduled.', 'quillbooking' ),
				),
			),
		);
	}

	/**
	 * Get default email notification settings values
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_default_email_notification_settings() {
		$settings = $this->get_email_notification_settings();
		$values   = array();

		foreach ( $settings as $field => $data ) {
			$values[ $field ] = array(
				'enabled'  => $data['default'],
				'template' => $data['template'],
			);
		}

		return $values;
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
