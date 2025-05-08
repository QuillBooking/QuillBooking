<?php

namespace QuillBooking\Tests\Unit\Fields;

use QuillBooking\Fields\Radio_Field;
use QuillBooking_Base_Test_Case; // Assuming this is your base test class
use ReflectionClass;
use ReflectionException;

class Test_Radio_Field extends QuillBooking_Base_Test_Case {


	private $radio_field;
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
		$this->radio_field = new Radio_Field();
		$this->set_object_property( $this->radio_field, 'label', 'Test Radio' );

		$this->default_options      = array(
			'opt_1' => 'Option One',
			'opt_2' => 'Option Two',
			'val_x' => 'Value X',
		);
		$this->radio_field->options = $this->default_options;
	}

	public function tearDown(): void {
		parent::tearDown();
		unset( $this->radio_field );
	}

	public function test_default_properties() {
		$this->assertEquals( 'Radio Field', $this->radio_field->name );
		$this->assertEquals( 'radio', $this->radio_field->slug );
		$this->assertFalse( $this->get_object_property( $this->radio_field, 'is_value_array' ) );
		$this->assertTrue( $this->radio_field->has_options );
	}

	/**
	 * @dataProvider sanitize_provider
	 */
	public function test_sanitize_field( $input, $expected_output ) {
		$this->assertEquals( $expected_output, $this->radio_field->sanitize_field( $input ) );
	}

	public static function sanitize_provider() {
		return array(
			'simple string'            => array( 'hello', 'hello' ),
			'string with spaces'       => array( '  world  ', 'world' ),
			// Corrected expected output for sanitize_text_field
			'string with html'         => array( 'test<script>alert("xss")</script>!', 'test!' ),
			'string with allowed html' => array( 'test <strong>bold</strong>', 'test bold' ),
			'empty string'             => array( '', '' ),
			'null value'               => array( null, '' ),
			'integer value'            => array( 123, '123' ),
			'string already clean'     => array( 'option_value_1', 'option_value_1' ),
		);
	}

	public function test_validate_value_required_and_valid_option() {
		$this->set_object_property( $this->radio_field, 'is_required', true );
		$sanitized_value = $this->radio_field->sanitize_field( 'opt_1' );

		$this->radio_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->radio_field->is_valid );
		$this->assertEmpty( $this->radio_field->validation_err );
	}

	public function test_validate_value_required_and_empty_value_is_invalid() {
		$this->set_object_property( $this->radio_field, 'is_required', true );
		$sanitized_value = $this->radio_field->sanitize_field( '' );

		$this->radio_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->radio_field->is_valid );
		$label = $this->get_object_property( $this->radio_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->radio_field->validation_err
		);
	}

	public function test_validate_value_required_and_invalid_option_is_invalid() {
		$this->set_object_property( $this->radio_field, 'is_required', true );
		$sanitized_value = $this->radio_field->sanitize_field( 'invalid_opt' );

		$this->radio_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->radio_field->is_valid );
		$label = $this->get_object_property( $this->radio_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->radio_field->validation_err
		);
	}

	public function test_validate_value_not_required_and_valid_option() {
		$this->set_object_property( $this->radio_field, 'is_required', false );
		$sanitized_value = $this->radio_field->sanitize_field( 'val_x' );

		$this->radio_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->radio_field->is_valid );
		$this->assertEmpty( $this->radio_field->validation_err );
	}

	public function test_validate_value_not_required_and_empty_value_is_invalid_by_current_logic() {
		$this->set_object_property( $this->radio_field, 'is_required', false );
		$sanitized_value = $this->radio_field->sanitize_field( '' );

		$this->radio_field->validate_value( $sanitized_value );
		$this->assertFalse( $this->radio_field->is_valid );
		$label = $this->get_object_property( $this->radio_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->radio_field->validation_err
		);
	}

	public function test_validate_value_not_required_and_empty_value_is_valid_if_empty_is_an_option_key() {
		$this->radio_field->options = array_merge( $this->default_options, array( '' => 'None' ) );
		$this->set_object_property( $this->radio_field, 'is_required', false );
		$sanitized_value = $this->radio_field->sanitize_field( '' );

		$this->radio_field->validate_value( $sanitized_value );
		$this->assertTrue( $this->radio_field->is_valid );
		$this->assertEmpty( $this->radio_field->validation_err );

		$this->radio_field->options = $this->default_options;
	}


	public function test_validate_value_not_required_and_invalid_option_is_invalid() {
		$this->set_object_property( $this->radio_field, 'is_required', false );
		$sanitized_value = $this->radio_field->sanitize_field( 'non_existent_option' );

		$this->radio_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->radio_field->is_valid );
		$label = $this->get_object_property( $this->radio_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->radio_field->validation_err
		);
	}

	public function test_validate_value_no_options_set_invalidates_any_value() {
		$this->radio_field->options = array();
		$this->set_object_property( $this->radio_field, 'is_required', false );
		$sanitized_value = $this->radio_field->sanitize_field( 'opt_1' );

		$this->radio_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->radio_field->is_valid );
		$label = $this->get_object_property( $this->radio_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid option', 'quillbooking' ), $label ),
			$this->radio_field->validation_err
		);
		$this->radio_field->options = $this->default_options;
	}
}
