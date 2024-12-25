<?php
/**
 * Guest note
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Guest;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;
use Illuminate\Support\Arr;

/**
 * Guest note Merge Tag
 */
class Guest_Note extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Guest Note';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'note';

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
		$message = Arr::get( $booking->fields, 'message', '' );
		if ( empty( $message ) ) {
			return '';
		}

		return $message;
	}
}
