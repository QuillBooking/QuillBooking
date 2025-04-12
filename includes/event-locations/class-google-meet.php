<?php
/**
 * Google Meet Location class.
 *
 * This class is responsible for handling the Google Meet location.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Google Meet class
 */
class Google_Meet extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Google Meet';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'google-meet';

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = true;
}
