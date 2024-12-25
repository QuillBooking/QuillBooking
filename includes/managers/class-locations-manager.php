<?php
/**
 * Class Locations Manager
 * This class is responsible for handling the locations manager
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Managers;

use QuillBooking\Abstracts\Manager;
use QuillBooking\Abstracts\Location;
use QuillBooking\Traits\Singleton;

/**
 * Locations Manager class
 */
class Locations_Manager extends Manager {

	use Singleton;

	/**
	 * Register Location
	 *
	 * @since 1.0.0
	 *
	 * @param Location $location
	 * @throws \Exception
	 */
	public function register_location( Location $location ) {
		$this->register(
			$location,
			Location::class,
			'slug',
			array(
				'title'          => 'title',
				'is_integration' => 'is_integration',
				'fields'         => 'get_admin_fields',
			)
		);
	}

	/**
	 * Get Location
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Location|null
	 */
	public function get_location( $slug ) {
		return $this->get_item( $slug );
	}

	/**
	 * Get Locations
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_locations() {
		return $this->get_items();
	}
}
