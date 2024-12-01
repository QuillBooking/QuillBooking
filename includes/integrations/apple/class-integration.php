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
	public $description = 'Apple Calendar';

	/**
	 * Client
	 *
	 * @var Client
	 */
	public $client;

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
		add_filter( 'quillbooking_booking_created', array( $this, 'add_event_to_calendars' ) );
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

		$apple_event = $booking->get_meta( 'apple_event_details', array() );
		if ( empty( $apple_event ) ) {
			return;
		}

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
			return;
		}

		$response = $this->client->update_event( $account_id, $calendar_id, $event_data );
		if ( ! $response['success'] ) {
			return;
		}

		$event = Arr::get( $response, 'data' );
		$booking->update_meta(
			'apple_event_details',
			array(
				'event'       => $event,
				'calendar_id' => $calendar_id,
				'account_id'  => $account_id,
			)
		);
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

		$apple_event = $booking->get_meta( 'apple_event_details', array() );
		if ( empty( $apple_event ) ) {
			return;
		}

		$event = Arr::get( $apple_event, 'event', array() );
		if ( empty( $event ) ) {
			return;
		}

		$calendar_id = Arr::get( $apple_event, 'calendar_id', '' );
		$account_id  = Arr::get( $apple_event, 'account_id', '' );

		$api = $this->connect( $host, $account_id );
		if ( ! $api ) {
			return;
		}

		$response = $this->client->delete_event( $account_id, $calendar_id, $event['UID'] );
		error_log( 'Apple Integration Delete: ' . wp_json_encode( $response ) );
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
				'ATTENDEE'       => "mailto:{$booking->guest->email}",
				'ATTENDEE_NAME'  => $booking->guest->name,
				'UID'            => md5( $booking->hash_id ) . '-' . wp_generate_uuid4(),
			);

			foreach ( $calendars as $calendar_id ) {
				$response = $this->client->create_event( $account_id, $calendar_id, $event_data );
				if ( ! $response['success'] ) {
					continue;
				}

				$event = Arr::get( $response, 'data' );
				$booking->update_meta(
					'apple_event_details',
					array(
						'event'       => $event,
						'calendar_id' => $calendar_id,
						'account_id'  => $account_id,
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

		return $description;$description = sprintf(
			__( 'Event Detials:', 'quillbooking' ),
			$booking->event->name
		);
		$description                    .= PHP_EOL;
		$description                    .= sprintf(
			__( 'Invitee: %s', 'quillbooking' ),
			$booking->guest->name
		);
		$description                    .= PHP_EOL;
		$description                    .= sprintf(
			__( 'Invitee Email: %s', 'quillbooking' ),
			$booking->guest->email
		);
		$description                    .= PHP_EOL . PHP_EOL;
		$start_date                      = new \DateTime( $booking->start_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$end_date                        = new \DateTime( $booking->end_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$description                    .= sprintf(
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
			$callback = function () use ( $event, $account_id, $start_date, $end_date, $timezone ) {
				return $this->get_account_data( $event->calendar->id, $account_id, $start_date, $end_date, $timezone );
			};

			$key         = "slots_{$start_date}_{$end_date}";
			$cached_data = $this->accounts->get_cache_data( $account_id, $key, $callback );
			if ( empty( $cached_data ) ) {
				continue;
			}

			foreach ( $cached_data as $calendar_id => $events ) {
				foreach ( $events as $event ) {
					$start = Arr::get( $event, 'start.dateTime' );
					$end   = Arr::get( $event, 'end.dateTime' );

					$slots = $this->remove_booked_slot( $slots, $start, $end, $timezone );
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

		$free_busy_args = array(
			'timeMin'  => $start_date->format( 'Y-m-d\TH:i:s\Z' ),
			'timeMax'  => $end_date->format( 'Y-m-d\TH:i:s\Z' ),
			'timeZone' => 'UTC',
		);

		$free_busy_response = $api->get_free_busy( $calendars, $free_busy_args );
		if ( ! $free_busy_response['success'] ) {
			return array();
		}

		$calendars_data = array();
		foreach ( Arr::get( $free_busy_response, 'data.calendars', array() ) as $calendar_id => $calendar_data ) {
			if ( Arr::has( $calendar_data, 'errors' ) ) {
				$calendar_events = $api->get_events( $calendar_id, $free_busy_args );
				if ( ! $calendar_events['success'] ) {
					continue;
				}
				$calendars_data[ $calendar_id ] = Arr::get( $calendar_events, 'data.items', array() );
				continue;
			}

			$busy_slots = Arr::get( $calendar_data, 'busy', array() );
			foreach ( $busy_slots as $busy_slot ) {
				$calendars_data[ $calendar_id ] = $busy_slot;
			}
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
	 *
	 * @return array Updated slots array.
	 */
	public function remove_booked_slot( $slots, $event_start, $event_end, $timezone ) {
		$event_start_timestamp = ( new \DateTime( $event_start, new \DateTimeZone( 'UTC' ) ) )->getTimestamp();
		$event_end_timestamp   = ( new \DateTime( $event_end, new \DateTimeZone( 'UTC' ) ) )->getTimestamp();

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
}
