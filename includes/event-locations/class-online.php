<?php
/**
 * Class Online
 *
 * This class is responsible for handling the online event location
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Online class
 */
class Online extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Online';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'online';

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_admin_fields() {
		return array(
			'meeting_url'        => array(
				'label'    => __( 'Meeting URL', 'quillbooking' ),
				'type'     => 'url',
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
