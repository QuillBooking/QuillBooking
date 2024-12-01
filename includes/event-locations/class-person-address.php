<?php
/**
 * Class Person_Address
 *
 * This class is responsible for handling the person address
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Person Address class
 */
class Person_Address extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Person Address';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'person_address';

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_admin_fields() {
		return array(
			'location'           => array(
				'label'    => __( 'Person Address', 'quillbooking' ),
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
