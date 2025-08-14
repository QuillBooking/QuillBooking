<?php

/**
 * Class Calendar_Controller
 *
 * This class is responsible for handling the calendar controller
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\V1;

use QuillBooking\Models\Availability_Model;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Availabilities;
use QuillBooking\Availability_service;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Capabilities;
use QuillBooking\Managers\Integrations_Manager;
use QuillBooking\Models\User_Model;
use QuillBooking\Helpers\Integrations_Helper;

/**
 * Calendar Controller class
 */
class REST_Calendar_Controller extends REST_Controller {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'calendars';

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
						'ids'      => array(
							'description' => __( 'IDs of the calendars.', 'quillbooking' ),
							'type'        => 'array',
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
					'args'                => array(
						'ids' => array(
							'description' => __( 'Calendars IDs.', 'quillbooking' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// Register route for single item
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the resource.', 'quillbooking' ),
						'type'        => 'integer',
					),
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

		// Register route for clone events from a calendar to another
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/clone',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the resource.', 'quillbooking' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'clone_events' ),
					'permission_callback' => array( $this, 'clone_events_permissions_check' ),
					'args'                => array(
						'event_id' => array(
							'description' => __( 'Events to clone.', 'quillbooking' ),
							'type'        => 'array',
							'required'    => true,
							'items'       => array(
								'type' => 'integer',
							),
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)' . '/team',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_team' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the resource.', 'quillbooking' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Register route for getting calendar integrations
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)' . '/integrations',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_integrations' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the resource.', 'quillbooking' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Schema for the calendar
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		 return array(
			 '$schema'    => 'http://json-schema.org/draft-04/schema#',
			 'title'      => 'calendar',
			 'type'       => 'object',
			 'properties' => array(
				 'id'             => array(
					 'description' => __( 'Unique identifier for the resource.', 'quillbooking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view' ),
					 'readonly'    => true,
				 ),
				 'hash_id'        => array(
					 'description' => __( 'Unique identifier for the resource.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view' ),
					 'readonly'    => true,
				 ),
				 'user_id'        => array(
					 'description'  => __( 'User ID.', 'quillbooking' ),
					 'type'         => 'integer',
					 'context'      => array( 'view', 'edit' ),
					 'args_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'name'           => array(
					 'description'  => __( 'Name of the calendar.', 'quillbooking' ),
					 'type'         => 'string',
					 'context'      => array( 'view', 'edit' ),
					 'required'     => true,
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'description'    => array(
					 'description'  => __( 'Description of the calendar.', 'quillbooking' ),
					 'type'         => 'string',
					 'context'      => array( 'view', 'edit' ),
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'slug'           => array(
					 'description'  => __( 'Slug of the calendar.', 'quillbooking' ),
					 'type'         => 'string',
					 'context'      => array( 'view', 'edit' ),
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_title',
					 ),
				 ),
				 'status'         => array(
					 'description' => __( 'Status of the calendar.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'enum'        => array( 'active', 'inactive' ),
				 ),
				 'type'           => array(
					 'description' => __( 'Type of the calendar.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'enum'        => array( 'host', 'team', 'one-off' ),
					 'required'    => true,
				 ),
				 'members'        => array(
					 'description' => __( 'Members.', 'quillbooking' ),
					 'type'        => 'array',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'avatar'         => array(
					 'description' => __( 'Avatar.', 'quillbooking' ),
					 'type'        => 'object',
					 'context'     => array( 'view', 'edit' ),
					 'properties'  => array(
						 'url' => array(
							 'description' => __( 'Avatar URL.', 'quillbooking' ),
							 'type'        => 'string',
						 ),
						 'id'  => array(
							 'description' => __( 'Avatar ID.', 'quillbooking' ),
							 'type'        => 'integer',
						 ),
					 ),
				 ),
				 'featured_image' => array(
					 'description' => __( 'Featured.', 'quillbooking' ),
					 'type'        => 'object',
					 'context'     => array( 'view', 'edit' ),
					 'properties'  => array(
						 'url' => array(
							 'description' => __( 'Avatar URL.', 'quillbooking' ),
							 'type'        => 'string',
						 ),
						 'id'  => array(
							 'description' => __( 'Avatar ID.', 'quillbooking' ),
							 'type'        => 'integer',
						 ),
					 ),
				 ),
				 'created_at'     => array(
					 'description' => __( 'Date and time when the calendar was created.', 'quillbooking' ),
					 'type'        => 'string',
					 'format'      => 'date-time',
					 'context'     => array( 'view' ),
					 'readonly'    => true,
				 ),
				 'updated_at'     => array(
					 'description' => __( 'Date and time when the calendar was last updated.', 'quillbooking' ),
					 'type'        => 'string',
					 'format'      => 'date-time',
					 'context'     => array( 'view' ),
					 'readonly'    => true,
				 ),
			 ),
		 );
	}

	/**
	 * Get all calendars
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		try {
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$keyword  = $request->get_param( 'keyword' ) ? $request->get_param( 'keyword' ) : '';
			$filter   = $request->get_param( 'filters' ) ? $request->get_param( 'filters' ) : array();
			$type     = Arr::get( $filter, 'type', 'all' );
			$user     = $request->get_param( 'user' ) ?? ( current_user_can( 'quillbooking_read_all_calendars' ) ? 'all' : 'own' );
			$ids      = $request->get_param( 'ids' ) ? $request->get_param( 'ids' ) : array();

			if ( 'own' === $user ) {
				$user = get_current_user_id();
			}

			if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'quillbooking_read_all_calendars' ) ) {
				return new WP_Error( 'rest_calendar_error', __( 'You do not have permission', 'quillbooking' ), array( 'status' => 403 ) );
			}

			$query = Calendar_Model::query()->with( 'user' );

			if ( ! empty( $keyword ) ) {
				$query->whereHas(
					'events',
					function ( $query ) use ( $keyword ) {
						$query->where( 'name', 'like', '%' . $keyword . '%' )
							->orWhere( 'description', 'like', '%' . $keyword . '%' );
					}
				);
			}

			if ( 'all' !== $user ) {
				$query->where( 'user_id', $user );
			}

			if ( 'all' !== $type ) {
				$query->where( 'type', $type );
			}

			if ( ! empty( $ids ) ) {
				$query->whereIn( 'id', $ids );
			}

			$calendars = $query->with(
				array(
					'events' => function ( $query ) use ( $keyword ) {
						$query->select( 'id', 'calendar_id', 'name', 'duration', 'type', 'slug', 'is_disabled' );
						if ( $keyword ) {
							$query->where( 'name', 'like', '%' . $keyword . '%' );
						}
					},
				)
			)->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $calendars, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_own_calendars' ) || current_user_can( 'quillbooking_read_all_calendars' );
	}

	/**
	 * Create a calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		global $wpdb;
		$wpdb->query( 'START TRANSACTION' );
		try {
			$name        = $request->get_param( 'name' );
			$description = $request->get_param( 'description' );
			$type        = $request->get_param( 'type' );
			$members     = $request->get_param( 'members' );
			$timezone    = $request->get_param( 'timezone' );
			if ( empty( $timezone ) ) {
				$timezone = wp_timezone_string();
			}
			$availability = $request->get_param( 'availability' );

			if ( ! in_array( $type, array( 'team', 'host' ), true ) ) {
				throw new Exception( __( 'Invalid calendar type', 'quillbooking' ), 400 );
			}

			$user_id = $type === 'team' ? get_current_user_id() : $request->get_param( 'user_id' );

			if ( $type === 'host' ) {
				$this->validate_host_calendar( $user_id, $availability );
			} else {
				$this->validate_team_calendar( $members );
			}

			$calendar = Calendar_Model::create(
				array(
					'user_id'     => $user_id,
					'name'        => $name,
					'description' => $description,
					'type'        => $type,
				)
			);

			$calendar->timezone = $timezone;

			if ( $type === 'team' ) {
				$calendar->syncTeamMembers( $members );
			} elseif ( $type === 'host' ) {
				$this->create_availability( $user_id, $availability, $timezone );
			}

			$wpdb->query( 'COMMIT' );

			return new WP_REST_Response( $calendar, 200 );
		} catch ( Exception $e ) {
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to create items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Delete calendars
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_items( $request ) {
		try {
			$ids = $request->get_param( 'ids' );
			if ( empty( $ids ) ) {
				return new WP_Error( 'rest_calendar_error', __( 'IDs are required', 'quillbooking' ), array( 'status' => 400 ) );
			}

			Calendar_Model::destroy( $ids );

			return new WP_REST_Response( array( 'message' => __( 'Calendars deleted successfully', 'quillbooking' ) ), 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function delete_items_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Get a single calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		try {
			$id       = $request->get_param( 'id' );
			$calendar = Calendar_Model::find( $id );

			if ( ! $calendar ) {
				return new WP_Error( 'rest_calendar_error', __( 'Calendar not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $calendar, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to get a single item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function get_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_read_calendar( $id );
	}

	/**
	 * Get item team
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item_team( $request ) {
		try {
			$id       = $request->get_param( 'id' );
			$calendar = Calendar_Model::select( 'id' )->find( $id );

			$calendar_team = $calendar->getTeamMembers();

			$users = array();
			foreach ( $calendar_team as $teamId ) {
				$user = User_Model::where( 'ID', $teamId )->first();
				if ( $user ) {
					$user_avatar_url = get_avatar_url( $user->ID );
					$users[]         = array(
						'ID'           => $user->ID,
						'display_name' => $user->display_name,
						'user_email'   => $user->user_email,
						'user_login'   => $user->user_login,
						'image'        => $user_avatar_url,
					);
				}
			}

			return new WP_REST_Response( $users, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_team_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}


	/**
	 * Update a calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		try {
			$id             = $request->get_param( 'id' );
			$name           = $request->get_param( 'name' );
			$description    = $request->get_param( 'description' );
			$members        = $request->get_param( 'members' );
			$timezone       = $request->get_param( 'timezone' );
			$integrations   = $request->get_param( 'integrations' );
			$avatar         = $request->get_param( 'avatar' );
			$featured_image = $request->get_param( 'featured_image' );
			$slug           = $request->get_param( 'slug' );

			$calendar = Calendar_Model::find( $id );
			if ( isset( $calendar->team_members ) ) {
				unset( $calendar->team_members );
			}

			if ( ! $calendar ) {
				return new WP_Error( 'rest_calendar_error', __( 'Calendar not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			if ( $members && 'team' === $calendar->type ) {
				if ( empty( $members ) ) {
					return new WP_Error( 'rest_calendar_error', __( "Team members can't be empty", 'quillbooking' ), array( 'status' => 400 ) );
				}

				$calendars = Calendar_Model::whereIn( 'ID', $members )
					->where( 'type', 'host' )
					->get();

				if ( $calendars->count() !== count( $members ) ) {
					return new WP_Error( 'rest_calendar_error', __( 'Please make sure that you selected the right hosts', 'quillbooking' ), array( 'status' => 400 ) );
				}
			}

			$updated = array(
				'name'        => $name,
				'description' => $description,
			);

			if ( ! empty( $slug ) ) {
				$exists = Calendar_Model::where( 'slug', $slug )->where( 'id', '!=', $id )->first();
				if ( $exists ) {
					return new WP_Error( 'rest_calendar_error', __( 'Calendar slug already exists', 'quillbooking' ), array( 'status' => 400 ) );
				}

				$updated['slug'] = $slug;
			}

			$updated = array_filter( $updated );

			$calendar->update( $updated );

			if ( ! empty( $timezone ) ) {
				$calendar->timezone = $timezone;
			}

			if ( ! empty( $integrations ) ) {
				$calendar->integrations = $integrations;
			}

			if ( $members && 'team' === $calendar->type ) {
				$calendar->syncTeamMembers( $members );
			}

			if ( ! empty( $avatar ) ) {
				$calendar->avatar = $avatar;
			}

			if ( ! empty( $featured_image ) ) {
				$calendar->featured_image = $featured_image;
			}

			$calendar->save();

			return new WP_REST_Response( $calendar, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to update a single item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function update_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_calendar( $id );
	}

	/**
	 * Delete a calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		try {
			$id       = $request->get_param( 'id' );
			$calendar = Calendar_Model::find( $id );

			if ( ! $calendar ) {
				return new WP_Error( 'rest_calendar_error', __( 'Calendar not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$calendar->delete();

			return new WP_REST_Response( array( 'message' => __( 'Calendar deleted successfully', 'quillbooking' ) ), 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to delete a single item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_calendar( $id );
	}

	/**
	 * Clone events from a calendar to another
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function clone_events( $request ) {
		try {
			$id       = $request->get_param( 'id' );
			$event_id = $request->get_param( 'event_id' );

			$calendar = Calendar_Model::find( $id );
			if ( ! $calendar ) {
				return new WP_Error( 'rest_calendar_error', __( 'Calendar not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			if ( ! $event_id ) {
				return new WP_Error( 'rest_calendar_error', __( 'Event are required', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$event = Event_Model::find( $event_id )->first();
			if ( ! $event ) {
				return new WP_Error( 'rest_calendar_error', __( 'Event not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$columns = array(
				'name',
				'description',
				'type',
				'duration',
				'color',
			);

			$meta = array(
				'availability',
				'location',
				'limits',
				'email_notifications',
				'sms_notifications',
				'additional_settings',
				'group_settings',
				'event_range',
				'advanced_settings',
				'payments_settings',
				'webhook_feeds',
			);

			$eventData                = Arr::only( $event->toArray(), $columns );
			$eventData['calendar_id'] = $calendar->id;
			$eventData['user_id']     = $calendar->user_id;

			$cloned_event = Event_Model::create( $eventData );
			if ( $cloned_event->id ) {
				foreach ( $meta as $key ) {
					$cloned_event->{$key} = $event->get_meta( $key, null );
				}
				$cloned_event->save();
			}

			return new WP_REST_Response( array( 'message' => __( 'Events cloned successfully', 'quillbooking' ) ), 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to clone events
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function clone_events_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_calendar( $id );
	}



	/**
	 * Validate host calendar requirements
	 */
	private function validate_host_calendar( $user_id, $availability ) {
		// Check if user exists
		if ( empty( $user_id ) || ! User_Model::where( 'ID', $user_id )->exists() ) {
			throw new Exception( __( 'Invalid user ID. User does not exist.', 'quillbooking' ), 400 );
		}

		// Check for existing host calendar
		if ( Calendar_Model::where( 'user_id', $user_id )->where( 'type', 'host' )->exists() ) {
			throw new Exception( __( 'You already have a host calendar', 'quillbooking' ), 400 );
		}

		if ( empty( $availability['weekly_hours'] ) || ! is_array( $availability['weekly_hours'] ) ) {
			throw new Exception( __( 'Valid weekly hours are required', 'quillbooking' ), 400 );
		}
	}

	/**
	 * Validate team calendar requirements
	 */
	private function validate_team_calendar( $members ) {
		if ( empty( $members ) ) {
			throw new Exception( __( 'Team members are required', 'quillbooking' ), 400 );
		}

		$valid_members = Calendar_Model::whereIn( 'user_id', $members )
			->where( 'type', 'host' )
			->pluck( 'ID' );

		if ( count( $valid_members ) !== count( $members ) ) {
			throw new Exception( __( 'Invalid team member selection', 'quillbooking' ), 400 );
		}
	}


	/**
	 * Handle availability creation
	 */
	private function create_availability( $user_id, $availability_data, $timezone ) {
		// Check if user already has a default availability
		$existing_availability = Availability_Model::where( 'user_id', $user_id )->where( 'is_default', 1 )->first();

		$availability_name = 'Default Availability';
		$is_default        = 1;

		if ( $existing_availability ) {
			$availability_name = 'Weekly Hours';
			$is_default        = 0;
		}

		// Prepare value data as JSON
		$value_data = array(
			'weekly_hours' => $availability_data['weekly_hours'] ?? array(),
			'override'     => $availability_data['override'] ?? array(),
		);

		$new_availability = Availability_Model::create(
			array(
				'user_id'    => $user_id,
				'name'       => $availability_name,
				'value'      => wp_json_encode( $value_data ),
				'timezone'   => $timezone,
				'is_default' => $is_default,
			)
		);

		return $new_availability;
	}

	/**
	 * Get calendar integrations
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item_integrations( $request ) {
		try {
			$calendar_id = $request->get_param( 'id' );
			$calendar    = Calendar_Model::find( $calendar_id );

			if ( ! $calendar ) {
				return new WP_Error( 'rest_calendar_error', __( 'Calendar not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$connected_integrations = array();

			// Check if integrations are available
			if ( ! Integrations_Helper::has_integrations() ) {
				return rest_ensure_response( Integrations_Helper::get_default_integrations() );
			}

			$integrations = Integrations_Manager::instance()->get_integrations();

			$calendar_ids = array( $calendar_id );
			if ( in_array( $calendar->type, array( 'team' ) ) ) {
				$team_members = $calendar->getTeamMembers();
				$calendar_ids = $team_members;
			}

			foreach ( $integrations as $integration_class ) {
				$integration         = new $integration_class();
				$all_connected       = true;
				$has_accounts        = false;
				$global_settings     = $integration->get_settings();
				$set_global_settings = false;
				$teams_enabled       = false;
				$has_get_started     = false;
				$has_pro_version     = true;
				$team_members_setup  = true;
				$slug                = $integration->slug;

				if ( $slug == 'zoom' ) {
					$app_credentials = Arr::get( $global_settings, 'app_credentials', null );
					if ( $app_credentials && is_array( $app_credentials ) && ! empty( $app_credentials['client_id'] ) && ! empty( $app_credentials['client_secret'] ) ) {
						$set_global_settings = true;
					} else {
						$set_global_settings = false;
					}
				} else {
					$app = Arr::get( $global_settings, 'app', null );
					if ( $app && is_array( $app ) && ! empty( $app['cache_time'] ) ) {
						$set_global_settings = true;
					} else {
						$set_global_settings = false;
					}
				}

				foreach ( $calendar_ids as $calendar_id ) {
					$is_host_calendar = false;
					if ( $calendar->type === 'team' ) {
						$host_calendar = Calendar_Model::where( 'user_id', $calendar_id )->where( 'type', 'host' )->first();
						if ( $host_calendar->user_id == $calendar->user_id ) {
							$is_host_calendar = true;
						}
					} else {
						$host_calendar    = Calendar_Model::find( $calendar_id );
						$is_host_calendar = true;
					}

					$integration->set_host( $host_calendar );
					$accounts = $integration->accounts->get_accounts();

					if ( empty( $accounts ) ) {
						$all_connected = false;
						// For team calendars, if any member doesn't have integration setup, mark as not setup
						if ( in_array( $calendar->type, array( 'team' ) ) && $slug !== 'zoom' ) {
							$team_members_setup = false;
						}
						if ( $slug === 'zoom' ) {
							if ( $is_host_calendar ) {
								$has_default_calendar = false;
								foreach ( $accounts as $account ) {
									if ( isset( $account['app_credentials']['account_id'] ) && isset( $account['app_credentials']['client_id'] ) && isset( $account['app_credentials']['client_secret'] ) ) {
										$has_default_calendar = true;
										break;
									}
								}
							}
							if ( ! $has_default_calendar && $is_host_calendar ) {
								$team_members_setup = false;
							}
						}
					} else {
						$has_accounts = true;
						// Check if this is the default account and has Teams enabled
						if ( $slug === 'outlook' && ! in_array( $calendar->type, array( 'team' ) ) ) {
							foreach ( $accounts as $account ) {
								if ( isset( $account['config']['default_calendar'] ) ) {
									// Check if Teams is explicitly enabled in the account settings
									$teams_enabled = isset( $account['config']['settings']['enable_teams'] ) &&
									$account['config']['settings']['enable_teams'] === true;
									break;
								}
							}
						}

						// For Google integration, check if member has proper configuration
						if ( in_array( $calendar->type, array( 'team' ) ) ) {
							if ( $slug === 'zoom' ) {
								if ( $is_host_calendar ) {
									$has_default_calendar = false;
									foreach ( $accounts as $account ) {
										if ( isset( $account['app_credentials']['account_id'] ) && isset( $account['app_credentials']['client_id'] ) && isset( $account['app_credentials']['client_secret'] ) ) {
											$has_default_calendar = true;
											break;
										}
									}
								}
								if ( ! $has_default_calendar && $is_host_calendar ) {
									$team_members_setup = false;
								}
							} else {
								$has_default_calendar = false;
								foreach ( $accounts as $account ) {
									if ( isset( $account['config']['default_calendar'] ) &&
									 ! empty( $account['config']['default_calendar']['calendar_id'] ) ) {
										$has_default_calendar = true;
										break;
									}
								}
								if ( ! $has_default_calendar ) {
									$team_members_setup = false;
								}
							}
						}
					}
				}

				if ( $calendar->type === 'team' ) {
					$teams_enabled = true;
				}

				$connected_integrations[ $slug ] = array(
					'name'               => $integration->name,
					'connected'          => $all_connected,
					'has_accounts'       => $has_accounts,
					'has_settings'       => $set_global_settings,
					'teams_enabled'      => $teams_enabled,
					'has_get_started'    => $has_get_started,
					'has_pro_version'    => $has_pro_version,
					'team_members_setup' => $team_members_setup,
				);
			}

			return rest_ensure_response( $connected_integrations );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_calendar_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}
};
