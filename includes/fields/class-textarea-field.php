<?php
/**
 * Class Textarea_Field
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Fields;

use QuillBooking\Fields\Text_Field;

/**
 * Textarea_Field class
 */
class Textarea_Field extends Text_Field {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Textarea Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'textarea';
}
