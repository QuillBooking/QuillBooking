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
		try {
			$page       = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$per_page   = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$keyword    = $request->get_param( 'keyword' ) ? $request->get_param( 'keyword' ) : '';
			$filter     = $request->get_param( 'filter' ) ? $request->get_param( 'filter' ) : array();
			$user       = Arr::get( $filter, 'user' ) ? Arr::get( $filter, 'user' ) : 'own';
			$period     = Arr::get( $filter, 'period' ) ? Arr::get( $filter, 'period' ) : 'all';
			$event      = Arr::get( $filter, 'event' ) ? Arr::get( $filter, 'event' ) : 'all';
			$event_type = Arr::get( $filter, 'event_type' ) ? Arr::get( $filter, 'event_type' ) : 'all';
			$search     = Arr::get( $filter, 'search' ) ? Arr::get( $filter, 'search' ) : '';
			$year       = Arr::get( $filter, 'year', date( 'Y' ) );
			$month      = Arr::get( $filter, 'month', date( 'm' ) );
			$day        = Arr::get( $filter, 'day' );

			if ( 'own' === $user ) {
				$user = get_current_user_id();
			}

			if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'quillbooking_read_all_bookings' ) ) {
				return new WP_Error( 'rest_booking_error', __( 'You do not have permission', 'quillbooking' ), array( 'status' => 403 ) );
			}

			$query = Booking_Model::query();

			// Build the start and end date range
			if ( ! empty( $day ) ) {
				$startDate = "$year-$month-$day 00:00:00"; // Specific day at midnight
				$endDate   = "$year-$month-$day 23:59:59"; // Specific day at 23:59:59
			} else {
				$startDate = "$year-$month-01 00:00:00"; // First day of the month at midnight
				$endDate   = date( 'Y-m-t 23:59:59', strtotime( $startDate ) ); // Last day of the month at 23:59:59
			}

			$query->whereBetween( 'start_time', array( $startDate, $endDate ) )
				->orderBy( 'start_time' );

			if ( 'all' !== $user ) {
				$query->whereHas(
					'event',
					function ( $query ) use ( $user ) {
						$query->where( 'user_id', $user );
					}
				);
			}

			if ( ! empty( $keyword ) ) {
				$query->where( 'name', 'LIKE', '%' . $keyword . '%' );
			}

			// Clone the query here to get the count of pending bookings
			$pending_count   = ( clone $query )->where( 'status', 'pending' )->count();
			$cancelled_count = ( clone $query )->where( 'status', 'cancelled' )->count();
			$no_show_count   = ( clone $query )->where( 'status', 'no_show' )->count();

			// Filter by period
			if ( 'all' !== $period ) {
				if ( 'latest' === $period ) {
					$query->orderBy( 'created_at', 'desc' );
				}

				if ( 'upcoming' === $period ) {
					$query->where( 'start_time', '>', date( 'Y-m-d H:i:s' ) )->orderBy( 'start_time' );
				}

				if ( 'pending' === $period ) {
					$query->where( 'status', 'pending' );
				}

				if ( 'completed' === $period ) {
					$query->where( 'status', 'completed' );
				}

				if ( 'cancelled' === $period ) {
					$query->where( 'status', 'cancelled' );
				}

				if ( 'no-show' === $period ) {
					$query->where( 'status', 'no-show' );
				}
			} else {
				$query->orderBy( 'start_time' );
			}

			if ( 'all' !== $user ) {
				// Filter by event type
				if ( 'all' !== $event_type ) {
					$query->whereHas(
						'event',
						function ( $query ) use ( $event_type ) {
							$query->where( 'type', $event_type );
						}
					);
				}

				// Filter by event
				if ( 'all' !== $event ) {
					$query->where( 'event_id', $event );
				}
			}

			// search by event name or email
			if ( ! empty( $search ) ) {
				$query->whereHas(
					'guest',
					function ( $query ) use ( $search ) {
						$query->where( 'name', 'LIKE', '%' . $search . '%' )
							->orWhere( 'email', 'LIKE', '%' . $search . '%' );
					}
				);
			}

			$bookings = $query->with( 'event', 'event.calendar', 'guest', 'calendar.user' )->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response(
				array(
					'bookings'        => $bookings,
					'pending_count'   => $pending_count,
					'cancelled_count' => $cancelled_count,
					'noshow_count'    => $no_show_count,
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

			$invitee          = array(
				array(
					'name'  => $name,
					'email' => $email,
				),
			);
			$booking_service  = new Booking_Service();
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
}
