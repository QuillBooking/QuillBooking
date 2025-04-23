<?php
/**
 * Booking Details URL Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Booking Details URL Merge Tag
 */
class Booking_Details_URL extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking Details URL (Admin)';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'details_url';

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
		if (! $booking instanceof Booking_Model) {
			return ''; 
		}
		return method_exists($booking, 'getDetailsUrl') ? $booking->getDetailsUrl() : '';
	}
}
