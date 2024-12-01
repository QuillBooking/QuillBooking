<?php
/**
 * Class Custom
 *
 * This class is responsible for handling the custom
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Custom class
 */
class Custom extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Custom Location';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'custom';

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
				'label'    => __( 'Custom Location', 'quillbooking' ),
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
