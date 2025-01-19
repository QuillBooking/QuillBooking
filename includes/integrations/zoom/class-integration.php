<?php
/**
 * Zoom Calendar / Meet Integration
 *
 * This class is responsible for handling the Zoom Calendar / Meet Integration
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Zoom;

use Illuminate\Support\Arr;
use QuillBooking\Integration\Integration as Abstract_Integration;
use QuillBooking\Models\Event_Model;
use QuillBooking\Integrations\Zoom\REST_API\REST_API;
use QuillBooking\Utils;

/**
 * Zoom Integration class
 */
class Integration extends Abstract_Integration {

	/**
	 * Integration Name
	 *
	 * @var string
	 */
	public $name = 'Zoom';

	/**
	 * Integration Slug
	 *
	 * @var string
	 */
	public $slug = 'zoom';

	/**
	 * Integration Description
	 *
	 * @var string
	 */
	public $description = 'Host meetings and webinars with Zoom. Easily sync your Zoom events directly from the platform.';

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
	 * Is calendar integration
	 *
	 * @var bool
	 */
	public $is_calendar = false;

	/**
	 * Has acconuts
	 *
	 * @var bool
	 */
	public $has_accounts = false;

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
		'remote_data' => Remote_Data::class,
		'rest_api'    => REST_API::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct();
		$this->app = new App( $this );
		// add_action( 'quillbooking_booking_created', array( $this, 'add_event_to_calendars' ) );
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

		$zoom_meetings = $booking->get_meta( 'zoom_event_details', array() );
		if ( empty( $zoom_meetings ) ) {
			return;
		}

		$meeting_id = Arr::get( $zoom_meetings, 'meeting.id' );
		$account_id = Arr::get( $zoom_meetings, 'account_id' );

		$api = $this->connect( $host, $account_id );
		if ( ! $api ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __( 'Error connecting to Zoom.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Error connecting host %1$s with Zoom Account %2$s.', 'quillbooking' ),
						$host->name,
						$account_id
					),
				)
			);
			return;
		}

		$start_time = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		$data       = array(
			'start_time' => $start_time->format( 'Y-m-d\TH:i:s\Z' ),
			'duration'   => $booking->slot_time,
		);

		$response = $api->update_meeting( $meeting_id, $data );
		if ( ! $response['success'] ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __( 'Error rescheduling meeting in Zoom.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Error rescheduling event in Zoom Account %1$s: %2$s', 'quillbooking' ),
						$account_id,
						Arr::get( $response, 'data.error.message' )
					),
				)
			);
			return;
		}

		$booking->update_meta(
			'zoom_event_details',
			array(
				'event'      => Arr::get( $response, 'data' ),
				'account_id' => $account_id,
			)
		);

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Meeting rescheduled in Zoom Calendar.', 'quillbooking' ),
				'details' => sprintf(
					__( 'Event has been rescheduled in Zoom Account %1$s.', 'quillbooking' ),
					$account_id
				),
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

		$zoom_meetings = $booking->get_meta( 'zoom_event_details', array() );
		if ( empty( $zoom_meetings ) ) {
			return;
		}

		$meeting_id = Arr::get( $zoom_meetings, 'meeting.id' );
		$account_id = Arr::get( $zoom_meetings, 'account_id' );

		$api = $this->connect( $host, $account_id );
		if ( ! $api ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __( 'Error connecting to Zoom.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Error connecting host %1$s with Zoom Account %2$s.', 'quillbooking' ),
						$host->name,
						$account_id
					),
				)
			);
			return;
		}

		$response = $api->delete_meeting( $meeting_id );
		if ( ! $response['success'] ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __( 'Error removing meeting from Zoom.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Error removing event from Zoom Account %1$s: %2$s', 'quillbooking' ),
						$account_id,
						Arr::get( $response, 'data.error.message' )
					),
				)
			);
			return;
		}

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Meeting removed from Zoom Calendar.', 'quillbooking' ),
				'details' => __( 'Event has been removed from Zoom Calendar.', 'quillbooking' ),
			)
		);
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
		if ( 'zoom' !== $booking->location ) {
			return $booking;
		}

		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$zoom_integration = $this->host->get_meta( $this->meta_key, array() );
		if ( empty( $zoom_integration ) ) {
			return $booking;
		}

		$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		foreach ( $zoom_integration as $account_id => $data ) {
			$api = $this->connect( $host, $account_id );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Zoom.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error connecting host %1$s with Zoom Account %2$s.', 'quillbooking' ),
							$host->name,
							$account_id
						),
					)
				);
				continue;
			}

			$account      = $this->accounts->get_account( $account_id );
			$meeting_data = array(
				'agenda'       => $booking->event->name,
				'start_time'   => $start_date->format( 'Y-m-d\TH:i:s\Z' ),
				'duration'     => $booking->slot_time,
				'type'         => '2',
				'schedule_for' => Arr::get( $account, 'name' ),
				'settings'     => array(
					'meeting_invitees' => array(
						array(
							'email' => $booking->guest->email,
						),
					),
				),
				'topic'        => $booking->event->name,
			);

			// Remove any empty values recursively.
			$meeting_data = array_filter( $meeting_data );

			$response = $api->create_meeting( $meeting_data );
			if ( ! $response['success'] ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error creating meeting in Zoom.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Error adding event to Zoom Account %1$s: %2$s', 'quillbooking' ),
							$account_id,
							Arr::get( $response, 'data.error.message' )
						),
					)
				);
				continue;
			}

			$meeting = Arr::get( $response, 'data' );
			$booking->update_meta(
				'zoom_event_details',
				array(
					'meeting'    => $meeting,
					'account_id' => $account_id,
				)
			);

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Meeting created in Zoom Calendar.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Event has been added to Zoom Account %1$s: %2$s', 'quillbooking' ),
						$account_id,
						$meeting['join_url']
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
			return new \WP_Error( 'zoom_integration_error', __( 'Zoom Integration Error: Access token or refresh token is empty.', 'quillbooking' ) );
		}

		$this->api = new API( $access_token, $refresh_token, $this->app, $account_id );

		return $this->api;
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
			'account_id'    => array(
				'type'        => 'text',
				'label'       => __( 'Account ID', 'quillbooking' ),
				'required'    => true,
				'placeholder' => __( 'Enter your Zoom Account ID', 'quillbooking' ),
				'description' => __( 'You can find your Account ID in your Zoom app settings.', 'quillbooking' ),
			),
			'client_id'     => array(
				'type'        => 'text',
				'label'       => __( 'Client ID', 'quillbooking' ),
				'required'    => true,
				'placeholder' => __( 'Enter your Zoom Client ID', 'quillbooking' ),
				'description' => __( 'You can find your Client ID in your Zoom app settings.', 'quillbooking' ),
			),
			'client_secret' => array(
				'type'        => 'text',
				'label'       => __( 'Secret Key', 'quillbooking' ),
				'required'    => true,
				'placeholder' => __( 'Enter your Zoom Secret Key', 'quillbooking' ),
				'description' => __( 'You can find your Secret Key in your Zoom app settings.', 'quillbooking' ),
			),
		);
	}
}
