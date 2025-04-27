<?php
/**
 * Host name
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Host;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Host name Merge Tag
 */
class Host_Name extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Host Name';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'name';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'host';

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking
	 * @param array         $options
	 * @return string
	 */
	public function get_value($booking, $options = array())
	{
		return isset($booking) && isset($booking->calendar) && isset($booking->calendar->name) ? $booking->calendar->name : '';
	}
}
