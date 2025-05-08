<?php

namespace QuillBooking\Tests\Unit\Fields;

use QuillBooking\Fields\Number_Field;
use QuillBooking_Base_Test_Case; // Assuming this is your base test class
use ReflectionClass;
use ReflectionException;

class Test_Number_Field extends QuillBooking_Base_Test_Case {


	private $number_field;

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
		$this->number_field = new Number_Field();
		$this->set_object_property( $this->number_field, 'label', 'Test Number' );
	}

	public function tearDown(): void {
		parent::tearDown();
		unset( $this->number_field );
	}

	public function test_default_properties() {
		$this->assertEquals( 'Number Field', $this->number_field->name );
		$this->assertEquals( 'number', $this->number_field->slug );
		$this->assertFalse( $this->get_object_property( $this->number_field, 'is_value_array' ) );
	}

	/**
	 * @dataProvider sanitize_provider
	 */
	public function test_sanitize_field( $input, $expected_output ) {
		$this->assertEquals( $expected_output, $this->number_field->sanitize_field( $input ) );
	}

	public static function sanitize_provider() {
		return array(
			'positive integer'        => array( 123, 123 ),
			'negative integer'        => array( -123, 123 ),
			'zero integer'            => array( 0, 0 ),
			'positive string integer' => array( '456', 456 ),
			'negative string integer' => array( '-456', 456 ),
			'zero string integer'     => array( '0', 0 ),
			'positive float'          => array( 12.34, 12 ),
			'negative float'          => array( -12.34, 12 ),
			'string float'            => array( '56.78', 56 ),
			'string negative float'   => array( '-56.78', 56 ),
			'string with leading num' => array( '123abc45', 123 ),
			'string with no num'      => array( 'abc', 0 ),
			'empty string'            => array( '', 0 ),
			'null value'              => array( null, 0 ),
			'boolean true'            => array( true, 1 ),
			'boolean false'           => array( false, 0 ),
			// 'array value'          => array(array(1,2), 0), // absint() would raise a PHP warning/notice
		);
	}

	public function test_validate_value_required_and_valid_positive_number() {
		$this->set_object_property( $this->number_field, 'is_required', true );
		$sanitized_value = $this->number_field->sanitize_field( '10' ); // Becomes 10

		$this->number_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->number_field->is_valid );
		$this->assertEmpty( $this->number_field->validation_err );
	}

	public function test_validate_value_required_and_valid_negative_input_becomes_positive() {
		$this->set_object_property( $this->number_field, 'is_required', true );
		$sanitized_value = $this->number_field->sanitize_field( '-10' ); // Becomes 10

		$this->number_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->number_field->is_valid );
		$this->assertEmpty( $this->number_field->validation_err );
	}

	public function test_validate_value_required_and_empty_string_input_is_invalid() {
		$this->set_object_property( $this->number_field, 'is_required', true );
		$sanitized_value = $this->number_field->sanitize_field( '' ); // Becomes 0

		$this->number_field->validate_value( $sanitized_value ); // empty(0) is true

		$this->assertFalse( $this->number_field->is_valid );
		$label = $this->get_object_property( $this->number_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->number_field->validation_err
		);
	}

	public function test_validate_value_required_and_zero_input_is_invalid() {
		$this->set_object_property( $this->number_field, 'is_required', true );
		$sanitized_value = $this->number_field->sanitize_field( '0' ); // Becomes 0

		$this->number_field->validate_value( $sanitized_value ); // empty(0) is true

		$this->assertFalse( $this->number_field->is_valid );
		$label = $this->get_object_property( $this->number_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->number_field->validation_err
		);
	}

	public function test_validate_value_required_and_non_numeric_string_input_is_invalid() {
		$this->set_object_property( $this->number_field, 'is_required', true );
		$sanitized_value = $this->number_field->sanitize_field( 'abc' ); // Becomes 0

		$this->number_field->validate_value( $sanitized_value ); // empty(0) is true

		$this->assertFalse( $this->number_field->is_valid );
		$label = $this->get_object_property( $this->number_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->number_field->validation_err
		);
	}


	public function test_validate_value_not_required_and_valid_number() {
		$this->set_object_property( $this->number_field, 'is_required', false );
		$sanitized_value = $this->number_field->sanitize_field( '20' ); // Becomes 20

		$this->number_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->number_field->is_valid );
		$this->assertEmpty( $this->number_field->validation_err );
	}

	public function test_validate_value_not_required_and_empty_string_input_is_valid() {
		$this->set_object_property( $this->number_field, 'is_required', false );
		$sanitized_value = $this->number_field->sanitize_field( '' ); // Becomes 0

		$this->number_field->validate_value( $sanitized_value ); // is_numeric(0) is true

		$this->assertTrue( $this->number_field->is_valid );
		$this->assertEmpty( $this->number_field->validation_err );
	}

	public function test_validate_value_not_required_and_zero_input_is_valid() {
		$this->set_object_property( $this->number_field, 'is_required', false );
		$sanitized_value = $this->number_field->sanitize_field( '0' ); // Becomes 0

		$this->number_field->validate_value( $sanitized_value ); // is_numeric(0) is true

		$this->assertTrue( $this->number_field->is_valid );
		$this->assertEmpty( $this->number_field->validation_err );
	}

	public function test_validate_value_not_required_and_non_numeric_string_input_is_valid() {
		$this->set_object_property( $this->number_field, 'is_required', false );
		$sanitized_value = $this->number_field->sanitize_field( 'xyz' ); // Becomes 0

		$this->number_field->validate_value( $sanitized_value ); // is_numeric(0) is true

		$this->assertTrue( $this->number_field->is_valid );
		$this->assertEmpty( $this->number_field->validation_err );
	}

	/**
	 * Tests the `! is_numeric()` branch of validate_value directly,
	 * even though sanitize_field with absint() would prevent reaching it.
	 * This ensures validate_value itself is robust if it ever receives non-numeric input.
	 */
	public function test_validate_value_direct_non_numeric_input_is_invalid() {
		$this->set_object_property( $this->number_field, 'is_required', false ); // Requirement doesn't matter for this branch
		$non_numeric_value = 'not a number';

		$this->number_field->validate_value( $non_numeric_value );

		$this->assertFalse( $this->number_field->is_valid );
		$label = $this->get_object_property( $this->number_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid number', 'quillbooking' ), $label ),
			$this->number_field->validation_err
		);
	}

	public function test_validate_value_direct_non_numeric_input_required_is_invalid() {
		$this->set_object_property( $this->number_field, 'is_required', true );
		$non_numeric_value = 'not a number either'; // empty() is false for this string

		$this->number_field->validate_value( $non_numeric_value );

		// The `if ( empty( $value ) && $this->is_required )` will be false.
		// Then `if ( ! is_numeric( $value ) )` will be true.
		$this->assertFalse( $this->number_field->is_valid );
		$label = $this->get_object_property( $this->number_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid number', 'quillbooking' ), $label ),
			$this->number_field->validation_err
		);
	}
}
