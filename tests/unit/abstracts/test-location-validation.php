<?php

use QuillBooking\Abstracts\Location;
use QuillBooking\Managers\Fields_Manager;

/**
 * Mock field type class for testing validation
 */
class MockFieldType {
	public $is_valid       = true;
	public $validation_err = '';

	public function __construct( $args ) {
		// Store args
	}

	public function sanitize_field( $value ) {
		return $value;
	}

	public function validate_value( $value ) {
		if ( $value === 'invalid' ) {
			$this->is_valid       = false;
			$this->validation_err = 'Invalid value';
		}
	}
}

/**
 * For exception testing
 */
class ThrowingFieldType {
	public function __construct( $args ) {
		throw new \Exception( 'Test exception' );
	}
}

/**
 * Concrete implementation of Location for validation testing
 */
class ValidationTestLocation extends Location {
	public function __construct() {
		$this->title = 'Validation Test Location';
		$this->slug  = 'validation-test-location';
	}

	public function get_admin_fields() {
		// This will be mocked in tests
		return array();
	}
}

/**
 * @group abstracts
 */
class LocationValidationTest extends QuillBooking_Base_Test_Case {

	/**
	 * Mock of the Location class for testing
	 */
	private $mock_location;

	/**
	 * Mock field type class for testing validation
	 */
	private $fields_manager_mock;

	public function setUp(): void {
		parent::setUp();

		// Create a mock of the concrete implementation
		$this->mock_location = $this->getMockBuilder( ValidationTestLocation::class )
			->onlyMethods( array( 'get_admin_fields' ) )
			->getMock();

		// Create a mock Fields_Manager class
		$this->fields_manager_mock = $this->createMock( Fields_Manager::class );

		// Override the Fields_Manager instance
		$reflection        = new ReflectionClass( Fields_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, $this->fields_manager_mock );
	}

	public function test_validate_fields_with_invalid_field_type() {
		// Override get_admin_fields to return our test fields
		$this->mock_location->method( 'get_admin_fields' )
			->willReturn(
				array(
					'test_field' => array(
						'label'    => 'Test Field',
						'type'     => 'nonexistent_type',
						'required' => true,
					),
				)
			);

		// Override get_item method to return null for nonexistent field type
		$this->fields_manager_mock->expects( $this->once() )
			->method( 'get_item' )
			->willReturn( null );

		$test_data = array( 'fields' => array( 'test_field' => 'test_value' ) );
		$result    = $this->mock_location->validate_fields( $test_data );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_field_type', $result->get_error_code() );
	}

	public function test_validate_fields_with_invalid_value() {
		// Create a field type class for this test
		$test_class_name = 'InvalidValueFieldType';
		
		if (!class_exists($test_class_name)) {
			// Define a field type class with validate_value that sets is_valid to false
			eval("
				class $test_class_name {
					public \$is_valid = true;
					public \$validation_err = '';
					
					public function __construct(\$args) {
						// Constructor
					}
					
					public function sanitize_field(\$value) {
						return \$value;
					}
					
					public function validate_value(\$value) {
						\$this->is_valid = false;
						\$this->validation_err = 'Invalid value';
					}
				}
			");
		}
		
		// Override get_admin_fields to return our test fields
		$this->mock_location->method( 'get_admin_fields' )
			->willReturn(
				array(
					'test_field' => array(
						'label'    => 'Test Field',
						'type'     => 'text',
						'required' => true,
					),
				)
			);
			
		// Override the Fields_Manager to return our field class
		$this->fields_manager_mock->expects( $this->once() )
			->method( 'get_item' )
			->willReturn( $test_class_name );
		
		$test_data = array( 'fields' => array( 'test_field' => 'invalid' ) );
		$result = $this->mock_location->validate_fields( $test_data );
		
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'field_invalid', $result->get_error_code() );
	}

	public function test_validate_fields_with_exception() {
		// Create a field type class that will throw an exception
		$test_class_name = 'ExceptionFieldType';
		
		if (!class_exists($test_class_name)) {
			// Define a field type class that throws an exception in constructor
			eval("
				class $test_class_name {
					public function __construct(\$args) {
						throw new \\Exception('Test exception');
					}
				}
			");
		}
		
		// Override get_admin_fields to return our test fields
		$this->mock_location->method( 'get_admin_fields' )
			->willReturn(
				array(
					'test_field' => array(
						'label'    => 'Test Field',
						'type'     => 'throwing_type',
						'required' => true,
					),
				)
			);
			
		// Override the Fields_Manager to return our field class
		$this->fields_manager_mock->expects( $this->once() )
			->method( 'get_item' )
			->willReturn( $test_class_name );
		
		$test_data = array( 'fields' => array( 'test_field' => 'test_value' ) );
		$result = $this->mock_location->validate_fields( $test_data );
		
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'field_invalid', $result->get_error_code() );
		$this->assertEquals( 'Test exception', $result->get_error_message() );
	}

	public function test_validate_fields_with_valid_data() {
		// Create a field type class with valid behavior
		$test_class_name = 'ValidFieldType';
		
		if (!class_exists($test_class_name)) {
			// Define a field type class that has valid behavior
			eval("
				class $test_class_name {
					public \$is_valid = true;
					
					public function __construct(\$args) {
						// Constructor
					}
					
					public function sanitize_field(\$value) {
						return 'sanitized_value';
					}
					
					public function validate_value(\$value) {
						// Valid, do nothing
					}
				}
			");
		}
		
		// Override get_admin_fields to return our test fields
		$this->mock_location->method( 'get_admin_fields' )
			->willReturn(
				array(
					'test_field' => array(
						'label'    => 'Test Field',
						'type'     => 'text',
						'required' => true,
					),
				)
			);
			
		// Override the Fields_Manager to return our field class
		$this->fields_manager_mock->expects( $this->once() )
			->method( 'get_item' )
			->willReturn( $test_class_name );
		
		$test_data = array( 'fields' => array( 'test_field' => 'valid_value' ) );
		$result = $this->mock_location->validate_fields( $test_data );
		
		$this->assertIsArray( $result );
		$this->assertEquals( 'sanitized_value', $result['fields']['test_field'] );
	}
}
