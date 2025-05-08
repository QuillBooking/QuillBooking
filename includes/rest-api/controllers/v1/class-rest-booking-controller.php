<?php

/**
 * Class Rest_Booking_Controller
 *
 * This class is responsible for handling the booking controller
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\V1;

use DateTime;
use WP_Error;
use Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Models\Booking_Model;
use Illuminate\Support\Arr;
use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Booking_Service;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Guest_Model;
use QuillBooking\Capabilities;
use QuillBooking\Utils;

/**
 * Booking Controller class
 */
class REST_Booking_Controller extends REST_Controller {



	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'bookings';

	/**
	 * Booking status constants
	 */
	protected $STATUS_PENDING   = 'pending';
	protected $STATUS_COMPLETED = 'completed';
	protected $STATUS_CANCELLED = 'cancelled';
	protected $STATUS_NO_SHOW   = 'no-show';


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
			)
		);

		// Single booking route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Booking counts route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/counts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_booking_counts' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'user' => array(
							'description' => __( 'User ID to filter counts by.', 'quillbooking' ),
							'type'        => 'string',
							'default'     => 'own',
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
			 'title'      => 'booking',
			 'type'       => 'object',
			 'properties' => array(
				 'id'           => array(
					 'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
				 'hash_id'      => array(
					 'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
				 'event_id'     => array(
					 'description' => __( 'Event ID.', 'quillbooking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'guest_id'     => array(
					 'description' => __( 'Guest ID.', 'quillbooking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'start_date'   => array(
					 'description' => __( 'Start date.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'slot_time'    => array(
					 'description' => __( 'Slot time.', 'quillbooking' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'source'       => array(
					 'description' => __( 'Source.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'status'       => array(
					 'description' => __( 'Status.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'cancelled_by' => array(
					 'description' => __( 'Cancelled by.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'event_url'    => array(
					 'description' => __( 'Event URL.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'created_at'   => array(
					 'description' => __( 'Creation time.', 'quillbooking' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
				 'updated_at'   => array(
					 'description' => __( 'Update time.', 'quillbooking' ),
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
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {

		// Parse and sanitize pagination parameters
		$page     = max( 1, absint( $request->get_param( 'page' ) ?? 1 ) );
		$per_page = min( 100, max( 1, absint( $request->get_param( 'per_page' ) ?? 10 ) ) );
		$keyword  = sanitize_text_field( $request->get_param( 'keyword' ) ?? '' );

		// Parse filters
		$filter     = $request->get_param( 'filter' ) ?? array();
		$user       = sanitize_text_field( Arr::get( $filter, 'user', 'own' ) );
		$period     = sanitize_text_field( Arr::get( $filter, 'period', 'all' ) );
		$event      = sanitize_text_field( Arr::get( $filter, 'event', 'all' ) );
		$event_type = sanitize_text_field( Arr::get( $filter, 'event_type', 'all' ) );
		$search     = sanitize_text_field( Arr::get( $filter, 'search', '' ) );

		// Validate date parameters
		$year  = $this->validate_year( Arr::get( $filter, 'year', current_time( 'Y' ) ) );
		$month = $this->validate_month( Arr::get( $filter, 'month', current_time( 'm' ) ) );
		$day   = $this->validate_day( Arr::get( $filter, 'day' ) );

		if ( 'own' === $user ) {
			$user = get_current_user_id();
		}

		if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'quillbooking_read_all_bookings' ) ) {
			return new WP_Error( 'rest_booking_error', __( 'You do not have permission', 'quillbooking' ), array( 'status' => 403 ) );
		}

		try {

			$query = Booking_Model::query();

			$this->apply_date_range_filter( $query, $year, $month, $day );

			if ( 'all' !== $user ) {
				$this->apply_user_filter( $query, $user );
			}

			if ( ! empty( $keyword ) ) {
				$query->where( 'name', 'LIKE', '%' . $keyword . '%' );
			}

			$status_counts = $this->get_status_counts( $query );

			$this->apply_period_filter( $query, $period );

			if ( 'all' !== $user ) {
				$this->apply_event_filters( $query, $event, $event_type );
			}

			if ( ! empty( $search ) ) {
				$this->apply_search_filter( $query, $search );
			}

			$bookings = $query->with( 'event', 'event.calendar', 'guest', 'calendar.user' )->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response(
				array(
					'bookings'        => $bookings,
					'pending_count'   => $status_counts[ $this->STATUS_PENDING ] ?? 0,
					'cancelled_count' => $status_counts[ $this->STATUS_CANCELLED ] ?? 0,
					'noshow_count'    => $status_counts[ $this->STATUS_NO_SHOW ] ?? 0,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
		}
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
		return current_user_can( 'quillbooking_read_own_bookings' ) || current_user_can( 'quillbooking_read_all_bookings' );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		try {
			$event_id            = $request->get_param( 'event_id' );
			$start_date          = $request->get_param( 'start_date' );
			$duration            = $request->get_param( 'slot_time' );
			$timezone            = $request->get_param( 'timezone' );
			$name                = $request->get_param( 'name' );
			$email               = $request->get_param( 'email' );
			$status              = $request->get_param( 'status' );
			$location            = $request->get_param( 'location' );
			$message             = $request->get_param( 'message' );
			$current_url         = $request->get_param( 'current_url' );
			$fields              = $request->get_param( 'fields' );
			$ignore_availability = $request->get_param( 'ignore_availability' );

			// will be updated later
			$location = 'zoom';

			$event    = Booking_Validator::validate_event( $event_id );
			$duration = Booking_Validator::validate_duration( $duration, $event->duration );

			if ( ! $ignore_availability ) {
				$start_date      = Booking_Validator::validate_start_date( $start_date, $timezone );
				$available_slots = $event->get_booking_available_slots( $start_date, $duration, $timezone );
				if ( ! $available_slots ) {
					throw new \Exception( __( 'Sorry, This booking is not available', 'quillbooking' ) );
				}
			} else {
				$start_date = Utils::create_date_time( $start_date, $timezone );
			}

			$invitee = array(
				array(
					'name'  => $name,
					'email' => $email,
				),
			);

			// Allow filtering the Booking_Service instance for testing
			$booking_service = apply_filters( 'quillbooking_booking_service_instance', new Booking_Service() );

			$validate_invitee = $booking_service->validate_invitee( $event, $invitee );
			$calendar_id      = $event->calendar_id;
			$booking          = $booking_service->book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $validate_invitee, $location, $status, $fields );

			$bookings   = array();
			$bookings[] = $booking;

			// if ( get_current_user_id() ) {
			// $guest_data['user_id'] = get_current_user_id();
			// }

			// if ( 'collective' === $event->type ) {
			// $teamMembers = $event->calendar->teamMembers;
			// foreach ( $teamMembers as $teamMember ) {
			// $booking    = $this->book_event_slot( $event, $teamMember, $start_time, $slot_time, $timezone, $guest_data, $additional_guests, $location, $status );
			// $bookings[] = $booking;
			// }
			// } else {
			// $booking    = $this->book_event_slot( $event, $event->calendar_id, $start_time, $slot_time, $timezone, $guest_data, $additional_guests, $location, $status );
			// $bookings[] = $booking;
			// }

			return new WP_REST_Response( $bookings, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
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
		$event_id = $request->get_param( 'event_id' );
		return Capabilities::can_manage_event( $event_id );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		try {
			$id      = $request->get_param( 'id' );
			$booking = Booking_Model::find( $id );

			if ( ! $booking ) {
				return new WP_Error( 'rest_booking_error', __( 'Booking not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$booking->load( 'guest', 'event', 'calendar.user', 'logs' );
			$booking->fields = $booking->get_meta( 'fields' );

			return new WP_REST_Response( $booking, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
		}
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
		$id = $request->get_param( 'id' );
		return Capabilities::can_read_booking( $id );
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		try {
			$id                  = $request->get_param( 'id' );
			$status              = $request->get_param( 'status' );
			$cancellation_reason = $request->get_param( 'cancellation_reason' );
			$start_time          = $request->get_param( 'start_time' );
			$end_time            = $request->get_param( 'end_time' );

			$booking = Booking_Model::find( $id );

			if ( ! $booking ) {
				return new WP_Error( 'rest_booking_error', __( 'Booking not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			// Convert the start and end time to UTC.
			if ( $start_time ) {
				$start_time = new \DateTime( $start_time, new \DateTimeZone( $booking->timezone ) );
				$start_time->setTimezone( new \DateTimeZone( 'UTC' ) );
				$start_time = $start_time->format( 'Y-m-d H:i:s' );
			}

			if ( $end_time ) {
				$end_time = new \DateTime( $end_time, new \DateTimeZone( $booking->timezone ) );
				$end_time->setTimezone( new \DateTimeZone( 'UTC' ) );
				$end_time = $end_time->format( 'Y-m-d H:i:s' );
			}

			$booking_data = array(
				'status'     => $status,
				'start_time' => $start_time,
				'end_time'   => $end_time,
			);

			$booking_data = array_filter( $booking_data );

			if ( 'cancelled' === $status ) {
				$booking_data['cancelled_by'] = array(
					'type' => 'user',
					'id'   => get_current_user_id(),
				);
				$booking->update_meta( 'cancellation_reason', $cancellation_reason );
			}

			$booking->update( $booking_data );
			return new WP_REST_Response( $booking, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
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
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_booking( $id );
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		try {
			$id = $request->get_param( 'id' );

			$booking = Booking_Model::find( $id );

			if ( ! $booking ) {
				return new WP_Error( 'rest_booking_error', __( 'Booking not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			$booking->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
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
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_booking( $id );
	}


	/**
	 * Apply date range filter to booking query
	 *
	 * @param mixed       $query The Booking query object
	 * @param string      $year Year to filter by
	 * @param string      $month Month to filter by
	 * @param string|null $day Optional day to filter by
	 * @return void
	 */
	protected function apply_date_range_filter( $query, $year, $month, $day ) {
		if ( ! empty( $day ) ) {
				// Specific day
				$start_date = new DateTime( "$year-$month-$day 00:00:00" );
				$end_date   = new DateTime( "$year-$month-$day 23:59:59" );
		} else {
				// Full month
				$start_date = new DateTime( "$year-$month-01 00:00:00" );
				$end_date   = clone $start_date;
				$end_date->modify( 'last day of this month' )->setTime( 23, 59, 59 );
		}

			$query->whereBetween(
				'start_time',
				array(
					$start_date->format( 'Y-m-d H:i:s' ),
					$end_date->format( 'Y-m-d H:i:s' ),
				)
			);
	}

	/**
	 * Apply user filter to booking query
	 *
	 * @param mixed $query The Booking query object
	 * @param int   $user_id User ID to filter by
	 * @return void
	 */
	protected function apply_user_filter( $query, $user_id ) {
			$query->whereHas(
				'event',
				function( $query ) use ( $user_id ) {
					$query->where( 'user_id', $user_id );
				}
			);
	}

	/**
	 * Get counts of bookings by status
	 *
	 * @param mixed $query The Booking query object to clone
	 * @return array Associative array with status counts
	 */
	protected function get_status_counts( $query ) {
			// Use a single query with subqueries for better performance
			$counts                            = array();
			$counts[ $this->STATUS_PENDING ]   = ( clone $query )->where( 'status', $this->STATUS_PENDING )->count();
			$counts[ $this->STATUS_CANCELLED ] = ( clone $query )->where( 'status', $this->STATUS_CANCELLED )->count();
			$counts[ $this->STATUS_NO_SHOW ]   = ( clone $query )->where( 'status', $this->STATUS_NO_SHOW )->count();

			return $counts;
	}

	/**
	 * Apply period filter to booking query
	 *
	 * @param mixed  $query The Booking query object
	 * @param string $period Period to filter by
	 * @return void
	 */
	protected function apply_period_filter( $query, $period ) {
		switch ( $period ) {
			case 'latest':
					$query->orderBy( 'created_at', 'desc' );
				break;

			case 'upcoming':
					$query->where( 'start_time', '>', current_time( 'mysql' ) )
								->orderBy( 'start_time' );
				break;

			case $this->STATUS_PENDING:
			case $this->STATUS_COMPLETED:
			case $this->STATUS_CANCELLED:
			case $this->STATUS_NO_SHOW:
				$query->where( 'status', $period );
				break;

			default: // 'all'
					$query->orderBy( 'start_time' );
				break;
		}
	}

	/**
	 * Apply event filters to booking query
	 *
	 * @param mixed  $query The Booking query object
	 * @param string $event Event ID to filter by
	 * @param string $event_type Event type to filter by
	 * @return void
	 */
	protected function apply_event_filters( $query, $event, $event_type ) {
			// Filter by event type
		if ( 'all' !== $event_type ) {
				$query->whereHas(
					'event',
					function( $query ) use ( $event_type ) {
						$query->where( 'type', $event_type );
					}
				);
		}

			// Filter by specific event
		if ( 'all' !== $event ) {
				$query->where( 'event_id', absint( $event ) );
		}
	}

	/**
	 * Apply search filter to booking query
	 *
	 * @param mixed  $query The Booking query object
	 * @param string $search Search term to filter by
	 * @return void
	 */
	protected function apply_search_filter( $query, $search ) {
			$query->whereHas(
				'guest',
				function( $query ) use ( $search ) {
					$sanitized_search = '%' . $search . '%';
					$query->where( 'name', 'LIKE', $sanitized_search )
								->orWhere( 'email', 'LIKE', $sanitized_search );
				}
			);
	}

	/**
	 * Validate year parameter
	 *
	 * @param string $year Year to validate
	 * @return string Validated year
	 */
	protected function validate_year( $year ) {
		$year = absint( $year );
		return  $year >= 2000 ? $year : date( 'Y' );
	}

	/**
	 * Validate month parameter
	 *
	 * @param string $month Month to validate
	 * @return string Validated month (01-12)
	 */
	protected function validate_month( $month ) {
			$month = absint( $month );
			return ( $month >= 1 && $month <= 12 ) ? sprintf( '%02d', $month ) : current_time( 'm' );
	}

	/**
	 * Validate day parameter
	 *
	 * @param string|null $day Day to validate
	 * @return string|null Validated day (01-31) or null
	 */
	protected function validate_day( $day ) {
		if ( empty( $day ) ) {
				return null;
		}

			$day = absint( $day );
			return ( $day >= 1 && $day <= 31 ) ? sprintf( '%02d', $day ) : null;
	}


	/**
	 * Get booking counts by status
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_booking_counts( $request ) {
		// Get user parameter
		$user = sanitize_text_field( $request->get_param( 'user' ) ?? 'own' );

		if ( 'own' === $user ) {
			$user = get_current_user_id();
		}

		if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'quillbooking_read_all_bookings' ) ) {
			return new WP_Error( 'rest_booking_error', __( 'You do not have permission', 'quillbooking' ), array( 'status' => 403 ) );
		}

		try {
			$query = Booking_Model::query();

			// Apply user filter if needed
			if ( 'all' !== $user ) {
				$this->apply_user_filter( $query, $user );
			}

			// Get the current time for upcoming/past filtering
			$current_time = current_time( 'mysql' );

			// Calculate all counts
			$counts = array(
				'total'     => ( clone $query )->count(),
				'upcoming'  => ( clone $query )->where( 'start_time', '>', $current_time )->where( 'status', '!=', $this->STATUS_CANCELLED )->count(),
				'completed' => ( clone $query )->where( 'status', $this->STATUS_COMPLETED )->count(),
				'pending'   => ( clone $query )->where( 'status', $this->STATUS_PENDING )->count(),
				'cancelled' => ( clone $query )->where( 'status', $this->STATUS_CANCELLED )->count(),
				'no_show'   => ( clone $query )->where( 'status', $this->STATUS_NO_SHOW )->count(),
			);

			return new WP_REST_Response( $counts, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}
}
