<?php
/**
 * Class Email_Field
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Fields;

use QuillBooking\Abstracts\Field_Type;

/**
 * Email_Field class
 */
class Email_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Email Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'email';

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
		return sanitize_email( $value );
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

		if ( ! is_email( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is invalid email', 'quillbooking' ), $this->label );
		}
	}
}
