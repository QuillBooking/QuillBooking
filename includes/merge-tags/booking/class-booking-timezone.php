<?php
/**
 * Booking Timezone
 *
 * Booking Timezone Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Booking Timezone Merge Tag
 */
class Booking_Timezone extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking Timezone';

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
		return $booking->timezone;
	}
}
