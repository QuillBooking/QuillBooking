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
use WP_User;
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
	public static function get_core_capabilities() {
		$capabilities = array(
			// Calendar Capabilities
			'calendars'    => array(
				'title'        => __( 'Calendar Management', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_manage_own_calendars' => __( 'Manage only the user\'s own calendars', 'quillbooking' ),
					'quillbooking_read_all_calendars'   => __( 'Read access to all calendars across users', 'quillbooking' ),
					'quillbooking_manage_all_calendars' => __( 'Manage all calendars created by all users', 'quillbooking' ),
				),
			),

			// Booking Capabilities
			'bookings'     => array(
				'title'        => __( 'Booking Access', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_read_own_bookings'   => __( 'Read only the user\'s own bookings', 'quillbooking' ),
					'quillbooking_read_all_bookings'   => __( 'Read access to all bookings', 'quillbooking' ),
					'quillbooking_manage_own_bookings' => __( 'Manage only the user\'s own bookings', 'quillbooking' ),
					'quillbooking_manage_all_bookings' => __( 'Manage all bookings across calendars', 'quillbooking' ),
				),
			),

			// Availability Capabilities
			'availability' => array(
				'title'        => __( 'Availability Management', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_read_own_availability'   => __( 'Read only the user\'s own availability', 'quillbooking' ),
					'quillbooking_read_all_availability'   => __( 'Read access to all availability schedules across users', 'quillbooking' ),
					'quillbooking_manage_own_availability' => __( 'Manage only the user\'s own availability schedules', 'quillbooking' ),
					'quillbooking_manage_all_availability' => __( 'Manage all availability schedules for all users', 'quillbooking' ),
				),
			),
		);

		return $capabilities;
	}

	/**
	 * Get role capabilities.
	 *
	 * @param string $role The role name.
	 *
	 * @return array
	 */
	public static function get_role_capabilities( $role ) {
		$role_capabilities = array(
			'admin'  => array(
				'quillbooking_read_all_calendars',
				'quillbooking_manage_all_calendars',
				'quillbooking_read_all_bookings',
				'quillbooking_manage_all_bookings',
				'quillbooking_read_all_availability',
				'quillbooking_manage_all_availability',
				'manage_quillbooking',
			),
			'member' => array(
				'quillbooking_manage_own_calendars',
				'quillbooking_read_own_bookings',
				'quillbooking_manage_own_bookings',
				'quillbooking_read_own_availability',
				'quillbooking_manage_own_availability',
				'manage_quillbooking',
			),
		);

		return isset( $role_capabilities[ $role ] ) ? $role_capabilities[ $role ] : array();
	}

	/**
	 * Check if current user has capability (with super admin support).
	 *
	 * @since 1.0.0
	 *
	 * @param string $capability The capability to check.
	 *
	 * @return bool
	 */
	public static function current_user_can( $capability ) {
		// Super admins in multisite have all capabilities
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		return current_user_can( $capability );
	}

	/**
	 * Get current user capabilities.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_current_user_capabilities() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return array();
		}

		// Super admins get all capabilities
		if ( is_multisite() && is_super_admin( $user_id ) ) {
			$all_caps = self::get_all_capabilities();
			return array_fill_keys( $all_caps, true );
		}

		$user                      = new WP_User( $user_id );
		$capabilities              = $user->get_role_caps();
		$quillbooking_capabilities = self::get_all_capabilities();

		return array_intersect_key( $capabilities, array_flip( $quillbooking_capabilities ) );
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

		$all_capabilities = array( 'manage_quillbooking' ); // Add the core capability

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

		$wp_roles->add_cap( 'administrator', 'manage_quillbooking' );

		$capabilities = self::get_core_capabilities();

		foreach ( $capabilities as $group ) {
			foreach ( $group['capabilities'] as $capability => $description ) {
				$wp_roles->add_cap( 'administrator', $capability );
			}
		}

		// In multisite, also handle super admin capabilities
		if ( is_multisite() ) {
			self::handle_super_admin_capabilities();
		}
	}

	/**
	 * Handle super admin capabilities in multisite.
	 *
	 * @since 1.0.0
	 */
	private static function handle_super_admin_capabilities() {
		// Add filter to ensure super admins always have access
		add_filter( 'user_has_cap', array( __CLASS__, 'grant_super_admin_capabilities' ), 10, 4 );
	}

	/**
	 * Grant super admin capabilities in multisite.
	 *
	 * @since 1.0.0
	 *
	 * @param array   $allcaps Array of key/value pairs where keys represent a capability name
	 *                         and boolean values represent whether the user has that capability.
	 * @param array   $caps    Required primitive capabilities for the requested capability.
	 * @param array   $args    Arguments that accompany the requested capability check.
	 * @param WP_User $user    The user object.
	 *
	 * @return array
	 */
	public static function grant_super_admin_capabilities( $allcaps, $caps, $args, $user ) {
		// Only apply to super admins in multisite
		if ( ! is_multisite() || ! is_super_admin( $user->ID ) ) {
			return $allcaps;
		}

		// Get all our plugin capabilities
		$plugin_capabilities = self::get_all_capabilities();

		// Check if any of the required caps are our plugin capabilities
		foreach ( $caps as $cap ) {
			if ( in_array( $cap, $plugin_capabilities, true ) ) {
				$allcaps[ $cap ] = true;
			}
		}

		return $allcaps;
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
		// Super admins can manage everything
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

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
		// Super admins can read everything
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

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
		// Super admins can manage everything
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

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
		// Super admins can read everything
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

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
		// Super admins can manage everything
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		if ( current_user_can( 'quillbooking_manage_all_bookings' ) ) {
			return true;
		}

		$booking = Booking_Model::find( $booking_id );

		if ( ! $booking ) {
			return false;
		}
		if ( $booking->relationLoaded( 'event' ) || $booking->load( 'event' ) ) { // Ensure event is loaded
			return $booking->event && $booking->event->user_id === get_current_user_id();
		}

		return false;
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
		// Super admins can read everything
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}

		if ( current_user_can( 'quillbooking_read_all_bookings' ) ) {
			return true;
		}
		$booking = Booking_Model::with( 'event' )->find( $booking_id );
		if ( ! $booking ) {
			return false; // Keep this check for non-admins
		}
		if ( current_user_can( 'quillbooking_read_own_bookings' ) && $booking->event && $booking->event->user_id === get_current_user_id() ) {
			return true;
		}
		return false;
	}

	/**
	 * Remove capabilities when deactivating.
	 *
	 * @since 1.0.0
	 */
	public static function remove_capabilities() {
		global $wp_roles;

		if ( ! class_exists( 'WP_Roles' ) ) {
			return;
		}

		if ( ! isset( $wp_roles ) ) {
			$wp_roles = new WP_Roles(); // @codingStandardsIgnoreLine
		}

		$wp_roles->remove_cap( 'administrator', 'manage_quillbooking' );

		$capabilities = self::get_core_capabilities();

		// Remove capabilities from administrator role
		foreach ( $capabilities as $group ) {
			foreach ( $group['capabilities'] as $capability => $description ) {
				$wp_roles->remove_cap( 'administrator', $capability );
			}
		}

		// Remove the filter if it was added
		remove_filter( 'user_has_cap', array( __CLASS__, 'grant_super_admin_capabilities' ), 10 );
	}
}