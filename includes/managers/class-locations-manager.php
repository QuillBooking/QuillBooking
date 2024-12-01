<?php
/**
 * Class Locations_Manager
 *
 * This class is responsible for handling the locations manager
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Managers;

use QuillBooking\Abstracts\Location;

/**
 * Locations Manager class
 */
class Locations_Manager {

	/**
	 * Registed locations
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $locations = array();

	/**
	 * Options
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Locations_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Locations_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register location
	 *
	 * @since 1.0.0
	 *
	 * @param Location $location
	 */
	public function register( Location $location ) {
		if ( ! $location instanceof Location ) {
			throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
		}

		if ( isset( $this->locations[ $location->slug ] ) ) {
			throw new \Exception( __( 'Location already registered', 'quillbooking' ) );
		}

		$this->locations[ $location->slug ] = $location;
		$this->options[ $location->slug ]   = array(
			'title'          => $location->title,
			'is_integration' => $location->is_integration,
			'fields'         => $location->get_admin_fields(),
		);
	}

	/**
	 * Get location
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 *
	 * @return Location
	 */
	public function get_location( $slug ) {
		return isset( $this->locations[ $slug ] ) ? $this->locations[ $slug ] : null;
	}

	/**
	 * Get locations
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_locations() {
		return $this->locations;
	}

	/**
	 * Get location options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_location_options() {
		return $this->options;
	}
}
