<?php
/**
 * Class Events_Table
 *
 * This class is responsible for identifying the events table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Events Table class
 */
class Events_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'events';

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
		 * calendar_id: int(11) NOT NULL
		 * user_id: int(11) NOT NULL
		 * name: varchar(255) NOT NULL
		 * description: text Can be NULL
		 * slug: varchar(255) NOT NULL
		 * status: varchar(255) NOT NULL Default: 'active'
		 * type: varchar(255) NOT NULL Default: 'one-to-one'
		 * duration: int(11) NOT NULL Default: 30
		 * color: varchar(255) NOT NULL Default: '#0099ff'
		 * visibility: varchar(255) NOT NULL Default: 'public'
		 * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		 * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = "id int(11) NOT NULL AUTO_INCREMENT,
        hash_id varchar(255) NOT NULL,
        calendar_id int(11) NOT NULL,
        user_id int(11) NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        slug varchar(255) NOT NULL,
        status varchar(255) NOT NULL Default 'active',
        type varchar(255) NOT NULL Default 'one-to-one',
		duration int(11) NOT NULL Default 30,
		color varchar(255) NOT NULL Default '#0099ff',
		visibility varchar(255) NOT NULL Default 'public',
        created_at timestamp NOT NULL Default CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL Default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY calendar_id (calendar_id),
        KEY user_id (user_id),
        KEY hash_id (hash_id),
        KEY slug (slug)";

		return $query;
	}
}
