<?php
/**
 * Class Attendee_Phone
 *
 * This class is responsible for handling the attendee phone
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Attendee Phone class
 */
class Attendee_Phone extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Attendee Phone';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'attendee_phone';

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'phone' => array(
				'label'       => __( 'Your Phone', 'quillbooking' ),
				'type'        => 'text',
				'required'    => true,
				'group'       => 'system',
				'placeholder' => __( 'Enter your phone', 'quillbooking' ),
				'order'       => 4,
			),
		);
	}
}
