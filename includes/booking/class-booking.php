<?php

/**
 * Class Booking
 *
 * This class is responsible for handling the booking
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use QuillBooking\Traits\Singleton;

/**
 * Booking class
 */
class Booking {


	use Singleton;

	/**
	 * Constructor
	 */
	public function __construct() {
		 $this->load_classes();
	}

	/**
	 * Load classes
	 */
	public function load_classes() {
		// Load email notifications
		new Email_Notifications();

		// Load booking tasks
		new Booking_Tasks();

		// Load booking actions
		new Booking_Actions();

		// Load booking ajax
		new Booking_Ajax();

		new Booking_Jobs();
	}
}
