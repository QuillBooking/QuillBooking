<?php
/**
 * Booking Location Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Booking Location Merge Tag
 */
class Booking_Location extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking Location';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'event_location';

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
	public function get_value($booking, $options = array())
	{
		if (empty($booking->location)) {
			return ''; 
		}
		return $booking->location;
	}
}
