<?php

use QuillBooking\Abstracts\Field_Type;
use QuillBooking\Traits\Entity_Properties;

/**
 * Concrete implementation of Field_Type for testing
 */
class TestMockField extends Field_Type {
	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Test Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'test';

	/**
	 * Make is_value_array public for testing
	 *
	 * @var boolean
	 */
	public $is_value_array = false;

	/**
	 * Public access to label for testing
	 *
	 * @var string
	 */
	public $public_label;

	/**
	 * Constructor override to expose protected properties for testing
	 */
	public function __construct( $args = array() ) {
		parent::__construct( $args );
		$this->public_label = $this->label;
	}

	/**
	 * Sanitize Field implementation
	 *
	 * @param mixed $value The value to sanitize
	 * @return mixed Sanitized value
	 */
	public function sanitize_field( $value ) {
		return is_string( $value ) ? trim( $value ) : $value;
	}

	/**
	 * Validate Value implementation
	 *
	 * @param mixed $value The value to validate
	 * @return void
	 */
	public function validate_value( $value ) {
		if ( empty( $value ) && $this->is_required ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is required', 'quillbooking' ), $this->public_label );
			return;
		}

		// Basic validation - can be extended for more complex tests
		if ( ! is_string( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s must be a string', 'quillbooking' ), $this->public_label );
		}
	}
}

/**
 * Field Type Test Class
 *
 * @group abstracts
 */
class FieldTypeTest extends QuillBooking_Base_Test_Case {
	/**
	 * Test field instance
	 *
	 * @var TestMockField
	 */
	private $field;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();
		$this->field = new TestMockField();
	}

	/**
	 * Test constructor sets default properties
	 */
	public function test_constructor_default_properties() {
		// Create with default args
		$field = new TestMockField();

		$this->assertFalse( $field->is_required, 'is_required should default to false' );
		$this->assertEquals( 'Test Field', $field->public_label, 'label should default to the name property' );
	}

	/**
	 * Test constructor with custom args
	 */
	public function test_constructor_with_args() {
		// Create with custom args
		$field = new TestMockField(
			array(
				'is_required' => true,
				'label'       => 'Custom Label',
			)
		);

		$this->assertTrue( $field->is_required, 'is_required should be set by constructor' );
		$this->assertEquals( 'Custom Label', $field->public_label, 'label should be set by constructor' );
	}

	/**
	 * Test validation with a valid value
	 */
	public function test_validate_value_valid() {
		$this->field->validate_value( 'valid value' );
		$this->assertTrue( $this->field->is_valid, 'is_valid should be true for valid value' );
		$this->assertNull( $this->field->validation_err, 'validation_err should be null for valid value' );
	}

	/**
	 * Test validation with an invalid value type
	 */
	public function test_validate_value_invalid_type() {
		$this->field->validate_value( 123 );
		$this->assertFalse( $this->field->is_valid, 'is_valid should be false for invalid value type' );
		$this->assertStringContainsString( 'must be a string', $this->field->validation_err, 'validation_err should contain error message' );
	}

	/**
	 * Test validation with a required field and empty value
	 */
	public function test_validate_value_required_empty() {
		// Set the field as required
		$this->field->is_required = true;

		$this->field->validate_value( '' );
		$this->assertFalse( $this->field->is_valid, 'is_valid should be false for empty required value' );
		$this->assertStringContainsString( 'required', $this->field->validation_err, 'validation_err should mention required' );
	}

	/**
	 * Test sanitize_field method properly trims string values
	 */
	public function test_sanitize_field() {
		$result = $this->field->sanitize_field( '  test value  ' );
		$this->assertEquals( 'test value', $result, 'sanitize_field should trim the string' );
	}

	/**
	 * Test format_value method returns value unchanged by default
	 */
	public function test_format_value() {
		$value = 'test value';
		$this->assertEquals( $value, $this->field->format_value( $value ), 'format_value should return the value unchanged by default' );
	}

	/**
	 * Test public properties are set correctly
	 */
	public function test_field_properties() {
		$this->assertEquals( 'Test Field', $this->field->name, 'name should be set correctly' );
		$this->assertEquals( 'test', $this->field->slug, 'slug should be set correctly' );
		$this->assertFalse( $this->field->has_options, 'has_options should default to false' );
		$this->assertFalse( $this->field->multiple, 'multiple should default to false' );
	}
}
