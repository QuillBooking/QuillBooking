<?php
/**
 * Class Attendee_Address
 *
 * This class is responsible for handling the attendee address
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Attendee Address class
 */
class Attendee_Address extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Attendee Address';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'attendee_address';

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'address' => array(
				'label'       => __( 'Your Address', 'quillbooking' ),
				'type'        => 'text',
				'required'    => true,
				'group'       => 'system',
				'placeholder' => __( 'Enter your address', 'quillbooking' ),
				'order'       => 4,
			),
		);
	}
}
