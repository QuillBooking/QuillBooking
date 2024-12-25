<?php
/**
 * Class Booking_Orders_Table
 *
 * This class is responsible for creating the booking_orders table
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

 namespace QuillBooking\Database\Migrations;

 use QuillBooking\Abstracts\Migration;

/**
 * Booking Orders Table class
 */
class Booking_Orders_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'booking_orders';

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
		 * items: text Can be NULL
		 * discount: decimal(10,2) NOT NULL
		 * total: decimal(10,2) NOT NULL
		 * currency: varchar(255) NOT NULL
		 * payment_method: varchar(255) NOT NULL
		 * status: varchar(255) NOT NULL
		 * created_at: datetime NOT NULL
		 * updated_at: datetime NOT NULL
		 */
		$query = 'id int(11) NOT NULL AUTO_INCREMENT,
            booking_id int(11) NOT NULL,
            items text,
            discount decimal(10,2) NOT NULL DEFAULT 0.00,
            total decimal(10,2) NOT NULL,
            currency varchar(255) NOT NULL,
            payment_method varchar(255) NOT NULL,
            status varchar(255) NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY booking_id (booking_id)';

		return $query;
	}
}


