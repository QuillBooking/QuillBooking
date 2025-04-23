<?php
/**
 * Guest email
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Guest;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Guest email Merge Tag
 */
class Guest_Email extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Guest Email';

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
	public $group = 'guest';

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking
	 * @param array         $options
	 * @return string
	 */
	public function get_value( $booking, $options = array() ) {
		return isset($booking->guest->email) ? $booking->guest->email : '';
	}
}
