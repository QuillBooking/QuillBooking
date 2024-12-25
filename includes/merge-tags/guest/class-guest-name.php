<?php
/**
 * Guest name
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Guest;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Guest name Merge Tag
 */
class Guest_Name extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Guest Name';

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
	public $group = 'guest';

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking
	 * @param array         $options
	 * @return string
	 */
	public function get_value( $booking, $options = array() ) {
		return $booking->guest->name;
	}
}
