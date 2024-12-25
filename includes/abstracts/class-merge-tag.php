<?php
/**
 * Class Merge_Tag
 *
 * Abstract class for merge tags
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Abstracts;

use QuillBooking\Models\Booking_Model;
use QuillBooking\Managers\Merge_Tags_Manager;

/**
 * Class Merge_Tag
 */
abstract class Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group;

	/**
	 * Subclasses instances.
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	private static $instances = array();

	/**
	 * Location Instances.
	 *
	 * Instantiates or reuses an instances of Location.
	 *
	 * @since 1.0.0
	 * @static
	 *
	 * @return static - Single instance
	 */
	public static function instance() {
		if ( ! isset( self::$instances[ static::class ] ) ) {
			$instances = new static();
			$instances->register();
			self::$instances[ static::class ] = $instances;
		}
		return self::$instances[ static::class ];
	}

	/**
	 * Constructor
	 */
	protected function __construct() {}

	/**
	 * Register
	 *
	 * @return bool
	 */
	private function register() {
		try {
			Merge_Tags_Manager::instance()->register_merge_tag( $this );
		} catch ( \Exception $e ) {
			return false;
		}

		return true;
	}

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param array         $options Options.
	 *
	 * @return string
	 */
	abstract public function get_value( Booking_Model $booking, $options = array() );

	/**
	 * Get options
	 *
	 * @return array
	 */
	public function get_options() {
		return array();
	}
}
