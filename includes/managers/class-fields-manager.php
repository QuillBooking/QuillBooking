<?php
/**
 * Class Fields_Manager
 *
 * This class is responsible for handling the fields manager
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Managers;

use Exception;
use QuillBooking\Abstracts\Field_Type;
use QuillBooking\Fields\Checkbox_Field;
use QuillBooking\Fields\Text_Field;
use QuillBooking\Fields\Email_Field;
use QuillBooking\Fields\Number_Field;
use QuillBooking\Fields\Radio_Field;
use QuillBooking\Fields\Textarea_Field;

/**
 * Fields Manager class
 */
class Fields_Manager {

	/**
	 * Registed fields
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $fields = array();

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
	 * @var Fields_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Fields_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Fields_Manager constructor.
	 */
	public function __construct() {
		$this->register_fields();
	}

	/**
	 * Register Field_Type
	 *
	 * @since 1.0.0
	 *
	 * @param Field_Type $field_type
	 * @return void
	 */
	public function register( Field_Type $field_type ) {
		if ( ! $field_type instanceof Field_Type ) {
			throw new Exception( __( 'Invalid field_type', 'quillbooking' ) );
		}

		if ( isset( $this->fields[ $field_type->slug ] ) ) {
			return;
		}

		$this->fields[ $field_type->slug ]  = $field_type;
		$this->options[ $field_type->slug ] = array(
			'name'        => $field_type->name,
			'has_options' => $field_type->has_options,
		);
	}

	/**
	 * Register Fields
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_fields() {
		$fields = array(
			Text_Field::class,
			Email_Field::class,
			Number_Field::class,
			Checkbox_Field::class,
			Radio_Field::class,
			Textarea_Field::class,
		);

		foreach ( $fields as $field ) {
			$this->register( new $field() );
		}
	}

	/**
	 * Get Field_Type
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Field_Type
	 */
	public function get_field_type( $slug ) {
		if ( ! isset( $this->fields[ $slug ] ) ) {
			throw new Exception( sprintf( __( 'Field_Type %s not registered', 'quillbooking' ), $slug ) );
		}

		return $this->fields[ $slug ];
	}

	/**
	 * Get Field_Types
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_field_types() {
		return $this->fields;
	}

	/**
	 * Get Options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return $this->options;
	}
}
