<?php
/**
 * Class Booking_Meta_Table
 *
 * This class is responsible for identifying the booking meta table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Booking Meta Table class
 */
class Booking_Meta_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'booking_meta';

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
		 * meta_key: varchar(255) NOT NULL
		 * meta_value: text Can be NULL
		 * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		 * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id int(11) NOT NULL AUTO_INCREMENT,
        booking_id int(11) NOT NULL,
        meta_key varchar(255) NOT NULL,
        meta_value text,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY booking_id (booking_id)';

		return $query;
	}
}
