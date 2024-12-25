<?php
/**
 * Event Name Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Event Name Merge Tag
 */
class Event_Name extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Event Name';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'event_name';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'booking';

	/**
	 * Get Value
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param array         $options Options.
	 *
	 * @return string
	 */
	public function get_value( $booking, $options = array() ) {
		return $booking->event->name;
	}
}
