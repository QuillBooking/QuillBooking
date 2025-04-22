<?php
/**
 * Booking hash
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Booking hash Merge Tag
 */
class Booking_Hash extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking Unique Hash';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'hash';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'booking';

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking
	 * @param array         $options
	 * @return string
	 */
	public function get_value($booking, $options = array())
	{
		if (!isset($booking->hash_id) || empty($booking->hash_id)) {
			return '';
		}
		return $booking->hash_id;
	}
}
