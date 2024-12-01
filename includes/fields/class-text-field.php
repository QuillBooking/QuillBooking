<?php
/**
 * Class Text_Field
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Fields;

use QuillBooking\Abstracts\Field_Type;

/**
 * Text_Field class
 */
class Text_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Text Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'text';

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
		return sanitize_text_field( $value );
	}

	/**
	 * Validate
	 *
	 * @param mixed $value
	 *
	 * @return boolean
	 */
	public function validate_value( $value ) {
		if ( empty( $value ) && $this->is_required ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is required', 'quillbooking' ), $this->label );
			return;
		}

		if ( ! is_string( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is not a valid string', 'quillbooking' ), $this->label );
		}
	}
}
