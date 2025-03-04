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
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Guest_Model;
use QuillBooking\Capabilities;

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
				'start_time'   => array(
					'description' => __( 'Start time.', 'quillbooking' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'end_time'     => array(
					'description' => __( 'End time.', 'quillbooking' ),
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

			if ( 'own' === $user ) {
				$user = get_current_user_id();
			}

			if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'quillbooking_read_all_bookings' ) ) {
				return new WP_Error( 'rest_booking_error', __( 'You do not have permission', 'quillbooking' ), array( 'status' => 403 ) );
			}

			$query = Booking_Model::query();

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

			$bookings = $query->with( 'event', 'event.calendar' )->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response(
				array(
					'bookings'        => $bookings,
					'pending_count'   => $pending_count,
					'cancelled_count' => $cancelled_count,
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
			$event_id    = $request->get_param( 'event_id' );
			$start_time  = $request->get_param( 'start_time' );
			$end_time    = $request->get_param( 'end_time' );
			$slot_time   = $request->get_param( 'slot_time' );
			$timezone    = $request->get_param( 'timezone' );
			$name        = $request->get_param( 'name' );
			$email       = $request->get_param( 'email' );
			$message     = $request->get_param( 'message' );
			$current_url = $request->get_param( 'current_url' );
			// We will add custom fields later.
			$fields            = $request->get_param( 'fields' );
			$additional_guests = $request->get_param( 'additional_guests' ) ?? array();

			if ( empty( $name ) ) {
				return new WP_Error( 'rest_booking_error', 'Attendee name is required', array( 'status' => 400 ) );
			}

			if ( empty( $email ) ) {
				return new WP_Error( 'rest_booking_error', 'Attendee email is required', array( 'status' => 400 ) );
			}

			$start_time = new \DateTime( $start_time, new \DateTimeZone( $timezone ) );
			$end_time   = new \DateTime( $end_time, new \DateTimeZone( $timezone ) );

			if ( ! $start_time || ! $end_time ) {
				return new WP_Error( 'rest_booking_error', 'Invalid date format', array( 'status' => 400 ) );
			}

			$guest_data = array(
				'name'  => $name,
				'email' => $email,
			);

			if ( get_current_user_id() ) {
				$guest_data['user_id'] = get_current_user_id();
			}

			$bookings = array();
			$event    = Event_Model::find( $event_id );

			if ( 'collective' === $event->type ) {
				$teamMembers = $event->calendar->teamMembers;
				foreach ( $teamMembers as $teamMember ) {
					$booking    = $this->book_event_slot( $event, $teamMember, $start_time, $slot_time, $timezone, $guest_data, $additional_guests );
					$bookings[] = $booking;
				}
			} else {
				$booking    = $this->book_event_slot( $event, $event->calendar_id, $start_time, $slot_time, $timezone, $guest_data, $additional_guests );
				$bookings[] = $booking;
			}

			return new WP_REST_Response( $bookings, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_booking_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Book an event slot.
	 *
	 * @param Event_Model $event The event being booked.
	 * @param int         $calendar_id The calendar ID.
	 * @param \DateTime   $start_date The start date/time of the booking.
	 * @param int         $duration The duration of the booking in minutes.
	 * @param string      $timezone The timezone of the booking.
	 * @param array       $guest_data The invitees for the booking.
	 * @param array       $additional_guests The additional guests for the booking.
	 *
	 * @return Booking_Model
	 * @throws \Exception If booking fails.
	 */
	protected function book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $guest_data, $additional_guests ) {
		$guest = Guest_Model::create( $guest_data );

		if ( ! $guest ) {
			throw new \Exception( __( 'Failed to create guest', 'quillbooking' ) );
		}

		$slot_start = clone $start_date;
		$slot_start->setTimezone( new \DateTimeZone( 'UTC' ) );
		$slot_end = clone $slot_start;
		$slot_end->modify( "+{$duration} minutes" );

		$booking              = new Booking_Model();
		$booking->event_id    = $event->id;
		$booking->calendar_id = $calendar_id;
		$booking->start_time  = $slot_start->format( 'Y-m-d H:i:s' );
		$booking->end_time    = $slot_end->format( 'Y-m-d H:i:s' );
		$booking->status      = 'scheduled';
		$booking->event_url   = home_url();
		$booking->source      = 'event-page';
		$booking->slot_time   = $duration;
		$booking->guest_id    = $guest->id;
		$booking->save();

		if ( ! $booking->id ) {
			throw new \Exception( __( 'Failed to book', 'quillbooking' ) );
		}

		$booking->timezone = $timezone;
		if ( ! $booking->save() ) {
			$guest->delete();
			throw new \Exception( __( 'Failed to update booking with guest ID', 'quillbooking' ) );
		}

		$guest->booking_id = $booking->id;
		if ( ! $guest->save() ) {
			$booking->delete();
			throw new \Exception( __( 'Failed to book', 'quillbooking' ) );
		}

		if ( 'group' !== $booking->event->type ) {
			$additional_guests = array_filter(
				$additional_guests,
				function( $guest ) {
					return is_email( sanitize_email( $guest ) );
				}
			);

			if ( ! empty( $additional_guests ) ) {
				$booking->meta()->create(
					array(
						'meta_key'   => 'additional_guests',
						'meta_value' => $additional_guests,
					)
				);
			}
		}

		$booking->logs()->create(
			array(
				'status'  => 'open',
				'type'    => 'info',
				'source'  => 'system',
				'message' => __( 'Booking created', 'quillbooking' ),
				'details' => sprintf( __( 'Booking created by %s', 'quillbooking' ), get_current_user() ),
			)
		);

		return $booking;
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

			$booking->load( 'guest' );

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
			$id         = $request->get_param( 'id' );
			$status     = $request->get_param( 'status' );
			$start_time = $request->get_param( 'start_time' );
			$end_time   = $request->get_param( 'end_time' );

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
