<?php

namespace QuillBooking;

use WP_Error;
use WP_REST_Response;

class Availability_service {
	/**
	 * Create a new availability schedule
	 *
	 * @since 1.0.0
	 *
	 * @param int    $user_id       WordPress user ID associated with the availability
	 * @param string $name          Unique name for the availability schedule
	 * @param array  $weekly_hours  Weekly availability structure (day-based time slots)
	 * @param array  $override      Special overrides for specific dates (format: ['YYYY-MM-DD' => [time slots]])
	 * @param string $timezone      Valid PHP timezone identifier (default: 'UTC')
	 *
	 * @return WP_REST_Response|WP_Error Returns availability details on success, WP_Error on validation failure
	 */
	public function create_availability( $user_id, $name, $weekly_hours, $override = array(), $timezone = 'UTC', $default = false ) {
		$id = substr( md5( uniqid( rand(), true ) ), 0, 8 );

		if ( ! $name ) {
			return new WP_Error( 'rest_availability_invalid_name', __( 'Invalid availability name.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		if ( empty( $weekly_hours ) ) {
			return new WP_Error( 'rest_availability_invalid_weekly_hours', __( 'Invalid weekly hours.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		if ( empty( $timezone ) ) {
			return new WP_Error( 'rest_availability_invalid_timezone', __( 'Invalid timezone.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		$availability = Availabilities::add_availability(
			array(
				'id'           => $id,
				'user_id'      => $user_id,
				'name'         => $name,
				'weekly_hours' => $weekly_hours,
				'override'     => $override,
				'timezone'     => $timezone,
				'is_default'   => $default,
			)
		);

		return new WP_REST_Response( $availability, 201 );

	}

}
