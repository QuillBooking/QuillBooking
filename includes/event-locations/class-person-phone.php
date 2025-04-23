<?php
/**
 * Class Person_Phone
 *
 * This class is responsible for handling the person phone
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Person Phone class
 */
class Person_Phone extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Person Phone';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'person_phone';

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_admin_fields() {
		return array(
			'phone'              => array(
				'label'    => __( 'Person Phone', 'quillbooking' ),
				'type'     => 'text',
				'required' => true,
			),
			'display_on_booking' => array(
				'label'    => __( 'Display on Booking', 'quillbooking' ),
				'desc'     => __( 'Display on booking page', 'quillbooking' ),
				'type'     => 'checkbox',
				'required' => true,
			),
		);
	}
}
