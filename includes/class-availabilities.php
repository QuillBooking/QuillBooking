<?php
/**
 * Class Availabilities
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

use Illuminate\Support\Arr;

/**
 * Availabilities class
 */
class Availabilities {

	/**
	 * Option Name
	 *
	 * @var string
	 */
	public static $option_name = 'quillbooking_availabilities';

	/**
	 * Get Availabilities
	 *
	 * @return array
	 */
	public static function get_availabilities() {
		$availabilities = get_option( self::$option_name, array() );

		return $availabilities;
	}

	/**
	 * Get Availability
	 *
	 * @param string $id
	 *
	 * @return array
	 */
	public static function get_availability( $id ) {
		$availabilities = self::get_availabilities();

		return Arr::first(
			$availabilities,
			function( $availability ) use ( $id ) {
				return $id === $availability['id'];
			}
		);
	}

	/**
	 * Get User Availabilities
	 *
	 * @param string $id
	 *
	 * @return array
	 */
	public static function get_user_availabilities( $id ) {
		$availabilities = self::get_availabilities();

		return array_filter(
			$availabilities,
			function( $availability ) use ( $id ) {
				return $id === $availability['user_id'];
			}
		);
	}

	/**
	 * Add Availability
	 *
	 * @param array $availability
	 *
	 * @return boolean
	 */
	public static function add_availability( $availability ) {
		$availabilities = self::get_availabilities();

		$availabilities[] = $availability;

		update_option( self::$option_name, $availabilities );

		return $availability;
	}

	/**
	 * Update Availability
	 *
	 * @param array $availability
	 *
	 * @return boolean
	 */
	public static function update_availability( $availability ) {
		$availabilities         = self::get_availabilities();
		$updated_availabilities = array_map(
			function( $item ) use ( $availability ) {
				return $item['id'] === $availability['id'] ? $availability : $item;
			},
			$availabilities
		);

		return update_option( self::$option_name, $updated_availabilities );
	}

	/**
	 * Delete Availability
	 *
	 * @param string $id
	 *
	 * @return boolean
	 */
	public static function delete_availability( $id ) {
		$availabilities         = self::get_availabilities();
		$updated_availabilities = array_filter(
			$availabilities,
			function( $availability ) use ( $id ) {
				return $id !== $availability['id'];
			}
		);

		return update_option( self::$option_name, $updated_availabilities );
	}

	/**
	 * Get default availability
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_default_availability() {
		return Arr::first(
			self::get_availabilities(),
			function( $availability ) {
				return Arr::get( $availability, 'is_default', false ) === true;
			}
		);
	}

	/**
	 * Get default availability
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_system_availability() {
		return array(
			'id'           => 'default',
			'is_default'   => true,
			'user_id'      => 'system',
			'name'         => __( 'Default', 'quill-booking' ),
			'weekly_hours' => array(
				'monday'    => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
				'tuesday'   => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
				'wednesday' => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
				'thursday'  => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
				'friday'    => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
				'saturday'  => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => true,
				),
				'sunday'    => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => true,
				),
			),
			'override'     => array(),
			'timezone'     => 'Africa/Cairo',
		);
	}

	/**
	 * Add default availability if not exists
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function add_default_availability() {
		$availabilities = self::get_availabilities();

		if ( empty( $availabilities ) ) {
			$default_availability = self::get_system_availability();

			self::add_availability( $default_availability );
		}
	}
}
