<?php

/**
 * Test for Field_Type abstract class
 *
 * @package QuillBooking\Tests
 */

namespace QuillBooking\Tests\Fields;

use PHPUnit\Framework\TestCase;
use QuillBooking\Abstracts\Field_Type;
use QuillBooking_Base_Test_Case;

/**
 * Concrete implementation for testing the abstract class
 */
class Concrete_Field_Type extends Field_Type {

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
	 * Sanitize Field
	 *
	 * @param mixed $value Value to sanitize.
	 * @return mixed
	 */
	public function sanitize_field( $value ) {
		return sanitize_text_field( $value );
	}

	/**
	 * Validate Value
	 *
	 * @param mixed $value Value to validate.
	 * @return bool
	 */
	public function validate_value( $value ) {
		if ( $this->is_required && empty( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = sprintf( __( '%s is required', 'quillbooking' ), $this->label );
			return false;
		}
		return true;
	}

	/**
	 * Expose protected property for testing
	 *
	 * @return bool
	 */
	public function get_is_value_array() {
		return $this->is_value_array;
	}

	/**
	 * Set is_value_array for testing
	 *
	 * @param bool $value Value to set.
	 */
	public function set_is_value_array( $value ) {
		$this->is_value_array = (bool) $value;
	}

	/**
	 * Get label for testing
	 *
	 * @return string
	 */
	public function get_label() {
		return $this->label;
	}

	/**
	 * Set label for testing
	 *
	 * @param string $label Label to set.
	 */
	public function set_label( $label ) {
		$this->label = $label;
	}
}

/**
 * Class Field_Type_Test
 */
class Test_Abstract_Field_Type extends QuillBooking_Base_Test_Case {

	/**
	 * Test instance.
	 *
	 * @var Concrete_Field_Type
	 */
	protected $field;

	/**
	 * Set up test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock the sanitize_text_field function if needed
		if ( ! function_exists( 'sanitize_text_field' ) ) {
			function sanitize_text_field( $value ) {
				return trim( strip_tags( $value ) );
			}
		}

		// Mock the __ function if needed
		if ( ! function_exists( '__' ) ) {
			function __( $text, $domain ) {
				return $text;
			}
		}

		$this->field = new Concrete_Field_Type();
	}

	/**
	 * Test constructor.
	 */
	public function testConstructor() {
		// Test default constructor values
		$this->assertFalse( $this->field->is_required );
		$this->assertEquals( 'Test Field', $this->field->get_label() );

		// Test constructor with arguments
		$args  = array(
			'is_required' => true,
			'label'       => 'Custom Label',
		);
		$field = new Concrete_Field_Type( $args );
		$this->assertTrue( $field->is_required );
		$this->assertEquals( 'Custom Label', $field->get_label() );
	}

	/**
	 * Test is_value_array method.
	 */
	public function testIsValueArray() {
		// Default value
		$this->assertFalse( $this->field->is_value_array() );

		// Change value and test again
		$this->field->set_is_value_array( true );
		$this->assertTrue( $this->field->is_value_array() );
	}

	/**
	 * Test validate_value method.
	 */
	public function testValidateValue() {
		// Test with non-required field and empty value
		$this->assertTrue( $this->field->validate_value( '' ) );
		$this->assertTrue( $this->field->is_valid );
		$this->assertNull( $this->field->validation_err );

		// Test with required field and empty value
		$this->field->is_required = true;
		$this->assertFalse( $this->field->validate_value( '' ) );
		$this->assertFalse( $this->field->is_valid );
		$this->assertEquals( 'Test Field is required', $this->field->validation_err );

		// Reset and test with required field and non-empty value
		$this->field->is_valid       = true;
		$this->field->validation_err = null;
		$this->assertTrue( $this->field->validate_value( 'test value' ) );
		$this->assertTrue( $this->field->is_valid );
		$this->assertNull( $this->field->validation_err );
	}

	/**
	 * Test sanitize_field method.
	 */
	public function testSanitizeField() {
		$this->assertEquals( 'test', $this->field->sanitize_field( 'test' ) );
		$this->assertEquals( 'test', $this->field->sanitize_field( ' test ' ) );
		$this->assertEquals( 'test', $this->field->sanitize_field( '<p>test</p>' ) );
	}

	/**
	 * Test format_value method.
	 */
	public function testFormatValue() {
		$value = 'test value';
		$this->assertEquals( $value, $this->field->format_value( $value ) );
	}

	/**
	 * Test protected properties access with reflection.
	 */
	public function testProtectedPropertiesWithReflection() {
		// Use reflection to modify protected properties
		$reflection = new \ReflectionClass( $this->field );
		$property   = $reflection->getProperty( 'label' );
		$property->setAccessible( true );
		$property->setValue( $this->field, 'Reflection Label' );

		// Verify the change worked
		$this->assertEquals( 'Reflection Label', $this->field->get_label() );
	}
}
