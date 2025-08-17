<?php
/**
 * Class Availability
 *
 * This class is responsible for identifying the availability table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Availability Table class
 */
class Availability_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'availability';

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
		  * user_id: int(11) NOT NULL
		  * name: varchar(255) NOT NULL
		  * value: longtext NOT NULL
		  * timezone: varchar(255) NOT NULL
		  * is_default: tinyint(1) NOT NULL Default: 0
		  * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		  * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		  */
		$query = 'id int(11) NOT NULL AUTO_INCREMENT,
		user_id int(11) NOT NULL,
		name varchar(255) NOT NULL,
		value longtext NOT NULL,
		timezone varchar(255) NOT NULL,
		is_default tinyint(1) NOT NULL DEFAULT 0,
		created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY user_id (user_id)';

		return $query;
	}
}
