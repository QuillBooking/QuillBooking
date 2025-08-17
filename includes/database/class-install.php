<?php
/**
 * Class Install
 * This class is responsible for handling the database installation
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database;

use QuillBooking\Capabilities;
use QuillBooking\Database\Migrations\Booking_Hosts_Table;
use QuillBooking\Database\Migrations\Calendars_Table;
use QuillBooking\Database\Migrations\Calendars_Meta_Table;
use QuillBooking\Database\Migrations\Events_Table;
use QuillBooking\Database\Migrations\Events_Meta_Table;
use QuillBooking\Database\Migrations\Bookings_Table;
use QuillBooking\Database\Migrations\Booking_Meta_Table;
use QuillBooking\Database\Migrations\Booking_Log_Table;
use QuillBooking\Database\Migrations\Guests_Table;
use QuillBooking\Database\Migrations\Tasks_Meta_Table;
use QuillBooking\Database\Migrations\Booking_Orders_Table;
use QuillBooking\Database\Migrations\Availability_Table;
use QuillBooking\Availabilities;

/**
 * Install class
 */
class Install {

	/**
	 * Install
	 *
	 * @since 1.0.0
	 */
	public static function install() {
		// Check if we are not already running this routine.
		if ( 'yes' === get_transient( 'quillbooking_installing' ) ) {
			return;
		}

		Capabilities::assign_capabilities_for_user_roles();
		Availabilities::add_default_availability();
		$tables = apply_filters(
			'quillbooking_database_tables',
			array(
				Calendars_Table::class,
				Calendars_Meta_Table::class,
				Events_Table::class,
				Events_Meta_Table::class,
				Bookings_Table::class,
				Booking_Meta_Table::class,
				Booking_Log_Table::class,
				Guests_Table::class,
				Tasks_Meta_Table::class,
				Booking_Orders_Table::class,
				Booking_Hosts_Table::class,
				Availability_Table::class,
			)
		);

		foreach ( $tables as $table => $class ) {
			if ( ! class_exists( $class ) ) {
				continue;
			}

			/** @var \QuillBooking\Database\Migrations\Migration $migration */
			$migration = new $class();
			$migration->run();
		}

		// If we made it till here nothing is running yet, lets set the transient now.
		set_transient( 'quillbooking_installing', 'yes', MINUTE_IN_SECONDS * 10 );
		delete_transient( 'quillbooking_installing' );
	}
}
