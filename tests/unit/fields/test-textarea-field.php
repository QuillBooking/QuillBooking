<?php

namespace QuillBooking\Tests\Unit\Fields;

use QuillBooking\Fields\Textarea_Field;
use QuillBooking_Base_Test_Case; // Assuming this is your base test class
use ReflectionClass;
use ReflectionException;

class Test_Textarea_Field extends QuillBooking_Base_Test_Case {


	private $textarea_field;

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
		$this->textarea_field = new Textarea_Field();
		$this->set_object_property( $this->textarea_field, 'label', 'Test Textarea Input' );
	}

	public function tearDown(): void {
		parent::tearDown();
		unset( $this->textarea_field );
	}

	public function test_default_properties() {
		$this->assertEquals( 'Textarea Field', $this->textarea_field->name );
		$this->assertEquals( 'textarea', $this->textarea_field->slug );
		$this->assertFalse( $this->get_object_property( $this->textarea_field, 'is_value_array' ) );
	}

	/**
	 * @dataProvider sanitize_provider
	 */
	public function test_sanitize_field( $input, $expected_output ) {
		$this->assertEquals( $expected_output, $this->textarea_field->sanitize_field( $input ) );
	}

	public static function sanitize_provider() {
		return array(
			'simple string'        => array( 'hello world this is a textarea', 'hello world this is a textarea' ),
			// Corrected expected output: sanitize_text_field converts newlines to spaces
			'string with newlines' => array( "line one\nline two", 'line one line two' ),
			'string with spaces'   => array( '  leading and trailing spaces  ', 'leading and trailing spaces' ),
			'string with html'     => array( 'some <b>bold</b> <script>alert("XSS");</script> text!', 'some bold text!' ),
			'empty string'         => array( '', '' ),
			'null value'           => array( null, '' ),
			'integer value'        => array( 12345, '12345' ),
			'string with numbers'  => array( 'abc123xyz', 'abc123xyz' ),
		);
	}

	public function test_validate_value_required_and_valid_string() {
		$this->set_object_property( $this->textarea_field, 'is_required', true );
		// Input that will become a single line after sanitize_text_field
		$sanitized_value = $this->textarea_field->sanitize_field( "Some valid text.\nWith newlines." );

		$this->textarea_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->textarea_field->is_valid );
		$this->assertEmpty( $this->textarea_field->validation_err );
	}

	public function test_validate_value_required_and_empty_string_is_invalid() {
		$this->set_object_property( $this->textarea_field, 'is_required', true );
		$sanitized_value = $this->textarea_field->sanitize_field( '' );

		$this->textarea_field->validate_value( $sanitized_value );

		$this->assertFalse( $this->textarea_field->is_valid );
		$label = $this->get_object_property( $this->textarea_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->textarea_field->validation_err
		);
	}

	public function test_validate_value_not_required_and_valid_string() {
		$this->set_object_property( $this->textarea_field, 'is_required', false );
		$sanitized_value = $this->textarea_field->sanitize_field( "Optional text here.\nCan be multiline." );

		$this->textarea_field->validate_value( $sanitized_value );

		$this->assertTrue( $this->textarea_field->is_valid );
		$this->assertEmpty( $this->textarea_field->validation_err );
	}

	public function test_validate_value_not_required_and_empty_string_is_valid() {
		$this->set_object_property( $this->textarea_field, 'is_required', false );
		$sanitized_value = $this->textarea_field->sanitize_field( '' );

		$this->textarea_field->validate_value( $sanitized_value );
		$this->assertTrue( $this->textarea_field->is_valid );
		$this->assertEmpty( $this->textarea_field->validation_err );
	}

	public function test_validate_value_direct_non_string_input_not_required_is_invalid() {
		$this->set_object_property( $this->textarea_field, 'is_required', false );
		$non_string_value = 12345;

		$this->textarea_field->validate_value( $non_string_value );
		$this->assertFalse( $this->textarea_field->is_valid );
		$label = $this->get_object_property( $this->textarea_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid string', 'quillbooking' ), $label ),
			$this->textarea_field->validation_err
		);
	}

	public function test_validate_value_direct_non_string_input_required_is_invalid() {
		$this->set_object_property( $this->textarea_field, 'is_required', true );
		$non_string_value = array( 'an', 'array' );

		$this->textarea_field->validate_value( $non_string_value );
		$this->assertFalse( $this->textarea_field->is_valid );
		$label = $this->get_object_property( $this->textarea_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid string', 'quillbooking' ), $label ),
			$this->textarea_field->validation_err
		);
	}

	public function test_validate_value_direct_null_input_required_triggers_required_error() {
		$this->set_object_property( $this->textarea_field, 'is_required', true );
		$null_value = null;

		$this->textarea_field->validate_value( $null_value );
		$this->assertFalse( $this->textarea_field->is_valid );
		$label = $this->get_object_property( $this->textarea_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is required', 'quillbooking' ), $label ),
			$this->textarea_field->validation_err
		);
	}

	public function test_validate_value_direct_null_input_not_required_triggers_not_string_error() {
		$this->set_object_property( $this->textarea_field, 'is_required', false );
		$null_value = null;

		$this->textarea_field->validate_value( $null_value );
		$this->assertFalse( $this->textarea_field->is_valid );
		$label = $this->get_object_property( $this->textarea_field, 'label' );
		$this->assertEquals(
			sprintf( __( '%s is not a valid string', 'quillbooking' ), $label ),
			$this->textarea_field->validation_err
		);
	}
}
