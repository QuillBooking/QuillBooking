<?php
/**
 * Class Integration Remote Data
 *
 * This class is responsible for handling the Integration Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integration;

/**
 * Integration Remote Data class
 */
abstract class Remote_Data {

	/**
	 * Integration
	 *
	 * @var Integration
	 */
	protected $integration;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration Integration.
	 */
	public function __construct( Integration $integration ) {
		$this->integration = $integration;
	}
}
