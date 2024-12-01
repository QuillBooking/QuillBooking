<?php
/**
 * Class Checkbox_Field
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Fields;

use QuillBooking\Abstracts\Field_Type;

/**
 * Checkbox_Field class
 */
class Checkbox_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Checkbox Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'checkbox';

	/**
	 * Is Value Array
	 *
	 * @var boolean
	 */
	protected $is_value_array = false;

	/**
	 * Sanitize
	 *
	 * @param mixed $value
	 *
	 * @return mixed
	 */
	public function sanitize_field( $value ) {
		return (bool) $value;
	}

	/**
	 * Validate
	 *
	 * @param mixed $value
	 *
	 * @return boolean
	 */
	public function validate_value( $value ) {
		if ( $this->is_required && empty( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is required', 'quillbooking' ), $this->label );
			return;
		}

		if ( ! is_bool( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is not a valid boolean', 'quillbooking' ), $this->label );
		}
	}
}
