<?php
/**
 * Capabilities: class Capabilities
 *
 * @package QuillBooking
 * @subpackage Capabilities
 * @since 1.0.0
 */

namespace QuillBooking;

use Illuminate\Support\Arr;
use WP_Roles;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Booking_Model;

/**
 * Class Capabilities is for getting capabilities and assigning them to user roles.
 */
class Capabilities {

	/**
	 * Get capabilities.
	 *
	 * @since 1.0.0
	 *
	 * @return array The core capabilities
	 */
	private static function get_core_capabilities() {
		$capabilities = array(
			// Calendar Capabilities
			'calendars'    => array(
				'title'        => __( 'Calendar Management', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_manage_own_calendars' => __( 'Manage only the user’s own calendars', 'quillbooking' ),
					'quillbooking_read_all_calendars'   => __( 'Read access to all calendars across users', 'quillbooking' ),
					'quillbooking_manage_all_calendars' => __( 'Manage all calendars created by all users', 'quillbooking' ),
				),
			),

			// Booking Capabilities
			'bookings'     => array(
				'title'        => __( 'Booking Access', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_read_own_bookings'   => __( 'Read only the user’s own bookings', 'quillbooking' ),
					'quillbooking_read_all_bookings'   => __( 'Read access to all bookings', 'quillbooking' ),
					'quillbooking_manage_own_bookings' => __( 'Manage only the user’s own bookings', 'quillbooking' ),
					'quillbooking_manage_all_bookings' => __( 'Manage all bookings across calendars', 'quillbooking' ),
				),
			),

			// Availability Capabilities
			'availability' => array(
				'title'        => __( 'Availability Management', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_read_own_availability'   => __( 'Read only the user’s own availability', 'quillbooking' ),
					'quillbooking_read_all_availability'   => __( 'Read access to all availability schedules across users', 'quillbooking' ),
					'quillbooking_manage_own_availability' => __( 'Manage only the user’s own availability schedules', 'quillbooking' ),
					'quillbooking_manage_all_availability' => __( 'Manage all availability schedules for all users', 'quillbooking' ),
				),
			),
		);

		return $capabilities;
	}

	/**
	 * Get all capabilities.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_all_capabilities() {
		$capabilities = self::get_core_capabilities();

		$all_capabilities = array();

		foreach ( $capabilities as $group ) {
			$all_capabilities = array_merge( $all_capabilities, array_keys( $group['capabilities'] ) );
		}

		return $all_capabilities;
	}

	/**
	 * Get not admin capabilities.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_basic_capabilities() {
		$capabilities = self::get_core_capabilities();

		$basic_capabilities = array();

		foreach ( $capabilities as $group ) {
			foreach ( $group['capabilities'] as $capability => $description ) {
				if ( strpos( $capability, 'own' ) !== false ) {
					$basic_capabilities[] = $capability;
				}
			}
		}

		return $basic_capabilities;
	}

	/**
	 * Assign capabilities for user roles.
	 *
	 * @since 1.0.0
	 */
	public static function assign_capabilities_for_user_roles() {
		global $wp_roles;

		if ( ! class_exists( 'WP_Roles' ) ) {
			return;
		}

		if ( ! isset( $wp_roles ) ) {
			$wp_roles = new WP_Roles(); // @codingStandardsIgnoreLine
		}

		$capabilities = self::get_core_capabilities();

		foreach ( $capabilities as $group ) {
			foreach ( $group['capabilities'] as $capability => $description ) {
				$wp_roles->add_cap( 'administrator', $capability );
			}
		}
	}

	/**
	 * User can manage calendars.
	 *
	 * @since 1.0.0
	 *
	 * @param int $calendar_id The calendar ID.
	 *
	 * @return bool
	 */
	public static function can_manage_calendar( $calendar_id ) {
		$calendar = Calendar_Model::find( $calendar_id );

		if ( ! $calendar ) {
			return true;
		}

		if ( $calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Can read calendar.
	 *
	 * @since 1.0.0
	 *
	 * @param int $calendar_id The calendar ID.
	 *
	 * @return bool
	 */
	public static function can_read_calendar( $calendar_id ) {
		$calendar = Calendar_Model::find( $calendar_id );

		if ( ! $calendar ) {
			return true;
		}

		if ( $calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'quillbooking_read_all_calendars' );
	}

	/**
	 * User can manage events.
	 *
	 * @since 1.0.0
	 *
	 * @param int $event_id The event ID.
	 *
	 * @return bool
	 */
	public static function can_manage_event( $event_id ) {
		$event = Event_Model::find( $event_id );

		if ( ! $event ) {
			return true;
		}

		if ( $event->calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'quillbooking_manage_all_calendars' );
	}

	/**
	 * Can read event.
	 *
	 * @since 1.0.0
	 *
	 * @param int $event_id The event ID.
	 *
	 * @return bool
	 */
	public static function can_read_event( $event_id ) {
		$event = Event_Model::find( $event_id );

		if ( ! $event ) {
			return false;
		}

		if ( $event->calendar->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'quillbooking_read_all_calendars' );
	}

	/**
	 * User can manage bookings.
	 *
	 * @since 1.0.0
	 *
	 * @param int $booking_id The booking ID.
	 *
	 * @return bool
	 */
	public static function can_manage_booking( $booking_id ) {
		$booking = Booking_Model::find( $booking_id );

		if ( ! $booking ) {
			return false;
		}

		return $booking->user_id === get_current_user_id() || current_user_can( 'quillbooking_manage_all_bookings' );
	}

	/**
	 * Can read booking.
	 *
	 * @since 1.0.0
	 *
	 * @param int $booking_id The booking ID.
	 *
	 * @return bool
	 */
	public static function can_read_booking( $booking_id ) {
		$booking = Booking_Model::find( $booking_id );

		if ( ! $booking ) {
			return false;
		}

		if ( $booking->user_id === get_current_user_id() ) {
			return true;
		}

		return current_user_can( 'quillbooking_read_all_bookings' );
	}
}
