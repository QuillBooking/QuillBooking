<?php
/**
 * Class Booking_Log_Table
 *
 * This class is responsible for identifying the booking log table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Booking Log Table class
 */
class Booking_Log_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'booking_log';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		 * Columns:
		 *
		 * id: int(11) NOT NULL AUTO_INCREMENT
		 * booking_id: int(11) NOT NULL
		 * status: varchar(255) NOT NULL
		 * type: varchar(255) NOT NULL
		 * source: varchar(255) NOT NULL
		 * message: varchar(255) NOT NULL
		 * details: text Can be NULL
		 * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		 * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id int(11) NOT NULL AUTO_INCREMENT,
        booking_id int(11) NOT NULL,
        status varchar(255) NOT NULL,
        type varchar(255) NOT NULL,
        source varchar(255) NOT NULL,
        message varchar(255) NOT NULL,
        details text,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY booking_id (booking_id)';

		return $query;
	}
}
