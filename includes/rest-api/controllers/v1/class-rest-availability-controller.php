<?php

/**
 * Class REST_Availability_Controller
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\v1;

use QuillBooking\Models\Calendar_Model;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Models\Availability_Model;
use QuillBooking\Models\Event_Model;

/**
 * REST_Availability_Controller class
 */
class REST_Availability_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'availabilities';

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
						'filter' => array(
							'description' => __( 'Filter availabilities.', 'quill-booking' ),
							'type'        => 'object',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
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
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)/clone',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'clone_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)/set-default',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_default' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
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
			 'title'      => 'availability',
			 'type'       => 'object',
			 'properties' => array(
				 'id'           => array(
					 'description' => __( 'Unique identifier for the object.', 'quill-booking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
				 'user_id'      => array(
					 'description' => __( 'User ID.', 'quill-booking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
				 ),
				 'name'         => array(
					 'description' => __( 'Name.', 'quill-booking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
				 ),
				 'weekly_hours' => array(
					 'description' => __( 'Weekly hours.', 'quill-booking' ),
					 'type'        => 'object',
					 'properties'  => array(
						 'monday'    => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'tuesday'   => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'wednesday' => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'thursday'  => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'friday'    => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'saturday'  => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'sunday'    => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
					 ),
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
				 ),
				 'override'     => array(
					 'description' => __( 'Override.', 'quill-booking' ),
					 'type'        => 'object',
					 'properties'  => array(
						 'days'  => array(
							 'type'  => 'array',
							 'items' => array(
								 'type' => 'string',
							 ),
						 ),
						 'hours' => array(
							 'type'  => 'array',
							 'items' => array(
								 'type'       => 'object',
								 'properties' => array(
									 'start' => array(
										 'type' => 'string',
									 ),
									 'end'   => array(
										 'type' => 'string',
									 ),
								 ),
							 ),
						 ),
					 ),
					 'context'     => array( 'view', 'edit' ),
					 'required'    => false,
				 ),
				 'is_default'   => array(
					 'description' => __( 'Is default.', 'quill-booking' ),
					 'type'        => 'boolean',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => false,
					 'default'     => false,
				 ),
			 ),
		 );
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$filter = $request->get_param( 'filter' ) ? $request->get_param( 'filter' ) : array();
		$user   = Arr::get( $filter, 'user' ) ? Arr::get( $filter, 'user' ) : 'own';

		if ( 'all' === $user && ! current_user_can( 'quillbooking_read_all_availability' ) ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to read all availabilities.', 'quill-booking' ), array( 'status' => 403 ) );
		}

		$query = Availability_Model::query();

		if ( 'own' === $user ) {
			$query->where( 'user_id', get_current_user_id() );
		}

		$availabilities = $query->get();

		// Convert to array format and add events details
		$availabilities_array = array();
		foreach ( $availabilities as $availability ) {
			$availability_data      = $this->prepare_availability_for_response( $availability );
			$availability_data      = $this->events_details_for_availability( $availability_data );
			$availabilities_array[] = $availability_data;
		}

		return new WP_REST_Response( $availabilities_array, 200 );
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'quillbooking_read_all_availability' ) || current_user_can( 'quillbooking_read_own_availability' );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		$id           = $request->get_param( 'id' );
		$availability = Availability_Model::find( $id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'quill-booking' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'quillbooking_read_all_availability' ) && get_current_user_id() !== $availability->user_id ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to read this availability.', 'quill-booking' ), array( 'status' => 403 ) );
		}

		$availability_data = $this->prepare_availability_for_response( $availability );
		$availability_data = $this->events_details_for_availability( $availability_data );

		return new WP_REST_Response( $availability_data, 200 );
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'quillbooking_read_all_availability' ) || current_user_can( 'quillbooking_read_own_availability' );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function create_item( $request ) {
		$weekly_hours = $request->get_param( 'value' )['weekly_hours'];
		$override     = $request->get_param( 'value' )['override'];
		$user_id      = $request->get_param( 'user_id' ) ? $request->get_param( 'user_id' ) : get_current_user_id();
		$name         = $request->get_param( 'name' );
		$timezone     = $request->get_param( 'timezone' );

		if ( ! $name ) {
			return new WP_Error( 'rest_availability_invalid_name', __( 'Invalid availability name.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		if ( empty( $weekly_hours ) ) {
			return new WP_Error( 'rest_availability_invalid_weekly_hours', __( 'Invalid weekly hours.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		if ( empty( $timezone ) ) {
			return new WP_Error( 'rest_availability_invalid_timezone', __( 'Invalid timezone.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		// Prepare value data
		$value_data = array(
			'weekly_hours' => $weekly_hours,
			'override'     => $override,
		);

		$availability_data = array(
			'user_id'    => $user_id,
			'name'       => $name,
			'value'      => $value_data,
			'timezone'   => $timezone,
			'is_default' => false,
		);

		try {
			$availability  = Availability_Model::create( $availability_data );
			$response_data = $this->prepare_availability_for_response( $availability );
			return new WP_REST_Response( $response_data, 201 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_create_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_availability' );
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		$id           = $request->get_param( 'id' );
		$weekly_hours = $request->get_param( 'value' )['weekly_hours'];
		$override     = $request->get_param( 'value' )['override'];
		$name         = $request->get_param( 'name' );
		$timezone     = $request->get_param( 'timezone' );
		$is_default   = $request->get_param( 'is_default' );

		$availability = Availability_Model::find( $id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'quill-booking' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'quillbooking_manage_all_availability' ) && get_current_user_id() !== $availability->user_id ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to update this availability.', 'quill-booking' ), array( 'status' => 403 ) );
		}

		try {
			// Handle is_default logic first (before other updates)
			if ( isset( $is_default ) ) {
				if ( $is_default ) {
					// If setting this as default, remove default from all other availabilities for this user
					Availability_Model::where( 'user_id', $availability->user_id )
						->where( 'id', '!=', $id )
						->update( array( 'is_default' => false ) );

					$availability->is_default = true;
				} else {
					// If trying to unset default, we need to ensure there's always one default
					$other_default_count = Availability_Model::where( 'user_id', $availability->user_id )
						->where( 'id', '!=', $id )
						->where( 'is_default', true )
						->count();

					if ( $other_default_count === 0 ) {
						// Cannot unset default if this is the only default availability
						return new WP_Error(
							'rest_availability_default_required',
							__( 'Cannot remove default status. There must be at least one default availability per user.', 'quill-booking' ),
							array( 'status' => 400 )
						);
					}

					$availability->is_default = false;
				}
			}

			// Update simple fields directly
			if ( $name ) {
				$availability->name = $name;
			}

			if ( $timezone ) {
				$availability->timezone = $timezone;
			}

			// Handle value field updates (weekly_hours and override)
			if ( $weekly_hours || isset( $override ) ) {
				// Get current value data
				$current_value = $availability->value ?: array();
				$value_data    = $current_value;

				if ( $weekly_hours ) {
					$value_data['weekly_hours'] = $weekly_hours;
				}

				// Always include override even if empty
				if ( isset( $override ) ) {
					$value_data['override'] = $override;
				}

				$availability->value = $value_data;
			}

			// Save all changes
			$updated = $availability->save();

			if ( ! $updated ) {
				return new WP_Error(
					'rest_availability_update_failed',
					__( 'Failed to update availability', 'quill-booking' ),
					array( 'status' => 500 )
				);
			}

			$response_data = $this->prepare_availability_for_response( $availability );
			return new WP_REST_Response( $response_data, 200 );

		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_update_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_availability' ) || current_user_can( 'quillbooking_manage_own_availability' );
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		$id = $request->get_param( 'id' );

		$availability = Availability_Model::find( $id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'quill-booking' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'quillbooking_manage_all_availability' ) && get_current_user_id() !== $availability->user_id ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to delete this availability.', 'quill-booking' ), array( 'status' => 403 ) );
		}

		if ( $availability->is_default ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Sorry, you cannot delete the default availability.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		$events_data = $this->get_availability_events_data( $availability->id );

		if ( $events_data['events_count'] > 0 ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Sorry, you cannot delete an availability with events.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		try {
			$this->replace_availability_references_before_delete( $availability );

			$availability->delete();
			return new WP_REST_Response( null, 204 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_delete_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'quillbooking_manage_all_availability' ) || current_user_can( 'quillbooking_manage_own_availability' );
	}

	/**
	 * Clone item
	 *
	 * @param WP_REST_Request
	 *
	 * @return WP_REST_Response
	 */
	public function clone_item( $request ) {
		$availability_id = $request->get_param( 'id' );

		if ( ! $availability_id ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		$availability = Availability_Model::find( $availability_id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_not_found', __( 'Availability not found.', 'quill-booking' ), array( 'status' => 404 ) );
		}

		$clone_data = array(
			'user_id'    => $availability->user_id,
			'name'       => $availability->name . ' (clone)',
			'value'      => $availability->value,
			'timezone'   => $availability->timezone,
			'is_default' => false,
		);

		try {
			$cloned_availability = Availability_Model::create( $clone_data );
			$response_data       = $this->prepare_availability_for_response( $cloned_availability );
			return new WP_REST_Response( $response_data, 201 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_clone_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Set availability as default
	 *
	 * @param WP_REST_Request
	 */
	public function set_default( $request ) {
		$availability_id = $request->get_param( 'id' );

		if ( ! $availability_id ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		$availability = Availability_Model::find( $availability_id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_not_found', __( 'Availability not found.', 'quill-booking' ), array( 'status' => 404 ) );
		}

		$user_id = $availability->user_id;

		try {
			// Set all other availabilities for this user to not default
			Availability_Model::where( 'user_id', $user_id )
				->where( 'is_default', true )
				->update( array( 'is_default' => false ) );

			// Set this availability as default
			$availability->update( array( 'is_default' => true ) );

			$response_data = $this->prepare_availability_for_response( $availability );
			return new WP_REST_Response( $response_data, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_set_default_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Prepare availability for response
	 *
	 * @param Availability_Model $availability
	 *
	 * @return array
	 */
	private function prepare_availability_for_response( $availability ) {

		return array(
			'id'         => $availability->id,
			'user_id'    => $availability->user_id,
			'name'       => $availability->name,
			'value'      => $availability->value,
			'timezone'   => $availability->timezone,
			'is_default' => $availability->is_default,
			'created_at' => $availability->created_at,
			'updated_at' => $availability->updated_at,
		);
	}

	/**
	 * Get events data for availability
	 *
	 * @since 1.0.0
	 *
	 * @param string $availability_id Availability ID.
	 * @return array Array containing events_count and events
	 */
	private function get_availability_events_data( $availability_id ) {
		$availability_model = Availability_Model::find( $availability_id );
		$user_id            = $availability_model->user_id;

		// Get all calendars that the user is in
		$calendars = Calendar_Model::where( 'user_id', $user_id )->get();

		if ( $calendars->isEmpty() ) {
			return array(
				'events_count' => 0,
				'events'       => array(),
			);
		}

		$total_events_count = 0;
		$all_events         = array();

		foreach ( $calendars as $calendar ) {
			// Check if the calendar is team or hosts
			if ( $calendar->type === 'host' ) {
				// For host calendars, get events directly from availability
				$events              = Event_Model::where( 'availability_id', $availability_id )->where( 'calendar_id', $calendar->id )->where( 'availability_type', 'existing' )->get();
				$total_events_count += $events->count();
				$all_events          = array_merge( $all_events, $events->toArray() );
			} else {
				// For team calendars, check availability_meta
				$events_count = 0;
				$events       = array();

				// Get all events for this calendar
				$calendar_events = Event_Model::where( 'calendar_id', $calendar->id )->where( 'availability_type', 'existing' )->get();

				foreach ( $calendar_events as $event ) {
					// Get availability meta from the event itself
					$availability_meta = $event->availability_meta;
					if ( ! $availability_meta['is_common'] && $availability_meta['hosts_schedules'][ $user_id ] === $availability_id ) {
						$events_count++;
						$events[] = $event;
					}
				}

				$total_events_count += $events_count;
				$all_events          = array_merge( $all_events, $events );
			}
		}

		return array(
			'events_count' => $total_events_count,
			'events'       => $all_events,
		);
	}

	/**
	 * Get events details for availability
	 *
	 * @since 1.0.0
	 *
	 * @param array $availability Availability.
	 *
	 * @return array
	 */
	private function events_details_for_availability( $availability ) {
		$events_data = $this->get_availability_events_data( $availability['id'] );

		$availability['events_count'] = $events_data['events_count'];
		$availability['events']       = $events_data['events'];

		return $availability;
	}

	/**
	 * Replace availability references in events before deleting availability
	 *
	 * @since 1.0.0
	 *
	 * @param Availability_Model $availability The availability being deleted.
	 * @return void
	 */
	private function replace_availability_references_before_delete( $availability ) {
		// Get the user's default availability
		$default_availability = Availability_Model::getUserDefault( $availability->user_id );

		if ( ! $default_availability ) {
			// If no default availability exists, create one or handle error
			error_log( "QuillBooking: No default availability found for user {$availability->user_id} when deleting availability {$availability->id}" );
			return;
		}

		$user_id = $availability->user_id;

		// Get all calendars that the user is in
		$calendars = Calendar_Model::where( 'user_id', $user_id )->get();

		foreach ( $calendars as $calendar ) {
			if ( $calendar->type === 'host' ) {
				$host_events = Event_Model::where( 'availability_id', $availability->id )
					->where( 'calendar_id', $calendar->id )
					->where( 'availability_type', 'custom' )
					->get();

				foreach ( $host_events as $event ) {
					$event->availability_id = $default_availability->id;
					$event->save();
				}
			} else {
				$team_events = Event_Model::where( 'calendar_id', $calendar->id )->where( 'availability_type', 'custom' )->get();

				foreach ( $team_events as $event ) {
					$availability_meta = $event->availability_meta;

					if ( $availability_meta['is_common'] ) {
						// Replace the availability_id with default
						if ( $event->availability_id === $availability->id ) {
							$event->availability_id = $default_availability->id;
							$event->save();
						}
					}

					// Also check hosts_schedules for this specific availability
					if ( isset( $availability_meta['hosts_schedules'][ $user_id ] ) &&
						 $availability_meta['hosts_schedules'][ $user_id ] === $availability->id ) {

						$availability_meta['hosts_schedules'][ $user_id ] = $default_availability->id;
						$event->availability_meta                         = $availability_meta;
						$event->save();
					}
				}
			}
		}

		// Log the replacement for debugging
		error_log( "QuillBooking: Replaced availability {$availability->id} references with default availability {$default_availability->id} for user {$availability->user_id}" );
	}
}
