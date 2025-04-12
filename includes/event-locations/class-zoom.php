<?php
/**
 * Zoom Location class.
 *
 * This class is responsible for handling the Zoom location.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Event_Locations;

use QuillBooking\Abstracts\Location;

/**
 * Zoom class
 */
class Zoom extends Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title = 'Zoom';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'zoom';

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = true;
}
