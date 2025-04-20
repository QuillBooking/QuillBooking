<?php
/**
 * Class Rest_Event_Controller
 *
 * This class is responsible for handling the event controller
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\V1;

use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Models\Event_Model;
use QuillBooking\Capabilities;
use QuillBooking\Availabilities;
use QuillBooking\Event_Fields\Event_Fields;
use QuillBooking\Models\Calendar_Model;

/**
 * Event Controller class
 */
class REST_Event_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'events';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'keyword'  => array(
							'description' => __( 'Keyword to search.', 'quillbooking' ),
							'type'        => 'string',
						),
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'quillbooking' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Page number.', 'quillbooking' ),
							'type'        => 'integer',
						),
						'filter'   => array(
							'description' => __( 'Filter the results.', 'quillbooking' ),
							'type'        => 'object',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/availability',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_availability' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item_availability' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'availability' => array(
							'description'          => __( 'Availability to update.', 'quillbooking' ),
							'type'                 => 'object',
							'additionalProperties' => true,
							'required'             => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/fields',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fields' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_fields' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'fields' => array(
							'description'          => __( 'Fields to update.', 'quillbooking' ),
							'type'                 => 'object',
							'additionalProperties' => true,
							'required'             => true,
						),
					),
				),
			)
		);

		// Duplicate event
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/duplicate',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate_item' ),
					'permission_callback' => array( $this, 'duplicate_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Event ID to duplicate.', 'quillbooking' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);

		// Get meta
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/meta/(?P<key>[\w-]+)',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_meta' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		// disable events
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/disable',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'disable_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Get item schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'event',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'hash_id'     => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'calendar_id' => array(
					'description' => __( 'Calendar ID.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'user_id'     => array(
					'description' => __( 'User ID.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'name'        => array(
					'description' => __( 'Event name.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'is_disabled' => array(
					'description' => __( 'Is event disabled.', 'quillbooking' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'description' => array(
					'description' => __( 'Event description.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'slug'        => array(
					'description' => __( 'Event slug.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_title',
					),
				),
				'status'      => array(
					'description' => __( 'Event status.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enum'        => array( 'active', 'inactive' ),
				),
				'type'        => array(
					'description' => __( 'Event type.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enum'        => array( 'one-to-one', 'group', 'round-robin' ),
				),
				'duration'    => array(
					'description' => __( 'Event duration.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'color'       => array(
					'description' => __( 'Event color.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'visibility'  => array(
					'description' => __( 'Event visibility.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enum'        => array( 'public', 'private' ),
				),
				'created_at'  => array(
					'description' => __( 'Event created at.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'updated_at'  => array(
					'description' => __( 'Event updated at.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		try {
			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$keyword  = $request->get_param( 'keyword' );
			$filter   = $request->get_param( 'filter' ) ?? array();
			$user     = Arr::get( $filter, 'user' ) ? Arr::get( $filter, 'user' ) : 'own';

			if ( 'own' === $user ) {
				$user = get_current_user_id();
			}

			if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'quillbooking_read_all_calendars' ) ) {
				return new WP_Error( 'rest_event_error', __( 'You do not have permission', 'quillbooking' ), array( 'status' => 403 ) );
			}

			$query = Event_Model::query();

			if ( $keyword ) {
				$query->where( 'name', 'LIKE', '%' . $keyword . '%' );
			}

			if ( 'all' !== $user ) {
				$query->where( 'user_id', $user );
			}

			$events = $query->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $events, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_own_calendars' ) || current_user_can( 'quillbooking_read_all_calendars' );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		try {
			$calendar_id = $request->get_param( 'calendar_id' );
			$name        = $request->get_param( 'name' );
			$description = $request->get_param( 'description' );
			$status      = $request->get_param( 'status' );
			$type        = $request->get_param( 'type' );
			$duration    = $request->get_param( 'duration' );
			$color       = $request->get_param( 'color' );
			$visibility  = $request->get_param( 'visibility' );
			$location    = $request->get_param( 'location' );

			if ( empty( $location ) ) {
				return new WP_Error( 'rest_event_error', __( 'Event location is required.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$calendar = Calendar_Model::find( $calendar_id );
			if ( ! $calendar ) {
				return new WP_Error( 'rest_event_error', __( 'You must add event to a calendar.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$team_events = array( 'collective', 'round-robin' );
			$host_events = array( 'one-to-one', 'group' );

			if ( ( 'host' === $calendar->type && ! in_array( $type, $host_events ) ) || ( 'team' === $calendar->type && ! in_array( $type, $team_events ) ) ) {
				return new WP_Error( 'rest_event_error', __( 'Invalid event type.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$event_data = array(
				'calendar_id' => $calendar_id,
				'name'        => $name,
				'description' => $description,
				'status'      => $status ?? 'active',
				'type'        => $type,
				'duration'    => $duration,
				'color'       => $color,
				'visibility'  => $visibility,
				'is_disabled' => false,
			);

			$event_data = array_filter( $event_data );
			$event      = Event_Model::create( $event_data );
			$event->setEventRangeAttribute(
				array(
					'type' => 'days',
					'days' => 60,
				)
			);
			if ( ! $event->id ) {
				return new WP_Error( 'rest_event_error', __( 'Event not created', 'quillbooking' ), array( 'status' => 500 ) );
			}

			$default_availability = Availabilities::get_default_availability( get_current_user_id() );
			if ( ! $default_availability ) {
				$event->delete();
				return new WP_Error( 'rest_event_error', __( 'Default availability not found', 'quillbooking' ), array( 'status' => 500 ) );
			}

			$event->location            = $location;
			$event->availability        = $default_availability['id'];
			$event->limits              = Event_Fields::instance()->get_default_limit_settings();
			$event->email_notifications = Event_Fields::instance()->get_default_email_notification_settings();
			$event->additional_settings = Event_Fields::instance()->get_default_additional_settings( $type );
			$event->advanced_settings   = Event_Fields::instance()->get_default_advanced_settings();
			$event->sms_notifications   = Event_Fields::instance()->get_default_sms_notification_settings();
			$event->payments_settings   = Event_Fields::instance()->get_default_payments_settings();
			if ( 'group' === $type ) {
				$event->group_settings = array(
					'max_invites'    => 2,
					'show_remaining' => true,
				);
			}

			$event->save();
			$event->setSystemFields();

			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function create_item_permissions_check( $request ) {
		$calendar_id = $request->get_param( 'calendar_id' );
		return Capabilities::can_manage_calendar( $calendar_id );
	}

	/**
	 * Delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_items( $request ) {
		try {
			$ids = $request->get_param( 'ids' );

			if ( ! $ids ) {
				return new WP_Error( 'rest_event_error', __( 'No events to delete', 'quillbooking' ), array( 'status' => 400 ) );
			}

			foreach ( $ids as $id ) {
				$event = Event_Model::find( $id );

				if ( ! $event ) {
					return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
				}

				$event->delete();
			}

			return new WP_REST_Response( $ids, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function delete_items_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = Event_Model::with( 'calendar' )->find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$calendarIds = $event->calendar->getTeamMembers();

			if ( $calendarIds ) {
				if ( ! is_array( $calendarIds ) ) {
					$calendarIds = array( $calendarIds );
				}

				$calendars = array();
				foreach ( $calendarIds as $calendarId ) {
					$calendar = Calendar_Model::find( $calendarId );
					if ( $calendar ) {
						$calendars[] = array(
							'id'   => $calendar->id,
							'name' => $calendar->name,
						);
					}
				}
				$event->hosts = $calendars;
			} else {
				$calendar = $event->calendar;
				if ( $calendar ) {
					$event->hosts = array(
						array(
							'id'   => $calendar->id,
							'name' => $calendar->name,
						),
					);
				}
			}

			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item availability
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item_availability( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$data = array(
				'availability' => $event->availability,
				'range'        => $event->getEventRangeAttribute(),
			);

			return new WP_REST_Response( $data, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_fields( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $event->fields, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function get_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_read_event( $id ) || current_user_can( 'quillbooking_read_all_calendars' );
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		try {
			$id                  = $request->get_param( 'id' );
			$user_id             = $request->get_param( 'user_id' );
			$name                = $request->get_param( 'name' );
			$description         = $request->get_param( 'description' );
			$status              = $request->get_param( 'status' );
			$type                = $request->get_param( 'type' );
			$dynamic_duration    = $request->get_param( 'dynamic_duration' );
			$duration            = $request->get_param( 'duration' );
			$color               = $request->get_param( 'color' );
			$availability        = $request->get_param( 'availability' );
			$visibility          = $request->get_param( 'visibility' );
			$location            = $request->get_param( 'location' );
			$limits              = $request->get_param( 'limits' );
			$additional_settings = $request->get_param( 'additional_settings' );
			$group_settings      = $request->get_param( 'group_settings' );
			$event_range         = $request->get_param( 'event_range' );
			$advanced_settings   = $request->get_param( 'advanced_settings' );
			$email_notifications = $request->get_param( 'email_notifications' );
			$sms_notifications   = $request->get_param( 'sms_notifications' );
			$payments_settings   = $request->get_param( 'payments_settings' );
			$webhook_feeds       = $request->get_param( 'webhook_feeds' );
			$fields              = $request->get_param( 'fields' );
			$slug                = $request->get_param( 'slug' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$updated = array(
				'name'                => $name,
				'description'         => $description,
				'status'              => $status,
				'type'                => $type,
				'duration'            => $duration,
				'color'               => $color,
				'visibility'          => $visibility,
				'location'            => $location,
				'limits'              => $limits,
				'additional_settings' => $additional_settings,
				'group_settings'      => $group_settings,
				'event_range'         => $event_range,
				'availability'        => $availability,
				'advanced_settings'   => $advanced_settings,
				'email_notifications' => $email_notifications,
				'sms_notifications'   => $sms_notifications,
				'payments_settings'   => $payments_settings,
				'webhook_feeds'       => $webhook_feeds,
				'dynamic_duration'    => $dynamic_duration,
			);

			if ( ! empty( $slug ) ) {
				$exists = Event_Model::where( 'slug', $slug )->where( 'id', '!=', $id )->first();
				if ( $exists ) {
					return new WP_Error( 'rest_event_error', __( 'Event slug already exists', 'quillbooking' ), array( 'status' => 400 ) );
				}

				$updated['slug'] = $slug;
			}

			if ( $user_id ) {
				$updated['user_id'] = $user_id;
			}
			$updated = array_filter( $updated );

			foreach ( $updated as $key => $value ) {
				$event->{$key} = $value;
			}

			if ( $fields ) {
				$event->updateFields( $fields );
			}

			$event->save();

			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item availability
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item_availability( $request ) {
		try {
			$id           = $request->get_param( 'id' );
			$availability = $request->get_param( 'availability' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			if ( 'custom' === $availability['type'] ) {
				$event->meta()->updateOrCreate(
					array(
						'meta_key' => 'availability',
					),
					array(
						'meta_value' => $availability,
					)
				);
			} else {
				$availability = Availabilities::get_availability( $availability['id'] );
				if ( ! $availability ) {
					return new WP_Error( 'rest_event_error', __( 'Availability not found', 'quillbooking' ), array( 'status' => 404 ) );
				}

				$event->meta()->updateOrCreate(
					array(
						'meta_key' => 'availability',
					),
					array(
						'meta_value' => $availability['id'],
					)
				);
			}

			return new WP_REST_Response( $event->availability_value, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_fields( $request ) {
		try {
			$id     = $request->get_param( 'id' );
			$fields = $request->get_param( 'fields' );
			$event  = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$event->updateFields( $fields );

			return new WP_REST_Response( $event->fields, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function update_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_event( $id ) || current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		try {
			$id = $request->get_param( 'id' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$event->delete();

			return new WP_REST_Response(
				array(
					'id' => $id,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function delete_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_event( $id ) || current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Duplicate item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate_item( $request ) {
		try {
			$id = $request->get_param( 'id' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$new_event = $event->duplicate();

			return new WP_REST_Response( $new_event, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Duplicate item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function duplicate_item_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Get meta
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_meta( $request ) {
		try {
			$id  = $request->get_param( 'id' );
			$key = $request->get_param( 'key' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$meta = $event->{$key};

			if ( ! isset( $event->{$key} ) ) {
				return new WP_Error( 'rest_event_error', __( 'Meta not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $meta, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}


	/**
	 * Disable item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function disable_item( $request ) {
		try {
			$ids = $request->get_param( 'ids' );
			if ( ! $ids ) {
				return new WP_Error( 'rest_event_error', __( 'No events to disable', 'quillbooking' ), array( 'status' => 400 ) );
			}
			foreach ( $ids as $id ) {
				$event = Event_Model::find( $id );

				if ( ! $event ) {
					return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
				}

				$event->is_disabled = true;
				$event->save();

			}
			return new WP_REST_Response( $ids );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}
}
