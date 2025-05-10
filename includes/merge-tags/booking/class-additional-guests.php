<?php
/**
 * Additional Guests Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use Illuminate\Support\Arr;
use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Additional Guests Merge Tag
 */
class Additional_Guests extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Additional Guests';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'additional_guests';

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
		if (! isset($booking->fields) || ! is_array($booking->fields)) {
			return '';
		}

		$additional_guests = Arr::get($booking->fields, 'additional_guests', array());

		if (! is_array($additional_guests) || empty($additional_guests)) {
			return '';
		}

		// Cast each value to string just in case
		$guest_names = array_map('strval', $additional_guests);

		return implode(', ', $guest_names);
	}
}
