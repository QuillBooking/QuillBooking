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

namespace QuillBooking\Integrations\Twilio;

use QuillBooking\Managers\Merge_Tags_Manager;
use QuillBooking\Models\Booking_Model;
use QuillBooking\QuillBooking;
use Illuminate\Support\Arr;
use QuillBooking\Models\Event_Model;
use WP_Error;


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
	 * Integration
	 *
	 * @var Integration
	 */
	private $integration;

	/**
	 * Accounts manager
	 *
	 * @var object
	 */
	private $accounts;

	/**
	 * Host ID
	 *
	 * @var int
	 */
	private $host_id;

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
		$this->accounts           = $integration->accounts;
		$this->init();
	}

	/**
	 * Initialize
	 */
	public function init() {
		\add_action( 'quillbooking_booking_created', array( $this, 'send_booking_created_sms' ) );
		\add_action( 'quillbooking_booking_attendee_cancelled', array( $this, 'send_attendee_cancelled_sms' ) );
		\add_action( 'quillbooking_booking_organizer_cancelled', array( $this, 'send_organizer_cancelled_sms' ) );
		\add_action( 'quillbooking_booking_organizer_rescheduled', array( $this, 'send_organizer_rescheduled_sms' ) );
		\add_action( 'quillbooking_booking_attendee_rescheduled', array( $this, 'send_attendee_rescheduled_sms' ) );

		\add_action( 'init', array( $this, 'send_reminder_sms' ) );
	}

	/**
	 * Set host
	 *
	 * @since 1.0.0
	 * @param object $calendar Calendar object.
	 * @return bool|WP_Error Returns true on success, WP_Error on failure.
	 */
	private function set_host( $calendar ) {
		if ( ! $calendar || ! isset( $calendar->id ) ) {
			return new WP_Error(
				'invalid_calendar',
				__( 'Invalid calendar object provided', 'quillbooking' )
			);
		}

		$this->host_id = $calendar->id;
		return true;
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
	 * Check if Twilio is properly configured
	 *
	 * @since 1.0.0
	 * @return bool True if configured, false otherwise
	 */
	private function is_twilio_configured() {
		try {
			// Check if integration is properly set up
			if ( ! isset( $this->integration ) ) {
				return false;
			}

			// Check if host is set
			if ( ! isset( $this->integration->host ) ) {
				return false;
			}

			// Check if accounts manager is available
			if ( ! isset( $this->accounts ) ) {
				return false;
			}

			return true;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Send Booking Created SMS
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 */
	public function send_booking_created_sms( $booking ) {
		try {
			// First check if Twilio is configured
			if ( ! $this->is_twilio_configured() ) {
				return;
			}

			// Validate booking object
			if ( ! $booking || ! isset( $booking->event_id ) ) {
				return;
			}

			// Get event data
			$event = null;
			if ( isset( $booking->event ) ) {
				$event = $booking->event;
			} else {
				try {
					// Try to load the event if it's not already loaded
					$event = Event_Model::find( $booking->event_id );
					if ( $event ) {
						$event = $event->with( 'calendar' )->first();
					}
				} catch ( \Exception $e ) {
					return;
				}
			}

			// Validate event exists
			if ( ! $event ) {
				return;
			}

			// Validate calendar exists
			if ( ! isset( $event->calendar ) || ! $event->calendar ) {
				return;
			}

			// Set host
			$result = $this->set_host( $event->calendar );
			if ( \is_wp_error( $result ) ) {
				if ( method_exists( $booking, 'logs' ) && method_exists( $booking->logs(), 'create' ) ) {
					$booking->logs()->create(
						array(
							'type'    => 'error',
							'message' => \__( 'Error Setting Host', 'quillbooking' ),
							'details' => $result->get_error_message(),
						)
					);
				}
				return;
			}

			// Validate SMS notifications exist
			if ( ! isset( $event->sms_notifications ) ) {
				return;
			}
			$sms_notifications = $event->sms_notifications;

			// Send attendee confirmation
			$attendee_confirmation = Arr::get( $sms_notifications, 'attendee_confirmation.enabled', true );
			if ( $attendee_confirmation ) {
				$attendee_template = Arr::get( $sms_notifications, 'attendee_confirmation.template' );
				if ( $attendee_template && isset( $attendee_template['message'] ) ) {
					$all_phones = $this->get_all_phones( $booking );
					$this->send_message( $booking, $attendee_template, $all_phones );
				} else {
				}
			}

			// Send organizer confirmation
			$organizer_confirmation = Arr::get( $sms_notifications, 'organizer_confirmation.enabled', true );
			if ( $organizer_confirmation ) {
				$organizer_template = Arr::get( $sms_notifications, 'organizer_confirmation.template' );
				if ( $organizer_template && isset( $organizer_template['message'] ) ) {
					$this->send_message( $booking, $organizer_template );
				}
			}
		} catch ( \Exception $e ) {
			if ( method_exists( $booking, 'logs' ) && method_exists( $booking->logs(), 'create' ) ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => \__( 'Error Sending SMS', 'quillbooking' ),
						'details' => $e->getMessage(),
					)
				);
			}
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
		$sms_notifications = $event->sms_notifications;

		$attendee_cancellation = Arr::get( $sms_notifications, 'attendee_cancellation.enabled', true );
		if ( $attendee_cancellation ) {
			$attendee_template = Arr::get( $sms_notifications, 'attendee_cancellation.template' );
			$all_phones        = $this->get_all_phones( $booking );
			$this->send_message( $booking, $attendee_template, $all_phones );
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
		$sms_notifications = $event->sms_notifications;

		$organizer_cancellation = Arr::get( $sms_notifications, 'organizer_cancellation.enabled', true );
		if ( $organizer_cancellation ) {
			$organizer_template = Arr::get( $sms_notifications, 'organizer_cancellation.template' );
			$all_phones         = $this->get_organizer_phone_numbers_from_meta( $booking );
			$this->send_message( $booking, $organizer_template, $all_phones );
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
		$sms_notifications = $event->sms_notifications;

		$organizer_rescheduled = Arr::get( $sms_notifications, 'organizer_reschedule.enabled', true );
		if ( $organizer_rescheduled ) {
			$organizer_template = Arr::get( $sms_notifications, 'organizer_reschedule.template' );
			$all_phones         = $this->get_organizer_phone_numbers_from_meta( $booking );
			$this->send_message( $booking, $organizer_template, $all_phones );
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
		$sms_notifications = $event->sms_notifications;

		$attendee_rescheduled = Arr::get( $sms_notifications, 'attendee_reschedule.enabled', true );
		if ( $attendee_rescheduled ) {
			$attendee_template = Arr::get( $sms_notifications, 'attendee_reschedule.template' );
			$all_phones        = $this->get_all_phones( $booking );
			$this->send_message( $booking, $attendee_template, $all_phones );
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
		$sms_notifications = $event->sms_notifications;

		$reminder = Arr::get( $sms_notifications, 'organizer_reminder.enabled', true );
		if ( $reminder ) {
			$template   = Arr::get( $sms_notifications, 'organizer_reminder.template' );
			$all_phones = $this->get_organizer_phone_numbers_from_meta( $booking );
			$this->send_message( $booking, $template, $all_phones );
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
		$event  = $booking->event;
		$result = $this->set_host( $event->calendar );
		if ( \is_wp_error( $result ) ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => \__( 'Error Setting Host', 'quillbooking' ),
					'details' => $result->get_error_message(),
				)
			);
			return;
		}
		$sms_notifications = $event->sms_notifications;

		$reminder = Arr::get( $sms_notifications, 'attendee_reminder.enabled', true );
		if ( $reminder ) {
			$template   = Arr::get( $sms_notifications, 'attendee_reminder.template' );
			$all_phones = $this->get_all_phones( $booking );
			$this->send_message( $booking, $template, $all_phones );
		}
	}

	/**
	 * Get All Phones
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 * @return array Array of phone numbers
	 */
	private function get_all_phones( $booking ) {
		// Get additional phone numbers from meta fields
		$additional_phones = $this->get_attendee_phone_numbers_from_meta( $booking );

		// Include attendee phone if available
		$main_phone = $booking->attendee_phone ?? '';
		if ( ! empty( $main_phone ) ) {
			if ( is_numeric( $main_phone ) && strpos( $main_phone, '+' ) !== 0 ) {
				$main_phone = '+' . $main_phone;
			}
			$additional_phones[] = $main_phone;
		}

		// Remove duplicates
		$all_phones = array_unique( $additional_phones );

		return $all_phones;
	}

	/**
	 * Get Attendee Phone Numbers from Event Meta Fields
	 *
	 * Extracts phone numbers from event meta fields where type=phone and sms=true
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 * @return array Array of phone numbers
	 */
	private function get_attendee_phone_numbers_from_meta( $booking ) {
		$phone_numbers = array();

		try {
			if ( ! $booking || ! isset( $booking->event ) || ! $booking->event ) {
				return $phone_numbers;
			}

			$event = $booking->event;

			if ( ! method_exists( $event, 'get_meta' ) ) {
				return $phone_numbers;
			}

			$key_fields = $event->get_meta( 'fields' );
			if ( empty( $key_fields ) ) {
				return $phone_numbers;
			}

			if ( is_string( $key_fields ) && strpos( $key_fields, 'a:' ) === 0 ) {
				$key_fields = maybe_unserialize( $key_fields );
			}

			$phone_field_keys = array();

			foreach ( $key_fields as $group => $fields ) {
				if ( ! is_array( $fields ) ) {
					continue;
				}

				foreach ( $fields as $key => $field ) {
					if ( isset( $field['type'] ) && 'phone' === $field['type'] ) {
						$sms_enabled = false;
						if ( isset( $field['settings']['sms'] ) && true === $field['settings']['sms'] ) {
							$sms_enabled = true;
						} elseif ( isset( $field['sms'] ) && true === $field['sms'] ) {
							$sms_enabled = true;
						}

						if ( $sms_enabled ) {
							$phone_field_keys[] = $key;
						}
					}
				}
			}

			if ( empty( $phone_field_keys ) ) {
				return $phone_numbers;
			}

			if ( ! method_exists( $booking, 'get_meta' ) ) {
				return $phone_numbers;
			}

			$all_meta = $booking->get_meta( 'fields' );

			// Try to unserialize
			$all_meta = maybe_unserialize( $all_meta );

			// Try to decode JSON if it's still a string
			if ( is_string( $all_meta ) ) {
				$decoded = json_decode( stripslashes( $all_meta ), true );
				if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
					$all_meta = $decoded;
				} else {
					$all_meta = array();
				}
			}

			foreach ( $phone_field_keys as $key ) {
				if ( isset( $all_meta[ $key ] ) && ! empty( $all_meta[ $key ] ) ) {
					$value = $all_meta[ $key ];
					if ( is_numeric( $value ) && strpos( $value, '+' ) !== 0 ) {
						$value = '+' . $value;
					}
					$phone_numbers[] = $value;
				}
			}

			$phone_numbers = array_unique( $phone_numbers );
		} catch ( \Exception $e ) {
			\error_log( 'Exception extracting phone numbers: ' . $e->getMessage() );
		}

		return $phone_numbers;
	}

	/**
	 * Get Organizer Phone Numbers from Event Meta
	 *
	 * Extracts phone numbers from event meta fields where type=person_phone
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 * @return array Array of phone numbers
	 */
	private function get_organizer_phone_numbers_from_meta( $booking ) {
		$event         = $booking->event;
		$phone_numbers = array();

		if ( ! method_exists( $event, 'get_meta' ) ) {
			return $phone_numbers;
		}

		$key_fields = $event->get_meta( 'location' );

		if ( empty( $key_fields ) ) {
			return $phone_numbers;
		}

		// Try to unserialize if needed
		if ( is_string( $key_fields ) && strpos( $key_fields, 'a:' ) === 0 ) {
			$key_fields = maybe_unserialize( $key_fields );
		}

		// If not an array after unserialization, return empty
		if ( ! is_array( $key_fields ) ) {
			return $phone_numbers;
		}

		foreach ( $key_fields as $item ) {
			if ( ! is_array( $item ) || ! isset( $item['type'] ) || 'person_phone' !== $item['type'] ) {
				continue;
			}

			if (
				isset( $item['fields'] ) &&
				is_array( $item['fields'] ) &&
				isset( $item['fields']['phone'] ) &&
				! empty( $item['fields']['phone'] )
			) {
				$raw_phone = $item['fields']['phone'];

				// Add + if needed for international format
				if ( ! str_starts_with( $raw_phone, '+' ) ) {
					$raw_phone = '+' . $raw_phone;
				}

				$phone_numbers[] = $raw_phone;
			}
		}

		return $phone_numbers;
	}

	/**
	 * Send Attendee Confirmation Message
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param string        $template Template.
	 * @param array         $all_phones Optional array of phone numbers.
	 */
	public function send_message( $booking, $template, $all_phones = array() ) {
		try {
			// Validate booking and template
			if ( ! $template || ! $booking ) {
				return;
			}

			// Get message type and content
			$type    = Arr::get( $template, 'type', 'sms' );
			$message = Arr::get( $template, 'message' );

			if ( empty( $message ) ) {
				return;
			}

			// Log the phones we're sending to

			// Process merge tags if manager exists
			if ( isset( $this->merge_tags_manager ) && method_exists( $this->merge_tags_manager, 'process_merge_tags' ) ) {
				$message = $this->merge_tags_manager->process_merge_tags( $message, $booking );
			}

			// Send to each phone
			$success_count = 0;
			foreach ( $all_phones as $phone ) {
				if ( empty( $phone ) ) {
					continue;
				}

				if ( 'sms' === $type ) {
					$result = $this->send_sms( $phone, $message, $booking );
					if ( $result ) {
						$success_count++;
					}
				} else {
					$result = $this->send_whatsapp_message( $phone, $message, $booking );
					if ( $result ) {
						$success_count++;
					}
				}
			}

			if ( $success_count > 0 ) {
			} elseif ( ! empty( $all_phones ) ) {
			}
		} catch ( \Exception $e ) {
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
	 * @return bool Whether the send was successful
	 */
	public function send_sms( $to, $message, $booking ) {
		try {
			// First check if Twilio is properly configured
			if ( ! $this->is_twilio_configured() ) {
				return false;
			}

			// Validate input parameters
			if ( empty( $to ) || empty( $message ) || ! $booking ) {
				return false;
			}

			// Get settings and accounts
			$settings = $this->integration->get_settings();
			$accounts = array();

			// Try to get accounts if available
			if ( method_exists( $this->accounts, 'get_accounts' ) ) {
				$accounts = $this->accounts->get_accounts();
			}

			// If no accounts, use global settings
			if ( empty( $accounts ) ) {
				if ( empty( $settings ) || empty( $settings['credentials'] ) ) {
					return false;
				}

				// Create API instance with global settings
				$api = new API(
					$settings['credentials']['sms_number'],
					$settings['credentials']['whatsapp_number'],
					$settings['credentials']['account_sid'],
					$settings['credentials']['auth_token']
				);

				try {
					$result = $api->send_sms( $to, $message );
					return true;
				} catch ( \Exception $e ) {
					return false;
				}
			}

			// Validate booking calendar
			if ( ! isset( $booking->calendar ) || ! $booking->calendar || ! isset( $booking->calendar->id ) ) {
				return false;
			}

			// Process each account
			foreach ( $accounts as $account_id => $account ) {
				try {
					// Connect to Twilio
					if ( ! isset( $this->integration ) || ! method_exists( $this->integration, 'connect' ) ) {
						continue;
					}

					$api = $this->integration->connect( $this->host_id, $account_id );

					if ( \is_wp_error( $api ) ) {
						if ( method_exists( $booking, 'logs' ) && method_exists( $booking->logs(), 'create' ) ) {
							$booking->logs()->create(
								array(
									'type'    => 'error',
									'message' => \__( 'Error Connecting to Twilio', 'quillbooking' ),
									'details' => sprintf( 'Error connecting to host %s with twilio account %s', $booking->calendar->name, $account_id ),
								)
							);
						}
						continue;
					}

					// Send SMS
					if ( ! method_exists( $api, 'send_sms' ) ) {
						continue;
					}

					$result = $api->send_sms( $to, $message );
					return true; // Successfully sent with one account
				} catch ( \Exception $e ) {
				}
			}
			return false;
		} catch ( \Exception $e ) {
			\error_log( 'Exception in send_sms: ' . $e->getMessage() );
			return false;
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
	 * @return bool Whether the send was successful
	 */
	public function send_whatsapp_message( $to, $message, $booking ) {
		try {
			// First check if Twilio is properly configured
			if ( ! $this->is_twilio_configured() ) {
				return false;
			}

			// Validate input parameters
			if ( empty( $to ) || empty( $message ) || ! $booking ) {
				return false;
			}

			// Get settings and accounts
			$settings = $this->integration->get_settings();
			$accounts = array();

			// Try to get accounts if available
			if ( method_exists( $this->accounts, 'get_accounts' ) ) {
				$accounts = $this->accounts->get_accounts();
			}

			// If no accounts, use global settings
			if ( empty( $accounts ) ) {
				if ( empty( $settings ) || empty( $settings['credentials'] ) ) {
					return false;
				}

				// Create API instance with global settings
				$api = new API(
					$settings['credentials']['sms_number'],
					$settings['credentials']['whatsapp_number'],
					$settings['credentials']['account_sid'],
					$settings['credentials']['auth_token']
				);

				try {
					$result = $api->send_whatsapp_message( $to, $message );
					return true;
				} catch ( \Exception $e ) {
					return false;
				}
			}

			// Validate booking calendar
			if ( ! isset( $booking->calendar ) || ! $booking->calendar || ! isset( $booking->calendar->id ) ) {
				return false;
			}

			// Process each account
			foreach ( $accounts as $account_id => $account ) {
				try {
					// Connect to Twilio
					if ( ! isset( $this->integration ) || ! method_exists( $this->integration, 'connect' ) ) {
						continue;
					}

					$api = $this->integration->connect( $this->host_id, $account_id );

					if ( \is_wp_error( $api ) ) {
						if ( method_exists( $booking, 'logs' ) && method_exists( $booking->logs(), 'create' ) ) {
							$booking->logs()->create(
								array(
									'type'    => 'error',
									'message' => \__( 'Error Connecting to Twilio', 'quillbooking' ),
									'details' => sprintf( 'Error connecting to host %s with twilio account %s', $booking->calendar->name, $account_id ),
								)
							);
						}
						continue;
					}

					// Send WhatsApp message
					if ( ! method_exists( $api, 'send_whatsapp_message' ) ) {
						continue;
					}

					$result = $api->send_whatsapp_message( $to, $message );
					return true; // Successfully sent with one account
				} catch ( \Exception $e ) {
					\error_log( 'Exception sending WhatsApp to ' . $to . ': ' . $e->getMessage() );
				}
			}
			return false;
		} catch ( \Exception $e ) {
			\error_log( 'Exception in send_whatsapp_message: ' . $e->getMessage() );
			return false;
		}
	}
}
