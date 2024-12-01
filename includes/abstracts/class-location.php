<?php
/**
 * Class Location
 *
 * This class is responsible for handling the location
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Abstracts;

use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Managers\Fields_Manager;
use WP_Error;

/**
 * Location class
 */
abstract class Location {

	/**
	 * Title
	 *
	 * @var string
	 */
	public $title;

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = false;

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
			self::$instances[ static::class ] = new static();
		}
		return self::$instances[ static::class ];
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		if ( ! $this->register() ) {
			return;
		}
	}

	/**
	 * Register
	 *
	 * @return bool
	 */
	private function register() {
		try {
			Locations_Manager::instance()->register( $this );
		} catch ( \Exception $e ) {
			return false;
		}

		return true;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}

	/**
	 * Admin fields
	 *
	 * @return array
	 */
	public function get_admin_fields() {
		return array();
	}

	/**
	 * Validate location
	 *
	 * @param array $data
	 *
	 * @return array|\WP_Error
	 */
	public function validate_fields( $data ) {
		if ( empty( $this->get_admin_fields() ) ) {
			return $data;
		}

		$location_fields = $data['fields'] ?? array();
		foreach ( $this->get_admin_fields() as $slug => $field ) {
			if ( $field['required'] && ! isset( $location_fields[ $slug ] ) ) {
				return new \WP_Error( 'field_required', sprintf( __( '%s is required', 'quillbooking' ), $field['label'] ) );
			}

			$value = $location_fields[ $slug ];

			try {
				$field_type = Fields_Manager::instance()->get_field_type( $field['type'] );
				$field_type = new $field_type(
					array(
						'is_required' => $field['required'] ?? false,
						'label'       => $field['label'],
					)
				);

				$value = $field_type->sanitize_field( $value );
				$field_type->validate_value( $value );
				if ( ! $field_type->is_valid ) {
					return new \WP_Error( 'field_invalid', $field_type->validation_err );
				}

				$data['fields'][ $slug ] = $value;
			} catch ( \Exception $e ) {
				return new \WP_Error( 'field_invalid', $e->getMessage() );
			}
		}

		return $data;
	}
}
