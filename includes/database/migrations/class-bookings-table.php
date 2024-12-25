<?php
/**
 * Class Bookings_Table
 *
 * This class is responsible for identifying the bookings table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database\Migrations;

use QuillBooking\Abstracts\Migration;

/**
 * Bookings Table class
 */
class Bookings_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'bookings';

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
		 * event_id: int(11) NOT NULL
		 * calendar_id: int(11) NOT NULL
		 * guest_id: int(11) NOT NULL
		 * start_time: datetime NOT NULL
		 * end_time: datetime NOT NULL
		 * slot_time: int(11) NOT NULL
		 * source: varchar(255) NOT NULL
		 * status: varchar(255) NOT NULL
		 * cancelled_by: varchar(255) NOT NULL
		 * event_url: varchar(255) NOT NULL
		 * created_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP
		 * updated_at: timestamp NOT NULL Default: CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id int(11) NOT NULL AUTO_INCREMENT,
		hash_id varchar(255) NOT NULL,
		event_id int(11) NOT NULL,
		calendar_id int(11) NOT NULL,
		guest_id int(11) NOT NULL,
		start_time datetime NOT NULL,
		end_time datetime NOT NULL,
		slot_time int(11) NOT NULL,
		source varchar(255) NOT NULL,
		status varchar(255) NOT NULL,
		cancelled_by varchar(255) NOT NULL,
		event_url varchar(255) NOT NULL,
		created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY  (id),
		KEY event_id (event_id)';

		return $query;
	}
}
