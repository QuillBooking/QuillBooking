<?php
/**
 * Reschedule URL Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Reschedule URL Merge Tag
 */
class Reschedule_URL extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Reschedule URL';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'reschedule_url';

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
	public function get_value( $booking, $options = array() ) {
		return $booking->getRescheduleUrl();
	}
}
