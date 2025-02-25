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
use QuillBooking\Fields\Select_Field;
use QuillBooking\Abstracts\Manager;
use QuillBooking\Traits\Singleton;

/**
 * Fields Manager class
 */
class Fields_Manager extends Manager {

	use Singleton;

	/**
	 * Fields_Manager constructor.
	 */
	public function __construct() {
		$this->register_fields();
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
			Checkbox_Field::class,
			Text_Field::class,
			Email_Field::class,
			Number_Field::class,
			Checkbox_Field::class,
			Radio_Field::class,
			Textarea_Field::class,
			Select_Field::class,
		);

		foreach ( $fields as $field ) {
			$this->register(
				new $field,
				Field_Type::class,
				'slug',
				array(
					'name'        => 'name',
					'has_options' => 'has_options',
					'multiple'    => 'multiple',
				)
			);
		}
	}
}
