<?php

namespace QuillBooking\Tests\Unit\Fields;

use QuillBooking\Fields\Checkbox_Field;
use QuillBooking_Base_Test_Case; // Assuming this is your base test class, possibly extending WP_UnitTestCase
use ReflectionClass;
use ReflectionException;

class Test_Checkbox_Field extends QuillBooking_Base_Test_Case {


	private $checkbox_field;

	/**
	 * Helper method to set a protected/private property value on an object.
	 * It will search up the class hierarchy for the property.
	 */
	protected function set_object_property( object $object, string $property_name, $value ): void {
		$reflection = new ReflectionClass( $object );
		$property   = null;

		// Try to find the property in the current class or any parent class
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
	 * It will search up the class hierarchy for the property.
	 */
	protected function get_object_property( object $object, string $property_name ) {
		$reflection = new ReflectionClass( $object );
		$property   = null;

		// Try to find the property in the current class or any parent class
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
		$this->checkbox_field = new Checkbox_Field();

		// Set the protected 'label' property (likely from parent Field_Type)
		$this->set_object_property( $this->checkbox_field, 'label', 'Test Checkbox' );
	}

	public function tearDown(): void {
		parent::tearDown();
		unset( $this->checkbox_field );
	}

	public function test_default_properties() {
		$this->assertEquals( 'Checkbox Field', $this->checkbox_field->name ); // 'name' is public
		$this->assertEquals( 'checkbox', $this->checkbox_field->slug );     // 'slug' is public
		// Access protected 'is_value_array' using the helper
		$this->assertFalse( $this->get_object_property( $this->checkbox_field, 'is_value_array' ) );
	}

	/**
	 * @dataProvider sanitize_provider
	 */
	public function test_sanitize_field( $input, $expected_output ) {
		$this->assertSame( $expected_output, $this->checkbox_field->sanitize_field( $input ) );
	}

	public static function sanitize_provider() {
		return array(
			'boolean true'     => array( true, true ),
			'boolean false'    => array( false, false ),
			'integer 1'        => array( 1, true ),
			'integer 0'        => array( 0, false ),
			'string "1"'       => array( '1', true ),
			'string "0"'       => array( '0', false ),
			'string "true"'    => array( 'true', true ),
			'string "false"'   => array( 'false', true ), // PHP's (bool)'false' is true
			'string "on"'      => array( 'on', true ),
			'string "off"'     => array( 'off', true ),   // PHP's (bool)'off' is true
			'empty string'     => array( '', false ),
			'null value'       => array( null, false ),
			'non-empty string' => array( 'text', true ),
			'empty array'      => array( array(), false ),
			'non-empty array'  => array( array( 'a' ), true ),
		);
	}

	public function test_validate_value_required_and_checked() {
		// is_required is public in Field_Type
		$this->set_object_property( $this->checkbox_field, 'is_required', true );
		$value = true;

		$this->checkbox_field->validate_value( $value );

		// is_valid and validation_err are public in Field_Type
		$this->assertTrue( $this->checkbox_field->is_valid );
		$this->assertEmpty( $this->checkbox_field->validation_err );
	}

	public function test_validate_value_required_and_unchecked_is_invalid() {
		$this->set_object_property( $this->checkbox_field, 'is_required', true );
		$value = false;

		$this->checkbox_field->validate_value( $value );

		$this->assertFalse( $this->checkbox_field->is_valid );
		// Access protected 'label' using the helper for the error message
		$label = $this->get_object_property( $this->checkbox_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->checkbox_field->validation_err
		);
	}

	public function test_validate_value_not_required_and_checked() {
		$this->set_object_property( $this->checkbox_field, 'is_required', false );
		$value = true;

		$this->checkbox_field->validate_value( $value );

		$this->assertTrue( $this->checkbox_field->is_valid );
		$this->assertEmpty( $this->checkbox_field->validation_err );
	}

	public function test_validate_value_not_required_and_unchecked() {
		$this->set_object_property( $this->checkbox_field, 'is_required', false );
		$value = false;

		$this->checkbox_field->validate_value( $value );

		$this->assertTrue( $this->checkbox_field->is_valid );
		$this->assertEmpty( $this->checkbox_field->validation_err );
	}

	public function test_validate_value_not_boolean_is_invalid() {
		$this->set_object_property( $this->checkbox_field, 'is_required', false );
		$value = 'not_a_boolean_string';

		$this->checkbox_field->validate_value( $value );

		$this->assertFalse( $this->checkbox_field->is_valid );
		$label = $this->get_object_property( $this->checkbox_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid boolean', 'quillbooking' ), $label ),
			$this->checkbox_field->validation_err
		);
	}

	public function test_validate_value_not_boolean_integer_is_invalid() {
		$this->set_object_property( $this->checkbox_field, 'is_required', false );
		$value = 123;

		$this->checkbox_field->validate_value( $value );

		$this->assertFalse( $this->checkbox_field->is_valid );
		$label = $this->get_object_property( $this->checkbox_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid boolean', 'quillbooking' ), $label ),
			$this->checkbox_field->validation_err
		);
	}
}
