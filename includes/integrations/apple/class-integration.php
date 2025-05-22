<?php

/**
 * Apple Calendar / Meet Integration
 *
 * This class is responsible for handling the Apple Calendar / Meet Integration
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Apple;

use Illuminate\Support\Arr;
use QuillBooking\Integration\Integration as Abstract_Integration;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Integrations\Apple\REST_API\REST_API;
use QuillBooking\Utils;

/**
 * Apple Integration class
 */
class Integration extends Abstract_Integration {





	/**
	 * Integration Name
	 *
	 * @var string
	 */
	public $name = 'Apple';

	/**
	 * Integration Slug
	 *
	 * @var string
	 */
	public $slug = 'apple';

	/**
	 * Integration Description
	 *
	 * @var string
	 */
	public $description = 'Sync your events across Apple devices with iCloud. Never miss an event, whether on Mac, iPhone, or iPad.';

	/**
	 * Client
	 *
	 * @var Client
	 */
	public $client;

	/**
	 * Auth type
	 *
	 * @var string
	 */
	public $auth_type = 'basic';

	/**
	 * Classes
	 *
	 * @var array
	 */
	protected static $classes = array(
		'rest_api'    => REST_API::class,
		'remote_data' => Remote_Data::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		 parent::__construct();
		add_filter( 'quillbooking_get_available_slots', array( $this, 'get_available_slots' ), 10, 5 );
		add_action( 'quillbooking_booking_created', array( $this, 'add_event_to_calendars' ) );
		add_action( 'quillbooking_booking_confirmed', array( $this, 'add_event_to_calendars' ) );
		add_action( 'quillbooking_booking_cancelled', array( $this, 'remove_event_from_calendars' ) );
		add_action( 'quillbooking_booking_rescheduled', array( $this, 'reschedule_event' ) );
	}

	/**
	 * Reschedule event in calendars
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return Booking_Model
	 */
	public function reschedule_event( $booking ) {
		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$apple_events = $booking->get_meta( 'apple_events_details', array() );
		if ( empty( $apple_events ) ) {
			return;
		}

		foreach ( $apple_events as $id => $apple_event ) {
			$event = Arr::get( $apple_event, 'event', array() );
			if ( empty( $event ) ) {
				return;
			}

			$calendar_id = Arr::get( $apple_event, 'calendar_id', '' );
			$account_id  = Arr::get( $apple_event, 'account_id', '' );

			$start_date = new \DateTime( $booking->start_time );
			$end_date   = new \DateTime( $booking->end_time );

			$event_data            = $event;
			$event_data['DTSTART'] = $start_date;
			$event_data['DTEND']   = $end_date;

			$api = $this->connect( $host, $account_id );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Apple Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				return;
			}

			$response = $api->update_event( $account_id, $calendar_id, $event_data );
			if ( ! $response['success'] ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Failed to reschedule event in Apple Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Failed to reschedule event %1$s in Apple Calendar %2$s.', 'quillbooking' ),
							$event['UID'],
							$calendar_id
						),
					)
				);
				continue;
			}

			// Update meta.
			$meta                  = $booking->get_meta( 'apple_events_details', array() );
			$meta[ $event['UID'] ] = array(
				'event'       => $event_data,
				'calendar_id' => $calendar_id,
				'account_id'  => $account_id,
			);

			$booking->update_meta(
				'apple_events_details',
				$meta
			);

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Event rescheduled in Apple Calendar.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Event %1$s rescheduled in Apple Calendar %2$s.', 'quillbooking' ),
						$event['UID'],
						$calendar_id
					),
				)
			);
		}
	}

	/**
	 * Remove event from calendars
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return Booking_Model
	 */
	public function remove_event_from_calendars( $booking ) {
		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$apple_events = $booking->get_meta( 'apple_events_details', array() );
		if ( empty( $apple_events ) ) {
			return;
		}

		foreach ( $apple_events as $apple_event ) {
			$event = Arr::get( $apple_event, 'event', array() );
			if ( empty( $event ) ) {
				return;
			}

			$calendar_id = Arr::get( $apple_event, 'calendar_id', '' );
			$account_id  = Arr::get( $apple_event, 'account_id', '' );

			$api = $this->connect( $host, $account_id );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Apple Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				return;
			}

			$response = $api->delete_event( $account_id, $calendar_id, $event['UID'] );
			if ( ! $response['success'] ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Failed to remove event from Apple Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Failed to remove event %1$s from Apple Calendar %2$s.', 'quillbooking' ),
							$event['UID'],
							$calendar_id
						),
					)
				);
				continue;
			}

			// Update meta.
			$meta = $booking->get_meta( 'apple_events_details', array() );
			Arr::forget( $meta, $event['UID'] );

			$booking->update_meta(
				'apple_events_details',
				$meta
			);

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Event removed from Apple Calendar.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Event %1$s removed from Apple Calendar %2$s.', 'quillbooking' ),
						$event['UID'],
						$calendar_id
					),
				)
			);
		}
	}

	/**
	 * Add event to calendars
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return Booking_Model
	 */
	public function add_event_to_calendars( $booking ) {
		error_log( 'Event Location: ' . $booking->location );
		if ( ! in_array( $booking->location, array( 'apple', 'apple_meet' ) ) ) {
			return $booking;
		}
		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$apple_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $apple_integration ) ) {
			return $booking;
		}

		$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		$end_date   = new \DateTime( $booking->end_time, new \DateTimeZone( 'UTC' ) );

		foreach ( $apple_integration as $account_id => $data ) {
			$api = $this->connect( $host, $account_id );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Apple Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				continue;
			}

			$calendars = Arr::get( $data, 'config.calendars', '' );
			if ( empty( $calendars ) ) {
				continue;
			}
			$account = $this->accounts->get_account( $account_id );
			$email   = Arr::get( $account, 'credentials.apple_id', '' );

			$event_data = array(
				'DESCRIPTION'    => $this->get_event_description( $booking ),
				'DTSTART'        => $start_date,
				'DTEND'          => $end_date,
				'LOCATION'       => $booking->location,
				'SUMMARY'        => sprintf( __( '%1$s: %2$s', 'quillbooking' ), $booking->guest->name, $event->name ),
				'ORGANIZER'      => "mailto:{$email}",
				'ORGANIZER_NAME' => $event->calendar->name,
				'ATTENDEES'      => array(
					array(
						'CN'   => $booking->guest->name,
						'MAIL' => $booking->guest->email,
					),
				),
			);

			foreach ( $calendars as $calendar_id ) {
				$event_data['UID'] = md5( $booking->hash_id . '-' . $calendar_id ) . '-' . wp_generate_uuid4();
				$response          = $api->create_event( $account_id, $calendar_id, $event_data );
				if ( ! $response['success'] ) {
					$booking->logs()->create(
						array(
							'type'    => 'error',
							'message' => __( 'Failed to add event to Apple Calendar.', 'quillbooking' ),
							'details' => sprintf(
								__( 'Failed to add event %1$s to Apple Calendar %2$s.', 'quillbooking' ),
								$event_data['UID'],
								$calendar_id
							),
						)
					);
					continue;
				}

				$event                 = Arr::get( $response, 'data' );
				$meta                  = $booking->get_meta( 'apple_events_details', array() );
				$meta[ $event['UID'] ] = array(
					'event'       => $event,
					'calendar_id' => $calendar_id,
					'account_id'  => $account_id,
				);
				$booking->update_meta(
					'apple_events_details',
					$meta
				);

				$booking->logs()->create(
					array(
						'type'    => 'info',
						'message' => __( 'Event added to Apple Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Event %1$s added to Apple Calendar %2$s.', 'quillbooking' ),
							$event['UID'],
							$calendar_id
						),
					)
				);
			}
		}
	}

	/**
	 * Get event description
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return string
	 */
	public function get_event_description( $booking ) {
		$description  = sprintf(
			__( 'Event Detials:', 'quillbooking' ),
			$booking->event->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee: %s', 'quillbooking' ),
			$booking->guest->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee Email: %s', 'quillbooking' ),
			$booking->guest->email
		);
		$description .= PHP_EOL . PHP_EOL;
		$start_date   = new \DateTime( $booking->start_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$end_date     = new \DateTime( $booking->end_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$description .= sprintf(
			__( 'When:%4$s%1$s to %2$s (%3$s)', 'quillbooking' ),
			$start_date->format( 'Y-m-d H:i' ),
			$end_date->format( 'Y-m-d H:i' ),
			$booking->calendar->timezone,
			PHP_EOL
		);

		return $description;
		$description  = sprintf(
			__( 'Event Detials:', 'quillbooking' ),
			$booking->event->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee: %s', 'quillbooking' ),
			$booking->guest->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee Email: %s', 'quillbooking' ),
			$booking->guest->email
		);
		$description .= PHP_EOL . PHP_EOL;
		$start_date   = new \DateTime( $booking->start_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$end_date     = new \DateTime( $booking->end_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$description .= sprintf(
			__( 'When:%4$s%1$s to %2$s (%3$s)', 'quillbooking' ),
			$start_date->format( 'Y-m-d H:i' ),
			$end_date->format( 'Y-m-d H:i' ),
			$booking->calendar->timezone,
			PHP_EOL
		);

		return $description;
	}

	/**
	 * Get available slots
	 *
	 * @since 1.0.0
	 *
	 * @param array       $slots Available slots.
	 * @param Event_Model $event Event model.
	 * @param int         $start_date Start date timestamp.
	 * @param int         $end_date End date timestamp.
	 * @param string      $timezone Timezone.
	 *
	 * @return array
	 */
	public function get_available_slots( $slots, $event, $start_date, $end_date, $timezone ) {
		$this->set_host( $event->calendar );
		$apple_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $apple_integration ) ) {
			return $slots;
		}

		foreach ( $apple_integration as $account_id => $data ) {
			$callback    = function () use ( $event, $account_id, $start_date, $end_date, $timezone ) {
				return $this->get_account_data( $event->calendar->id, $account_id, $start_date, $end_date, $timezone );
			};
			$settings    = $this->get_settings();
			$cache_time  = Arr::get( $settings, 'app.cache_time', null );
			$key         = "slots_{$start_date}_{$end_date}";
			$cached_data = $this->accounts->get_cache_data( $account_id, $key, $callback, $cache_time );
			if ( empty( $cached_data ) ) {
				continue;
			}

			foreach ( $cached_data as $calendar_id => $events ) {
				foreach ( $events as $event ) {
					$start          = Arr::get( $event, 'DTSTART' );
					$end            = Arr::get( $event, 'DTEND' );
					$event_timezone = Arr::get( $event, 'TZID' );
					$slots          = $this->remove_booked_slot( $slots, $start, $end, $timezone, $event_timezone );
				}
			}
		}

		return $slots;
	}

	/**
	 * Get account data
	 *
	 * @since 1.0.0
	 *
	 * @param int    $host_id Host ID.
	 * @param int    $account_id Account ID.
	 * @param int    $start_date Start date.
	 * @param int    $end_date End date.
	 * @param string $timezone Timezone.
	 *
	 * @return array
	 */
	public function get_account_data( $host_id, $account_id, $start_date, $end_date, $timezone ) {
		$apple_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $apple_integration ) ) {
			return array();
		}

		$account_data = Arr::get( $apple_integration, $account_id, array() );
		$calendars    = Arr::get( $account_data, 'config.calendars', array() );
		if ( empty( $calendars ) ) {
			return array();
		}

		$api = $this->connect( $host_id, $account_id );
		if ( ! $api ) {
			return array();
		}

		$start_date = Utils::create_date_time( $start_date, $timezone );
		$end_date   = Utils::create_date_time( $end_date, $timezone );

		$start_date = $start_date->format( 'Ymd\THis\Z' );
		$end_date   = $end_date->format( 'Ymd\THis\Z' );

		/** @var Client $client */
		$client = $this->client;

		$calendars_data = array();
		foreach ( $calendars as $calendar_id ) {
			$events = $client->get_events( $account_id, $calendar_id, $start_date, $end_date );

			$calendars_data[ $calendar_id ] = $events;
		}

		return $calendars_data;
	}

	/**
	 * Remove booked slots from the given array of slots based on a Apple Calendar event's time range.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $slots Multi-day slots.
	 * @param string $event_start Start date-time of the event in ISO 8601 format (UTC timezone).
	 * @param string $event_end End date-time of the event in ISO 8601 format (UTC timezone).
	 * @param string $timezone Timezone.
	 * @param string $event_timezone Event timezone.
	 *
	 * @return array Updated slots array.
	 */
	public function remove_booked_slot( $slots, $event_start, $event_end, $timezone, $event_timezone ) {
		$event_start = Utils::create_date_time( $event_start, $event_timezone );
		$event_end   = Utils::create_date_time( $event_end, $event_timezone );

		$event_start_timestamp = $event_start->getTimestamp();
		$event_end_timestamp   = $event_end->getTimestamp();
		// Iterate through each day's slots.
		foreach ( $slots as $date => &$daily_slots ) {
			$daily_slots = array_values(
				Arr::where(
					$daily_slots,
					function ( $slot ) use ( $event_start_timestamp, $event_end_timestamp, $timezone ) {
						$slot_start           = Utils::create_date_time( $slot['start'], $timezone );
						$slot_end             = Utils::create_date_time( $slot['end'], $timezone );
						$slot_start_timestamp = $slot_start->getTimestamp();
						$slot_end_timestamp   = $slot_end->getTimestamp();

						// Keep the slot only if it does not overlap with the event's time range.
						return $slot_end_timestamp <= $event_start_timestamp || $slot_start_timestamp >= $event_end_timestamp;
					}
				)
			);

			// If no slots remain for a date, forget the entire date key.
			if ( empty( $daily_slots ) ) {
				Arr::forget( $slots, $date );
			}
		}

		return $slots;
	}

	/**
	 * Connect the integration
	 *
	 * @since 1.0.0
	 *
	 * @param int $host_id Host ID.
	 * @param int $account_id Account ID.
	 *
	 * @return bool|API
	 */
	public function connect( $host_id, $account_id ) {
		parent::connect( $host_id, $account_id );
		$account      = $this->accounts->get_account( $account_id );
		$apple_id     = Arr::get( $account, 'credentials.apple_id', '' );
		$app_password = Arr::get( $account, 'credentials.app_password', '' );

		if ( empty( $apple_id ) || empty( $app_password ) ) {
			return new \WP_Error( 'missing_credentials', __( 'Apple ID and App-specific password are required.', 'quillbooking' ) );
		}

		$this->client = new Client( $apple_id, $app_password );

		return $this->client;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'apple_id'     => array(
				'label'       => __( 'Apple ID', 'quillbooking' ),
				'type'        => 'text',
				'required'    => true,
				'placeholder' => __( 'Enter your Apple ID', 'quillbooking' ),
				'description' => __( 'Your Apple ID is the email address you use to sign in to iCloud.', 'quillbooking' ),
			),
			'app_password' => array(
				'label'       => __( 'App-specific Password', 'quillbooking' ),
				'type'        => 'password',
				'required'    => true,
				'placeholder' => __( 'Enter your App-specific Password', 'quillbooking' ),
				'description' => __( 'An app-specific password is a single-use password for your Apple ID that lets you sign in to your account securely when you use third-party apps.', 'quillbooking' ),
			),
		);
	}
}
