<?php

namespace QuillBooking\Tests\Unit\Fields;

use QuillBooking\Fields\Phone_Field;
use QuillBooking_Base_Test_Case; // Assuming this is your base test class
use ReflectionClass;
use ReflectionException;

class Test_Phone_Field extends QuillBooking_Base_Test_Case {


	private $phone_field;

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
		$this->phone_field = new Phone_Field();
		$this->set_object_property( $this->phone_field, 'label', 'Test Phone' );
	}

	public function tearDown(): void {
		parent::tearDown();
		unset( $this->phone_field );
	}

	public function test_default_properties() {
		$this->assertEquals( 'Phone Field', $this->phone_field->name );
		$this->assertEquals( 'phone', $this->phone_field->slug );
		$this->assertFalse( $this->get_object_property( $this->phone_field, 'is_value_array' ) );
	}

	/**
	 * @dataProvider sanitize_provider
	 */
	public function test_sanitize_field( $input, $expected_output ) {
		// Phone_Field uses absint(), so its behavior is identical to Number_Field's sanitize
		$this->assertEquals( $expected_output, $this->phone_field->sanitize_field( $input ) );
	}

	public static function sanitize_provider() {
		// Since Phone_Field uses absint(), the provider is the same as for Number_Field
		return array(
			'positive integer'        => array( 1234567890, 1234567890 ),
			'negative integer'        => array( -123, 123 ), // absint makes it positive
			'zero integer'            => array( 0, 0 ),
			'positive string integer' => array( '4567890123', 4567890123 ),
			'negative string integer' => array( '-456', 456 ),
			'zero string integer'     => array( '0', 0 ),
			'positive float'          => array( 12.34, 12 ), // absint truncates
			'string with phone chars' => array( '+1 (555) 123-4567', 1 ), // absint behavior
			'string with leading num' => array( '123abc45', 123 ),
			'string with no num'      => array( 'abc-def-ghi', 0 ),
			'empty string'            => array( '', 0 ),
			'null value'              => array( null, 0 ),
			'boolean true'            => array( true, 1 ),
			'boolean false'           => array( false, 0 ),
		);
	}

	public function test_validate_value_required_and_valid_input() {
		$this->set_object_property( $this->phone_field, 'is_required', true );
		$sanitized_value = $this->phone_field->sanitize_field( '1234567890' ); // Becomes 1234567890

		$this->phone_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->phone_field->is_valid );
		$this->assertEmpty( $this->phone_field->validation_err );
	}

	public function test_validate_value_required_and_empty_string_input_is_invalid() {
		$this->set_object_property( $this->phone_field, 'is_required', true );
		$sanitized_value = $this->phone_field->sanitize_field( '' ); // Becomes 0

		$this->phone_field->validate_value( $sanitized_value ); // empty(0) is true

		$this->assertFalse( $this->phone_field->is_valid );
		$label = $this->get_object_property( $this->phone_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->phone_field->validation_err
		);
	}

	public function test_validate_value_required_and_zero_input_is_invalid() {
		$this->set_object_property( $this->phone_field, 'is_required', true );
		$sanitized_value = $this->phone_field->sanitize_field( '0' ); // Becomes 0

		$this->phone_field->validate_value( $sanitized_value ); // empty(0) is true

		$this->assertFalse( $this->phone_field->is_valid );
		$label = $this->get_object_property( $this->phone_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->phone_field->validation_err
		);
	}

	public function test_validate_value_required_and_non_numeric_string_input_is_invalid() {
		$this->set_object_property( $this->phone_field, 'is_required', true );
		// This input would typically be a phone number with characters, e.g., "+1 (123) 456-7890"
		// sanitize_field with absint will turn it into a number (likely 1 from the '+1') or 0.
		// Let's test a case where absint() results in 0.
		$sanitized_value = $this->phone_field->sanitize_field( 'abc-def' ); // Becomes 0

		$this->phone_field->validate_value( $sanitized_value ); // empty(0) is true

		$this->assertFalse( $this->phone_field->is_valid );
		$label = $this->get_object_property( $this->phone_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->phone_field->validation_err
		);
	}


	public function test_validate_value_not_required_and_valid_input() {
		$this->set_object_property( $this->phone_field, 'is_required', false );
		$sanitized_value = $this->phone_field->sanitize_field( '9876543210' ); // Becomes 9876543210

		$this->phone_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->phone_field->is_valid );
		$this->assertEmpty( $this->phone_field->validation_err );
	}

	public function test_validate_value_not_required_and_empty_string_input_is_valid() {
		$this->set_object_property( $this->phone_field, 'is_required', false );
		$sanitized_value = $this->phone_field->sanitize_field( '' ); // Becomes 0

		$this->phone_field->validate_value( $sanitized_value ); // is_numeric(0) is true

		$this->assertTrue( $this->phone_field->is_valid );
		$this->assertEmpty( $this->phone_field->validation_err );
	}

	public function test_validate_value_not_required_and_zero_input_is_valid() {
		$this->set_object_property( $this->phone_field, 'is_required', false );
		$sanitized_value = $this->phone_field->sanitize_field( '0' ); // Becomes 0

		$this->phone_field->validate_value( $sanitized_value ); // is_numeric(0) is true

		$this->assertTrue( $this->phone_field->is_valid );
		$this->assertEmpty( $this->phone_field->validation_err );
	}

	public function test_validate_value_not_required_and_non_numeric_string_input_is_valid() {
		$this->set_object_property( $this->phone_field, 'is_required', false );
		$sanitized_value = $this->phone_field->sanitize_field( 'xyz-phone' ); // Becomes 0 (due to absint)

		$this->phone_field->validate_value( $sanitized_value ); // is_numeric(0) is true

		$this->assertTrue( $this->phone_field->is_valid );
		$this->assertEmpty( $this->phone_field->validation_err );
	}

	/**
	 * Tests the `! is_numeric()` branch of validate_value directly,
	 * even though sanitize_field with absint() would prevent reaching it with a non-numeric string.
	 * This ensures validate_value itself is robust if it ever receives such input.
	 * The error message is "is not a valid number" because that's what Phone_Field uses.
	 */
	public function test_validate_value_direct_non_numeric_input_is_invalid() {
		$this->set_object_property( $this->phone_field, 'is_required', false );
		$non_numeric_value = 'not a phone number string';

		$this->phone_field->validate_value( $non_numeric_value );

		$this->assertFalse( $this->phone_field->is_valid );
		$label = $this->get_object_property( $this->phone_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid number', 'quillbooking' ), $label ), // Error from Phone_Field
			$this->phone_field->validation_err
		);
	}

	public function test_validate_value_direct_non_numeric_input_required_is_invalid() {
		$this->set_object_property( $this->phone_field, 'is_required', true );
		$non_numeric_value = 'another non-phone string'; // empty() is false for this string

		$this->phone_field->validate_value( $non_numeric_value );

		$this->assertFalse( $this->phone_field->is_valid );
		$label = $this->get_object_property( $this->phone_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid number', 'quillbooking' ), $label ), // Error from Phone_Field
			$this->phone_field->validation_err
		);
	}
}
