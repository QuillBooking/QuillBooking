<?php
/**
 * Booking Cancel URL Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Booking Cancel URL Merge Tag
 */
class Booking_Cancel_URL extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking Cancel URL';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'cancel_url';

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
		if (! $booking instanceof Booking_Model) {
			return ''; // Return an empty string if the booking is invalid or null
		}
		return $booking->getCancelUrl();
	}
}
