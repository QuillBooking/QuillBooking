<?php

/**
 * Outlook Calendar / Meet Integration
 *
 * This class is responsible for handling the Outlook Calendar / Meet Integration
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Outlook;

use Illuminate\Support\Arr;
use QuillBooking\Integration\Integration as Abstract_Integration;
use QuillBooking\Models\Event_Model;
use QuillBooking\Integrations\Outlook\REST_API\REST_API;
use QuillBooking\Utils;

/**
 * Outlook Integration class
 */
class Integration extends Abstract_Integration {






	/**
	 * Integration Name
	 *
	 * @var string
	 */
	public $name = 'Outlook';

	/**
	 * Integration Slug
	 *
	 * @var string
	 */
	public $slug = 'outlook';

	/**
	 * Integration Description
	 *
	 * @var string
	 */
	public $description = 'Manage appointments and sync across devices with Microsoft Calendar. Stay in control, wherever you are.';

	/**
	 * App
	 *
	 * @var App
	 */
	public $app;

	/**
	 * API
	 *
	 * @var API
	 */
	public $api;

	/**
	 * Classes
	 *
	 * @var array
	 */
	protected static $classes = array(
		'remote_data' => Remote_Data::class,
		'rest_api'    => REST_API::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		 parent::__construct();
		$this->app = new App( $this );
		add_filter( 'quillbooking_get_available_slots', array( $this, 'get_available_slots' ), 10, 5 );
		add_action( 'quillbooking_booking_created', array( $this, 'add_event_to_calendars' ) );
		add_action( 'quillbooking_booking_confirmed', array( $this, 'add_event_to_calendars' ) );
		add_action( 'quillbooking_booking_cancelled', array( $this, 'remove_event_from_calendars' ) );
		add_action( 'quillbooking_booking_rescheduled', array( $this, 'reschedule_event' ) );
	}

	/**
	 * Reschedule event
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

		$outlook_events = $booking->get_meta( 'outlook_events_details', array() );
		if ( empty( $outlook_events ) ) {
			return;
		}

		foreach ( $outlook_events as $event_id => $outlook_event ) {
			$account_id  = Arr::get( $outlook_event, 'account_id' );
			$calendar_id = Arr::get( $outlook_event, 'calendar_id' );

			$api = $this->connect( $host, $account_id );
			if ( ! $api || is_wp_error( $api ) ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Outlook Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with Outlook Account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				return;
			}

			$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
			$end_date   = new \DateTime( $booking->end_time, new \DateTimeZone( 'UTC' ) );

			$data = array(
				'start' => array(
					'dateTime' => $start_date->format( 'Y-m-d\TH:i:s' ),
					'timeZone' => 'UTC',
				),
				'end'   => array(
					'dateTime' => $end_date->format( 'Y-m-d\TH:i:s' ),
					'timeZone' => 'UTC',
				),
			);

			$response = $api->update_event( $calendar_id, $event_id, $data );
			if ( ! $response['success'] ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error rescheduling event in Outlook Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error rescheduling event in Outlook Calendar %1$s: %2$s', 'quillbooking' ),
							$calendar_id,
							Arr::get( $response, 'data.error.message', '' )
						),
					)
				);
				return;
			}

			$meta = $booking->get_meta( 'outlook_events_details', array() );
			Arr::set( $meta, "{$event_id}.event", $response['data'] );
			$booking->update_meta( 'outlook_events_details', $meta );

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Event rescheduled in Outlook Calendar.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Event %1$s rescheduled in Outlook Calendar %2$s.', 'quillbooking' ),
						$event_id,
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

		$outlook_events = $booking->get_meta( 'outlook_events_details', array() );
		if ( empty( $outlook_events ) ) {
			return;
		}

		foreach ( $outlook_events as $event_id => $outlook_event ) {
			$account_id = Arr::get( $outlook_event, 'account_id' );

			$api = $this->connect( $host, $account_id );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Outlook Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with Outlook Account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				return;
			}

			$response = $api->delete_event( $event_id );
			if ( ! $response['success'] ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error removing event from Outlook Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error removing event from Outlook Calendar %1$s: %2$s', 'quillbooking' ),
							$event_id,
							Arr::get( $response, 'data.error.message', '' )
						),
					)
				);
				return;
			}

			$meta = $booking->get_meta( 'outlook_events_details', array() );
			Arr::forget( $meta, $event_id );
			$booking->update_meta( 'outlook_events_details', $meta );

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Event removed from Outlook Calendar.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Event %1$s removed from Outlook Calendar.', 'quillbooking' ),
						$event_id
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
		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$outlook_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $outlook_integration ) ) {
			return $booking;
		}

		$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		$end_date   = new \DateTime( $booking->end_time, new \DateTimeZone( 'UTC' ) );

		foreach ( $outlook_integration as $account_id => $data ) {
			$api = $this->connect( $host, $account_id );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Outlook Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with Outlook Account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				continue;
			}

			$attendees = array(
				array(
					'emailAddress' => array(
						'address' => $booking->guest->email,
						'name'    => $booking->guest->name,
					),
					'type'         => 'required',
				),
			);

			$event_data = array(
				'subject'               => sprintf( __( '%1$s: %2$s', 'quillbooking' ), $booking->guest->name, $event->name ),
				'description'           => $event->description,
				'location'              => array(
					'displayName' => $booking->location ?? 'MS Meet',
				),
				'organizer'             => array(
					'emailAddress' => array(
						'address' => $event->calendar->user->user_email,
						'name'    => $event->calendar->user->display_name,
					),
				),
				'attendees'             => $attendees,
				'start'                 => array(
					'dateTime' => $start_date->format( 'Y-m-d\TH:i:s' ),
					'timeZone' => 'UTC',
				),
				'end'                   => array(
					'dateTime' => $end_date->format( 'Y-m-d\TH:i:s' ),
					'timeZone' => 'UTC',
				),
				'allowNewTimeProposals' => false,
				'body'                  => array(
					'contentType' => 'text',
					'content'     => $this->get_event_description( $booking ),
				),
				'transactionId'         => "{$this->get_site_uid()}-{$booking->id}",
			);

			if ( 'ms_meet' === $booking->location ) {
				$event_data['isOnlineMeeting']       = true;
				$event_data['onlineMeetingProvider'] = 'teamsForBusiness';
			}

			// Remove any empty values recursively.
			$event_data          = array_filter( $event_data );
			$default_calendar_id = Arr::get( $data, 'config.default_calendar' );

			if ( empty( $default_calendar_id ) ) {
				continue;
			}

			$response = $api->create_event( $default_calendar_id, $event_data );

			if ( ! $response['success'] ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error adding event to Outlook Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error adding event to Outlook Calendar %1$s: %2$s', 'quillbooking' ),
							$default_calendar_id,
							Arr::get( $response, 'data.error.message', '' )
						),
					)
				);
				continue;
			}

			$event = Arr::get( $response, 'data' );
			$id    = Arr::get( $event, 'id' );

			$meta        = $booking->get_meta( 'outlook_events_details', array() );
			$meta[ $id ] = array(
				'event'       => $event,
				'calendar_id' => $default_calendar_id,
				'account_id'  => $account_id,
			);

			$booking->update_meta( 'outlook_events_details', $meta );

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Event added to Outlook Calendar.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Event %1$s added to Outlook Calendar %2$s.', 'quillbooking' ),
						$id,
						$default_calendar_id
					),
				)
			);
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
	 * Get site UID
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_site_uid() {
		$site_uid = get_option( 'quillbooking_site_uid', '' );
		if ( empty( $site_uid ) ) {
			$site_uid = Utils::generate_hash_key();
			update_option( 'quillbooking_site_uid', $site_uid );
		}

		return $site_uid;
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
		$outlook_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $outlook_integration ) ) {
			return $slots;
		}

		foreach ( $outlook_integration as $account_id => $data ) {
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
		$outlook_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $outlook_integration ) ) {
			return array();
		}

		$account_data = Arr::get( $outlook_integration, $account_id, array() );
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

		$args = array(
			'startdatetime' => $start_date->format( 'Y-m-d\TH:i:s\Z' ),
			'enddatetime'   => $end_date->format( 'Y-m-d\TH:i:s\Z' ),
			'$select'       => 'subject,recurrence,showAs,start,end,subject,isAllDay,transactionId',
			'$top'          => 100,
		);

		$calendars_data = array();
		foreach ( $calendars as $calendar_id ) {
			$response = $api->get_events( $calendar_id, $args );
			if ( ! $response['success'] ) {
				continue;
			}

			$calendars_data[ $calendar_id ] = Arr::get( $response, 'data.value', array() );
		}

		return $calendars_data;
	}

	/**
	 * Remove booked slots from the given array of slots based on a Outlook Calendar event's time range.
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
		$account       = $this->accounts->get_account( $account_id );
		$access_token  = Arr::get( $account, 'tokens.access_token', '' );
		$refresh_token = Arr::get( $account, 'tokens.refresh_token', '' );

		if ( empty( $access_token ) || empty( $refresh_token ) ) {
			return new \WP_Error( 'outlook_integration_error', __( 'Outlook Integration Error: Access token or refresh token is empty.', 'quillbooking' ) );
		}

		$this->api = new API( $access_token, $refresh_token, $this->app, $account_id );

		return $this->api;
	}

	/**
	 * Auth fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_auth_fields() {
		 return array(
			 'client_id'     => array(
				 'label'       => __( 'Client ID', 'quillbooking' ),
				 'type'        => 'text',
				 'placeholder' => __( 'Enter your Google Client ID', 'quillbooking' ),
				 'required'    => true,
			 ),
			 'client_secret' => array(
				 'label'       => __( 'Client Secret', 'quillbooking' ),
				 'type'        => 'text',
				 'placeholder' => __( 'Enter your Google Client Secret', 'quillbooking' ),
				 'required'    => true,
			 ),
		 );
	}
}
