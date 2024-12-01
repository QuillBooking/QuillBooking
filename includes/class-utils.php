<?php
/**
 * Utils: class Utils
 * This class is responsible for handling the utility functions
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

/**
 * Utils class
 */
class Utils {

	/**
	 * Get timezones list
	 *
	 * @return array
	 */
	public static function get_timezones() {
		$timezones      = timezone_identifiers_list();
		$timezones_list = array();

		foreach ( $timezones as $timezone ) {
			$timezones_list[ $timezone ] = $timezone;
		}

		return $timezones_list;
	}

	/**
	 * Generate hash key
	 *
	 * @return string
	 */
	public static function generate_hash_key() {
		return md5( uniqid( rand(), true ) );
	}

	/**
	 * Create a DateTime object in a specified timezone and optionally convert it to UTC.
	 *
	 * @param string|int $datetime A date/time string or timestamp to be converted.
	 * @param string     $from_timezone The timezone of the input date/time.
	 * @param bool       $to_utc Whether to convert the DateTime object to UTC.
	 *
	 * @return \DateTime The resulting DateTime object.
	 */
	public static function create_date_time( $datetime, $from_timezone, $to_utc = true ) {
		// Handle input as timestamp if numeric
		$is_timestamp = is_numeric( $datetime );
		$date         = $is_timestamp
			? new \DateTime( '@' . $datetime, new \DateTimeZone( 'UTC' ) )
			: new \DateTime( $datetime, new \DateTimeZone( $from_timezone ) );

		// Set timezone if not a timestamp
		if ( ! $is_timestamp ) {
			$date->setTimezone( new \DateTimeZone( $from_timezone ) );
		}

		// Optionally convert to UTC
		if ( $to_utc ) {
			$date->setTimezone( new \DateTimeZone( 'UTC' ) );
		}

		return $date;
	}
}
