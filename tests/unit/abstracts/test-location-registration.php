<?php

use QuillBooking\Abstracts\Location;
use QuillBooking\Managers\Locations_Manager;

/**
 * Mock concrete location implementation for testing
 */
class TestLocation extends Location {
	public function __construct() {
		$this->title = 'Test Registration Location';
		$this->slug  = 'test-registration';
	}

	public function get_admin_fields() {
		return array(
			'test_field' => array(
				'label'    => 'Test Field',
				'type'     => 'text',
				'required' => true,
			),
		);
	}

	public function get_fields() {
		return array(
			'frontend_field' => array(
				'label' => 'Frontend Field',
				'type'  => 'text',
			),
		);
	}
}

/**
 * @group abstracts
 */
class LocationRegistrationTest extends QuillBooking_Base_Test_Case {

	/**
	 * Test location instance
	 */
	private $test_location;

	/**
	 * Locations Manager mock
	 */
	private $locations_manager_mock;

	public function setUp(): void {
		parent::setUp();

		// Create a concrete implementation of the abstract class
		$this->test_location = new TestLocation();

		// Create a mock of the Locations_Manager
		$this->locations_manager_mock = $this->createMock( Locations_Manager::class );

		// Use reflection to replace the Locations_Manager singleton
		$reflection        = new ReflectionClass( Locations_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, $this->locations_manager_mock );
	}

	public function test_instance_creates_singleton() {
		// Access the instances property in the parent class (Location)
		$reflection         = new ReflectionClass( Location::class );
		$instances_property = $reflection->getProperty( 'instances' );
		$instances_property->setAccessible( true );

		// Clear any existing instances
		$instances_property->setValue( null, array() );

		// Get an instance
		$instance1 = TestLocation::instance();

		// Get instances array
		$instances = $instances_property->getValue();

		// Check that the class is in the instances array
		$this->assertArrayHasKey( TestLocation::class, $instances );

		// Get another instance and check it's the same
		$instance2 = TestLocation::instance();
		$this->assertSame( $instance1, $instance2 );
	}

	public function test_register_calls_locations_manager() {
		// Expect register_location to be called once with the location object
		$this->locations_manager_mock->expects( $this->once() )
			->method( 'register_location' )
			->with( $this->equalTo( $this->test_location ) );

		// Call register via reflection
		$reflection = new ReflectionClass( $this->test_location );
		$method     = $reflection->getMethod( 'register' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->test_location );

		$this->assertTrue( $result );
	}

	public function test_register_handles_exceptions() {
		// Make register_location throw an exception
		$this->locations_manager_mock->expects( $this->once() )
			->method( 'register_location' )
			->will( $this->throwException( new \Exception( 'Test exception' ) ) );

		// Call register via reflection
		$reflection = new ReflectionClass( $this->test_location );
		$method     = $reflection->getMethod( 'register' );
		$method->setAccessible( true );

		$result = $method->invoke( $this->test_location );

		$this->assertFalse( $result );
	}

	public function test_instance_registers_location() {
		// Expect register_location to be called exactly once
		$this->locations_manager_mock->expects( $this->once() )
			->method( 'register_location' );

		// Clear any existing instances
		$reflection         = new ReflectionClass( Location::class );
		$instances_property = $reflection->getProperty( 'instances' );
		$instances_property->setAccessible( true );
		$instances_property->setValue( null, array() );

		// Call instance method which should also register the location
		TestLocation::instance();
	}
}
