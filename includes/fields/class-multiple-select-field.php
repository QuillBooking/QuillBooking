<?php
/**
 * Class Multiple_Select_Field
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Fields;

use QuillBooking\Abstracts\Field_Type;

/**
 * Multiple_Select_Field class
 */
class Multiple_Select_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Multiple Select Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'multiple_select';

	/**
	 * Is Value Array
	 *
	 * @var boolean
	 */
	protected $is_value_array = false;

	/**
	 * Has Options
	 *
	 * @var boolean
	 */
	public $has_options = true;

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

		if ( ! in_array( $value, array_keys( $this->options ) ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is not a valid option', 'quillbooking' ), $this->label );
		}
	}
}
