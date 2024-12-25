<?php
/**
 * Class Confirmation_URL
 *
 * This class is responsible for handling the confirm URL
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Confirmation URL Merge Tag
 */
class Confirm_URL extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Confirmation URL';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'confirm_url';

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
		return $booking->getConfirmUrl();
	}
}
