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
use QuillBooking\Models\User_Model;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Payment_Gateway\Payment_Validator;

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

		// hande event disable status
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/disable-status',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'disable_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'id'         => array(
							'description' => __( 'Unique identifier for the object.', 'quill-booking' ),
							'type'        => 'integer',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
						'properties' => array(
							'status' => array(
								'description' => __( 'Disable status.', 'quill-booking' ),
								'type'        => 'boolean',
								'context'     => array( 'view', 'edit' ),
								'readonly'    => true,
							),
						),
					),
				),
			)
		);

		// Get latest events
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/latest',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_latest_events' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'limit'   => array(
							'description' => __( 'Number of events to retrieve.', 'quillbooking' ),
							'type'        => 'integer',
							'default'     => 5,
						),
						'user_id' => array(
							'description' => __( 'Filter by user ID.', 'quillbooking' ),
							'type'        => 'integer',
						),
						'status'  => array(
							'description' => __( 'Filter by event status.', 'quillbooking' ),
							'type'        => 'string',
							'enum'        => array( 'active', 'inactive' ),
						),
					),
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
				'id'            => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'hash_id'       => array(
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'calendar_id'   => array(
					'description' => __( 'Calendar ID.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'user_id'       => array(
					'description' => __( 'User ID.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'name'          => array(
					'description' => __( 'Event name.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'is_disabled'   => array(
					'description' => __( 'Is event disabled.', 'quillbooking' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'description'   => array(
					'description' => __( 'Event description.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'slug'          => array(
					'description' => __( 'Event slug.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_title',
					),
				),
				'status'        => array(
					'description' => __( 'Event status.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enum'        => array( 'active', 'inactive' ),
				),
				'type'          => array(
					'description' => __( 'Event type.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enum'        => array( 'one-to-one', 'group', 'round-robin' ),
				),
				'duration'      => array(
					'description' => __( 'Event duration.', 'quillbooking' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'color'         => array(
					'description' => __( 'Event color.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'visibility'    => array(
					'description' => __( 'Event visibility.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enum'        => array( 'public', 'private' ),
				),
				'reserve_times' => array(
					'description' => __( 'Reserve times.', 'quillbooking' ),
					'type'        => 'boolean',
					'context'     => array( 'view', 'edit' ),
				),
				'created_at'    => array(
					'description' => __( 'Event created at.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'updated_at'    => array(
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
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$calendar_id       = $request->get_param( 'calendar_id' );
			$name              = $request->get_param( 'name' );
			$description       = $request->get_param( 'description' );
			$status            = $request->get_param( 'status' );
			$type              = $request->get_param( 'type' );
			$duration          = $request->get_param( 'duration' );
			$color             = $request->get_param( 'color' );
			$visibility        = $request->get_param( 'visibility' );
			$location          = $request->get_param( 'location' );
			$hosts             = $request->get_param( 'hosts' );
			$payments_settings = $request->get_param( 'payments_settings' );

			if ( empty( $location ) ) {
				return new WP_Error( 'rest_event_error', __( 'Event location is required.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$calendar = Calendar_Model::find( $calendar_id );
			if ( ! $calendar ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'You must add event to a calendar.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$team_events = array( 'collective', 'round-robin' );
			$host_events = array( 'one-to-one', 'group' );

			if ( ( 'host' === $calendar->type && ! in_array( $type, $host_events ) ) || ( 'team' === $calendar->type && ! in_array( $type, $team_events ) ) ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Invalid event type.', 'quillbooking' ), array( 'status' => 400 ) );
			}

			// Validate payment settings if provided
			if ( $payments_settings ) {
				$validation_result = Payment_Validator::validate_payment_gateways( $payments_settings );
				if ( is_wp_error( $validation_result ) ) {
					$wpdb->query( 'ROLLBACK' );
					return $validation_result;
				}
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
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Event not created', 'quillbooking' ), array( 'status' => 500 ) );
			}

			if ( 'host' === $calendar->type ) {
				$default_availability = Availabilities::get_user_default_availability( $calendar->user_id );
				if ( ! $default_availability ) {
					$wpdb->query( 'ROLLBACK' );
					return new WP_Error( 'rest_event_error', __( 'Default availability not found', 'quillbooking' ), array( 'status' => 500 ) );
				}
				$event->availability = $default_availability['id'];
			} else {
				$event->setTeamMembersAttribute( $hosts );
				$availability_data = array(
					'is_common' => false,
					'type'      => 'existing',
				);
				foreach ( $hosts as $user_id ) {
					$default_user_availability = Availabilities::get_user_default_availability( $user_id );
					if ( $default_user_availability ) {
						$availability_data['users_availability'][ $user_id ] = $default_user_availability;
					}
				}
				$event->availability = $availability_data;
			}

			$event->setReserveTimesAttribute( false );
			$event->location            = $location;
			$event->limits              = Event_Fields::instance()->get_default_limit_settings();
			$event->email_notifications = Event_Fields::instance()->get_default_email_notification_settings();
			$event->additional_settings = Event_Fields::instance()->get_default_additional_settings( $type );
			$event->advanced_settings   = Event_Fields::instance()->get_default_advanced_settings();
			$event->sms_notifications   = Event_Fields::instance()->get_default_sms_notification_settings();
			$event->payments_settings   = $payments_settings ?? Event_Fields::instance()->get_default_payments_settings();
			if ( 'group' === $type ) {
				$event->group_settings = array(
					'max_invites'    => 2,
					'show_remaining' => true,
				);
			}

			$event->save();
			// Set system fields based on the validated location
			$event->setSystemFields();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
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
	// Inside REST_Event_Controller::get_item method in class-rest-event-controller.php

	public function get_item( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = Event_Model::with( 'calendar' )->find( $id );

			if ( ! $event ) {
				return new WP_Error(
					'rest_event_not_found',
					__( 'Event not found', 'quillbooking' ),
					array( 'status' => 404 )
				);
			}

			$usersId = $event->getTeamMembersAttribute() ?: array( $event->user->ID );
			$usersId = is_array( $usersId ) ? $usersId : array( $usersId );

			$users = array();
			foreach ( $usersId as $userId ) {
				$user = User_Model::find( $userId );

				if ( $user ) {
					$user_avatar_url = get_avatar_url( $user->ID );
					$availabilities  = Availabilities::get_user_availabilities( $user->ID );

					$users[] = array(
						'id'             => $user->ID,
						'name'           => $user->display_name,
						'image'          => $user_avatar_url,
						'availabilities' => $availabilities,
					);
				}
			}

			$event->hosts             = $users;
			$event->availability_data = $event->getAvailabilityAttribute();
			$event->reserve           = $event->getReserveTimesAttribute();

			return new WP_REST_Response( $event, 200 );
		} catch ( \Throwable $e ) { // Catch Throwable
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
				'availability' => $event->getAvailabilityAttribute(),
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
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

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
			$reserve_times       = $request->get_param( 'reserve_times' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			// Validate payment settings
			if ( $payments_settings ) {
				$validation_result = Payment_Validator::validate_payment_gateways( $payments_settings );
				if ( is_wp_error( $validation_result ) ) {
					$wpdb->query( 'ROLLBACK' );
					return $validation_result;
				}
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
				'advanced_settings'   => $advanced_settings,
				'email_notifications' => $email_notifications,
				'sms_notifications'   => $sms_notifications,
				'payments_settings'   => $payments_settings,
				'webhook_feeds'       => $webhook_feeds,
				'dynamic_duration'    => $dynamic_duration,
			);

			$event->setReserveTimesAttribute( $reserve_times );

			if ( ! empty( $slug ) ) {
				$exists = Event_Model::where( 'slug', $slug )->where( 'id', '!=', $id )->first();
				if ( $exists ) {
					$wpdb->query( 'ROLLBACK' );
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

			if ( $availability ) {
				if ( $event->calendar->type === 'team' ) {
					$result = $this->update_event_team_availability( $event, $availability );
					if ( is_wp_error( $result ) ) {
						$wpdb->query( 'ROLLBACK' );
						return $result;
					}
				} else {
					$result = $this->update_event_host_availability( $event, $availability );
					if ( is_wp_error( $result ) ) {
						$wpdb->query( 'ROLLBACK' );
						return $result;
					}
				}
			}

			$event->save();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
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
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id           = $request->get_param( 'id' );
			$availability = $request->get_param( 'availability' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$result = $this->update_event_host_availability( $event, $availability );
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
				return $result;
			}

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event->availability_value, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
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
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id     = $request->get_param( 'id' );
			$fields = $request->get_param( 'fields' );
			$event  = Event_Model::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$event->updateFields( $fields );

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event->fields, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
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
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id = $request->get_param( 'id' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$event->delete();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response(
				array(
					'id' => $id,
				),
				200
			);
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
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
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id = $request->get_param( 'id' );

			$event = Event_Model::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$new_event = $event->duplicate();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $new_event, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
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
			$id     = $request->get_param( 'id' );
			$status = $request->get_param( 'status' );
			$event  = Event_Model::find( $id );
			if ( ! $event ) {
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}
			$event->is_disabled = $status;
			$event->save();
			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	// Update event availability
	private function update_event_host_availability( $event, $availability ) {

		if ( 'custom' === $availability['type'] ) {
			$event->meta()->updateOrCreate(
				array(
					'meta_key' => 'availability',
				),
				array(
					'meta_value' => maybe_serialize( $availability ),
				)
			);
		} else {
			$availability_model = Availabilities::get_availability( $availability['id'] );
			if ( ! $availability_model ) {
				return new WP_Error( 'rest_event_error', __( 'Availability not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			Availabilities::update_availability( $availability );

			$event->meta()->updateOrCreate(
				array(
					'meta_key' => 'availability',
				),
				array(
					'meta_value' => $availability['id'],
				)
			);
		}
		return $availability;
	}

	// Update event availability
	private function update_event_team_availability( $event, $availability ) {
		$event->meta()->updateOrCreate(
			array(
				'meta_key' => 'availability',
			),
			array(
				'meta_value' => maybe_serialize( $availability ),
			)
		);
		if ( $availability['is_common'] ) {
			if ( 'existing' === $availability['type'] ) {
				$availability_model = Availabilities::get_availability( $availability['id'] );
				if ( ! $availability_model ) {
					return new WP_Error( 'rest_event_error', __( 'Availability not found', 'quillbooking' ), array( 'status' => 404 ) );
				}
				unset( $availability['is_common'], $availability['type'] );
				Availabilities::update_availability( $availability );
			}
		} else {
			foreach ( $availability->users_availability as $user_id => $user_availability ) {
				$availability_model = Availabilities::get_availability( $user_availability['id'] );
				if ( ! $availability_model ) {
					return new WP_Error( 'rest_event_error', __( 'Availability not found', 'quillbooking' ), array( 'status' => 404 ) );
				}

				Availabilities::update_availability( $user_availability );
			}
		}
		return $availability;
	}

	/**
	 * Get latest events
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_latest_events( $request ) {
		try {
			$limit   = $request->get_param( 'limit' ) ? absint( $request->get_param( 'limit' ) ) : 7;
			$user_id = $request->get_param( 'user_id' );
			$status  = $request->get_param( 'status' );

			$query = Event_Model::query()->orderBy( 'created_at', 'desc' );

			// Apply filters if provided
			if ( $user_id ) {
				$query->where( 'user_id', $user_id );
			} elseif ( ! current_user_can( 'quillbooking_read_all_calendars' ) ) {
				$query->where( 'user_id', get_current_user_id() );
			}

			if ( $status ) {
				$query->where( 'status', $status );
			}

			$events = $query->limit( $limit )->get();

			return new WP_REST_Response( $events, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}
}
