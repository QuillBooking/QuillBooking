<?php
/**
 * Host timezone
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Host;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Host timezone Merge Tag
 */
class Host_Timezone extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Host Timezone';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'timezone';

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
		return isset($booking) && isset($booking->calendar) && isset($booking->calendar->timezone)
			? $booking->calendar->timezone
			: '';
	}
}
