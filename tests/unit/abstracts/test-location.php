<?php

use QuillBooking\Abstracts\Location;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Managers\Fields_Manager;

/**
 * Concrete implementation of Location for testing
 */
class TestMockLocation extends Location {
	public function __construct() {
		$this->title = 'Test Location';
		$this->slug  = 'test-location';
	}

	public function get_admin_fields() {
		return array();
	}
}

/**
 * @group abstracts
 */
class LocationTest extends QuillBooking_Base_Test_Case {

	/**
	 * Mock of the abstract Location class for testing
	 */
	private $mock_location;

	public function setUp(): void {
		parent::setUp();

		// Create a concrete implementation of the abstract class
		$this->mock_location = new TestMockLocation();
	}

	public function test_singleton_instance() {
		// Use reflection to reset the instances array
		$reflection         = new ReflectionClass( Location::class );
		$instances_property = $reflection->getProperty( 'instances' );
		$instances_property->setAccessible( true );
		$instances_property->setValue( null, array() );

		// Get the instance
		$instance1 = TestMockLocation::instance();
		$instance2 = TestMockLocation::instance();

		$this->assertSame( $instance1, $instance2, 'The instance method should return the same instance each time' );
	}

	public function test_register_method() {
		// Create a mock Locations_Manager
		$locations_manager_mock = $this->createMock( Locations_Manager::class );

		// Use reflection to replace the Locations_Manager singleton
		$reflection        = new ReflectionClass( Locations_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, $locations_manager_mock );

		// Use reflection to call the protected register method
		$reflection = new ReflectionClass( $this->mock_location );
		$method     = $reflection->getMethod( 'register' );
		$method->setAccessible( true );

		// Set expectation for register_location
		$locations_manager_mock->expects( $this->once() )
			->method( 'register_location' )
			->with( $this->equalTo( $this->mock_location ) );

		$result = $method->invoke( $this->mock_location );

		$this->assertTrue( $result, 'The register method should return true on success' );
	}

	public function test_get_fields_returns_array() {
		$fields = $this->mock_location->get_fields();

		$this->assertIsArray( $fields, 'The get_fields method should return an array' );
	}

	public function test_validate_fields_with_no_admin_fields() {
		$test_data = array( 'some' => 'data' );
		$result    = $this->mock_location->validate_fields( $test_data );

		$this->assertSame( $test_data, $result, 'With no admin fields, the data should be returned unchanged' );
	}

	public function test_validate_fields_with_missing_required_field() {
		// Create a new mock that returns admin fields with required field
		$mock_location = $this->getMockBuilder( TestMockLocation::class )
			->onlyMethods( array( 'get_admin_fields' ) )
			->getMock();

		$mock_location->method( 'get_admin_fields' )
			->willReturn(
				array(
					'required_field' => array(
						'label'    => 'Required Field',
						'type'     => 'text',
						'required' => true,
					),
				)
			);

		$test_data = array( 'fields' => array() );
		$result    = $mock_location->validate_fields( $test_data );

		$this->assertInstanceOf( WP_Error::class, $result, 'Missing required field should return WP_Error' );
		$this->assertEquals( 'field_required', $result->get_error_code(), 'Error code should be field_required' );
	}

	public function test_validate_fields_with_valid_data() {
		// Create a test field type class
		$test_class_name = 'TestValidFieldType';
		
		if (!class_exists($test_class_name)) {
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
			
		// Create a mock location that returns admin fields
		$mock_location = $this->getMockBuilder( TestMockLocation::class )
			->onlyMethods( array( 'get_admin_fields' ) )
			->getMock();
			
		$mock_location->method( 'get_admin_fields' )
			->willReturn(
				array(
					'test_field' => array(
						'label'    => 'Test Field',
						'type'     => 'text',
						'required' => true,
					),
				)
			);
		
		// Mock the Fields_Manager to return our field type class
		$fields_manager = $this->createMock( Fields_Manager::class );
		$fields_manager->method( 'get_item' )
			->willReturn( $test_class_name );
			
		// Use reflection to replace the Fields_Manager singleton
		$reflection        = new ReflectionClass( Fields_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, $fields_manager );
		
		$test_data = array( 'fields' => array( 'test_field' => 'test_value' ) );
		
		// Run the validation
		$result = $mock_location->validate_fields( $test_data );
		
		// Verify the result
		$this->assertIsArray( $result, 'Valid data should return an array' );
		$this->assertArrayHasKey( 'fields', $result, 'Result should contain fields array' );
		$this->assertArrayHasKey( 'test_field', $result['fields'], 'Result should contain the test field' );
		$this->assertEquals( 'sanitized_value', $result['fields']['test_field'], 'Field should be sanitized' );
	}
}
