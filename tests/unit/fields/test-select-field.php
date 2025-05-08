<?php

namespace QuillBooking\Tests\Unit\Fields;

use QuillBooking\Fields\Select_Field;
use QuillBooking_Base_Test_Case; // Assuming this is your base test class
use ReflectionClass;
use ReflectionException;

class Test_Select_Field extends QuillBooking_Base_Test_Case {


	private $select_field;
	private $default_options;

	/**
	 * Helper method to set a protected/private property value on an object.
	 */
	protected function set_object_property( object $object, string $property_name, $value ): void {
		$reflection               = new ReflectionClass( $object );
		$property                 = null;
		$current_class_reflection = $reflection;
		while ( $current_class_reflection ) {
			if ( $current_class_reflection->hasProperty( $property_name ) ) {
				$property = $current_class_reflection->getProperty( $property_name );
				break;
			}
			$current_class_reflection = $current_class_reflection->getParentClass();
		}
		if ( ! $property ) {
			throw new ReflectionException( "Property {$property_name} does not exist in class " . get_class( $object ) . ' or its parents.' );
		}
		$property->setAccessible( true );
		$property->setValue( $object, $value );
	}

	/**
	 * Helper method to get a protected/private property value from an object.
	 */
	protected function get_object_property( object $object, string $property_name ) {
		$reflection               = new ReflectionClass( $object );
		$property                 = null;
		$current_class_reflection = $reflection;
		while ( $current_class_reflection ) {
			if ( $current_class_reflection->hasProperty( $property_name ) ) {
				$property = $current_class_reflection->getProperty( $property_name );
				break;
			}
			$current_class_reflection = $current_class_reflection->getParentClass();
		}
		if ( ! $property ) {
			throw new ReflectionException( "Property {$property_name} does not exist in class " . get_class( $object ) . ' or its parents.' );
		}
		$property->setAccessible( true );
		return $property->getValue( $object );
	}

	public function setUp(): void {
		parent::setUp();
		$this->select_field = new Select_Field();
		$this->set_object_property( $this->select_field, 'label', 'Test Select' );

		$this->default_options = array(
			'opt_val_1'   => 'Option Value One',
			'opt_val_2'   => 'Option Value Two',
			'another_key' => 'Another Label',
		);
		// 'options' is a public property in Field_Type
		$this->select_field->options = $this->default_options;
	}

	public function tearDown(): void {
		parent::tearDown();
		unset( $this->select_field );
	}

	public function test_default_properties() {
		$this->assertEquals( 'Select Field', $this->select_field->name );
		$this->assertEquals( 'select', $this->select_field->slug );
		$this->assertFalse( $this->get_object_property( $this->select_field, 'is_value_array' ) );
		$this->assertTrue( $this->select_field->has_options ); // has_options is public
	}

	/**
	 * @dataProvider sanitize_provider
	 */
	public function test_sanitize_field( $input, $expected_output ) {
		$this->assertEquals( $expected_output, $this->select_field->sanitize_field( $input ) );
	}

	public static function sanitize_provider() {
		// Select_Field uses sanitize_text_field, same as Radio_Field
		return array(
			'simple string'            => array( 'hello_world', 'hello_world' ),
			'string with spaces'       => array( '  trimmed string  ', 'trimmed string' ),
			'string with html'         => array( 'test<script>alert("xss")</script>!', 'test!' ), // sanitize_text_field strips all tags
			'string with allowed html' => array( 'test <strong>bold</strong> text', 'test bold text' ), // sanitize_text_field strips all tags
			'empty string'             => array( '', '' ),
			'null value'               => array( null, '' ),
			'integer value'            => array( 12345, '12345' ), // Converted to string
			'string already clean'     => array( 'opt_val_1', 'opt_val_1' ),
		);
	}

	public function test_validate_value_required_and_valid_option() {
		$this->set_object_property( $this->select_field, 'is_required', true );
		$sanitized_value = $this->select_field->sanitize_field( 'opt_val_1' );

		$this->select_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->select_field->is_valid );
		$this->assertEmpty( $this->select_field->validation_err );
	}

	public function test_validate_value_required_and_empty_value_is_invalid() {
		$this->set_object_property( $this->select_field, 'is_required', true );
		$sanitized_value = $this->select_field->sanitize_field( '' );

		$this->select_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->select_field->is_valid );
		$label = $this->get_object_property( $this->select_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->select_field->validation_err
		);
	}

	public function test_validate_value_required_and_invalid_option_is_invalid() {
		$this->set_object_property( $this->select_field, 'is_required', true );
		$sanitized_value = $this->select_field->sanitize_field( 'this_is_not_an_option_key' );

		$this->select_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->select_field->is_valid );
		$label = $this->get_object_property( $this->select_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->select_field->validation_err
		);
	}

	public function test_validate_value_not_required_and_valid_option() {
		$this->set_object_property( $this->select_field, 'is_required', false );
		$sanitized_value = $this->select_field->sanitize_field( 'another_key' );

		$this->select_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->select_field->is_valid );
		$this->assertEmpty( $this->select_field->validation_err );
	}

	public function test_validate_value_not_required_and_empty_value_is_invalid_by_current_logic() {
		$this->set_object_property( $this->select_field, 'is_required', false );
		$sanitized_value = $this->select_field->sanitize_field( '' );

		$this->select_field->validate_value( $sanitized_value );
		$this->assertFalse( $this->select_field->is_valid );
		$label = $this->get_object_property( $this->select_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->select_field->validation_err
		);
	}

	public function test_validate_value_not_required_and_empty_value_is_valid_if_empty_is_an_option_key() {
		$this->select_field->options = array_merge( $this->default_options, array( '' => 'Please Select' ) );
		$this->set_object_property( $this->select_field, 'is_required', false );
		$sanitized_value = $this->select_field->sanitize_field( '' );

		$this->select_field->validate_value( $sanitized_value );
		$this->assertTrue( $this->select_field->is_valid );
		$this->assertEmpty( $this->select_field->validation_err );

		$this->select_field->options = $this->default_options; // Reset
	}


	public function test_validate_value_not_required_and_invalid_option_is_invalid() {
		$this->set_object_property( $this->select_field, 'is_required', false );
		$sanitized_value = $this->select_field->sanitize_field( 'invalid_option_value' );

		$this->select_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->select_field->is_valid );
		$label = $this->get_object_property( $this->select_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->select_field->validation_err
		);
	}

	public function test_validate_value_no_options_set_invalidates_any_value() {
		$this->select_field->options = array(); // Clear options
		$this->set_object_property( $this->select_field, 'is_required', false );
		$sanitized_value = $this->select_field->sanitize_field( 'opt_val_1' );

		$this->select_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->select_field->is_valid );
		$label = $this->get_object_property( $this->select_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->select_field->validation_err
		);
		$this->select_field->options = $this->default_options; // Reset
	}
}
