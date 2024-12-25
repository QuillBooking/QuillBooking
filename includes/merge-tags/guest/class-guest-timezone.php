<?php
/**
 * Guest timezone
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Guest;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Guest timezone Merge Tag
 */
class Guest_Timezone extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Guest Timezone';

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
	public $group = 'guest';

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking
	 * @param array         $options
	 * @return string
	 */
	public function get_value( $booking, $options = array() ) {
		return $booking->timezone;
	}
}
