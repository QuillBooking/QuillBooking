<?php

/**
 * Host email
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Host;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Host email Merge Tag
 */
class Host_Email extends Merge_Tag
{

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Host Email';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'email';

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
		if (isset($booking) && isset($booking->calendar) && isset($booking->calendar->user) && isset($booking->calendar->user->user_email)) {
			return $booking->calendar->user->user_email;
		}

		return '';
	}
}
