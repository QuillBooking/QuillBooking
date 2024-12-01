<?php
/**
 * Class Calendars Table
 *
 * This class is responsible for identifying the calendars table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Calendars Table class
 */
class Calendars_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'calendars';

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
		 * hash_id: varchar(255) NOT NULL
		 * user_id: int(11) NOT NULL
		 * name: varchar(255) NOT NULL
		 * description: text Can be NULL
		 * slug: varchar(255) NOT NULL
		 * status: varchar(255) NOT NULL Default: 'active'
		 * type: varchar(255) NOT NULL Default: 'host'
		 * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		 * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = "id int(11) NOT NULL AUTO_INCREMENT,
        hash_id varchar(255) NOT NULL,
        user_id int(11) NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        slug varchar(255) NOT NULL,
        status varchar(255) NOT NULL Default 'active',
        type varchar(255) NOT NULL Default 'host',
        created_at timestamp NOT NULL Default CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL Default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY hash_id (hash_id),
        KEY slug (slug),
        KEY user_id (user_id)";

		return $query;
	}
}
