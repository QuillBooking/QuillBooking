<?php
/**
 * Class Guests_Table
 *
 * This class is responsible for identifying the guests table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Guests Table class
 */
class Guests_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'guests';

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
		 * user_id: int(11) Can be NULL
		 * email: varchar(255) NOT NULL
		 * name: varchar(255) NOT NULL
		 * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		 * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id int(11) NOT NULL AUTO_INCREMENT,
        booking_id int(11) NOT NULL,
		user_id int(11),
        email varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY booking_id (booking_id)';

		return $query;
	}
}
