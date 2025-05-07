<?php
/**
 * Class Locations_Manager_Test
 *
 * @package QuillBooking
 * @group managers
 */

use QuillBooking\Abstracts\Location;
use QuillBooking\Managers\Locations_Manager;

/**
 * Mock Location implementation for testing
 */
class MockTestLocation extends Location {
	/**
	 * Constructor
	 *
	 * @param string $slug
	 * @param string $title
	 * @param bool   $is_integration
	 */
	public function __construct( $slug = 'mock-location', $title = 'Mock Location', $is_integration = false ) {
		$this->slug           = $slug;
		$this->title          = $title;
		$this->is_integration = $is_integration;
	}

	/**
	 * Get admin fields
	 *
	 * @return array
	 */
	public function get_admin_fields() {
		return array(
			'field1' => array(
				'label' => 'Field 1',
				'type'  => 'text',
			),
		);
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'field1' => array(
				'label' => 'Field 1',
				'type'  => 'text',
			),
		);
	}
}

/**
 * Test for QuillBooking\Managers\Locations_Manager class
 */
class Locations_Manager_Test extends QuillBooking_Base_Test_Case {

	/**
	 * Instance of Locations_Manager
	 *
	 * @var Locations_Manager
	 */
	private $locations_manager;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset the Locations_Manager singleton instance
		$reflection        = new ReflectionClass( Locations_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, null );

		// Get a fresh instance
		$this->locations_manager = Locations_Manager::instance();
	}

	/**
	 * Test singleton pattern
	 */
	public function test_singleton_pattern() {
		// Get the instance property using reflection
		$reflection        = new ReflectionClass( Locations_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );

		// Get two instances
		$instance1 = Locations_Manager::instance();
		$instance2 = Locations_Manager::instance();

		// They should be the same object
		$this->assertSame( $instance1, $instance2, 'Singleton should return the same instance' );

		// Register a location in one instance
		$mock_location = new MockTestLocation();
		$instance1->register_location( $mock_location );

		// Get it from the other instance
		$retrieved_location = $instance2->get_location( 'mock-location' );

		// Should be the same location
		$this->assertSame( $mock_location, $retrieved_location, 'Location registered in one instance should be available in the other' );
	}

	/**
	 * Test the register_location method
	 */
	public function test_register_location() {
		$mock_location = new MockTestLocation();

		// Register the location
		$this->locations_manager->register_location( $mock_location );

		// Check that the location was registered
		$registered_location = $this->locations_manager->get_location( 'mock-location' );

		$this->assertSame( $mock_location, $registered_location, 'The registered location should be retrievable' );
	}

	/**
	 * Test register_location with invalid location object
	 */
	public function test_register_location_with_invalid_object() {
		$this->expectException( TypeError::class );

		// Create an object that is not a Location
		$invalid_object = new stdClass();

		// Attempt to register it, should throw an exception
		$this->locations_manager->register_location( $invalid_object );
	}

	/**
	 * Test registering a location with the same slug twice
	 */
	public function test_register_location_with_same_slug_twice() {
		// Create two locations with the same slug
		$location1 = new MockTestLocation( 'same-slug', 'Location 1' );
		$location2 = new MockTestLocation( 'same-slug', 'Location 2' );

		// Register the first location
		$this->locations_manager->register_location( $location1 );

		// Register the second location with the same slug
		$this->locations_manager->register_location( $location2 );

		// Get all locations
		$locations = $this->locations_manager->get_locations();

		// There should only be one location with the 'same-slug' key
		$this->assertCount( 1, $locations, 'There should be only one registered location' );
		$this->assertArrayHasKey( 'same-slug', $locations, 'The location should be registered with the right slug' );

		// The first registered location should be kept, not the second one
		$this->assertSame( $location1, $locations['same-slug'], 'The first registered location should be kept' );
		$this->assertNotSame( $location2, $locations['same-slug'], 'The second location should not be registered' );
	}

	/**
	 * Test the get_location method with valid slug
	 */
	public function test_get_location_with_valid_slug() {
		$mock_location = new MockTestLocation();

		// Register the location
		$this->locations_manager->register_location( $mock_location );

		// Get the location
		$retrieved_location = $this->locations_manager->get_location( 'mock-location' );

		$this->assertSame( $mock_location, $retrieved_location, 'The location should be retrievable by slug' );
	}

	/**
	 * Test the get_location method with invalid slug
	 */
	public function test_get_location_with_invalid_slug() {
		// Try to get a location that doesn't exist
		$location = $this->locations_manager->get_location( 'nonexistent-location' );

		$this->assertNull( $location, 'Non-existent location should return null' );
	}

	/**
	 * Test the get_locations method
	 */
	public function test_get_locations() {
		// Create multiple mock locations
		$location1 = new MockTestLocation( 'location-1', 'Location 1' );
		$location2 = new MockTestLocation( 'location-2', 'Location 2' );
		$location3 = new MockTestLocation( 'location-3', 'Location 3' );

		// Register all locations
		$this->locations_manager->register_location( $location1 );
		$this->locations_manager->register_location( $location2 );
		$this->locations_manager->register_location( $location3 );

		// Get all locations
		$locations = $this->locations_manager->get_locations();

		// Assert that all locations are in the returned array
		$this->assertCount( 3, $locations, 'There should be 3 registered locations' );
		$this->assertArrayHasKey( 'location-1', $locations, 'Location 1 should be in the returned array' );
		$this->assertArrayHasKey( 'location-2', $locations, 'Location 2 should be in the returned array' );
		$this->assertArrayHasKey( 'location-3', $locations, 'Location 3 should be in the returned array' );
		$this->assertSame( $location1, $locations['location-1'], 'Location 1 should match the registered location' );
		$this->assertSame( $location2, $locations['location-2'], 'Location 2 should match the registered location' );
		$this->assertSame( $location3, $locations['location-3'], 'Location 3 should match the registered location' );
	}

	/**
	 * Test the get_locations method when no locations are registered
	 */
	public function test_get_locations_when_empty() {
		// Get all locations without registering any
		$locations = $this->locations_manager->get_locations();

		$this->assertIsArray( $locations, 'Method should return an array even when empty' );
		$this->assertEmpty( $locations, 'The array should be empty when no locations are registered' );
	}

	/**
	 * Test that locations are properly stored with their options
	 */
	public function test_location_options_are_stored() {
		$mock_location = new MockTestLocation( 'option-test', 'Option Test', true );

		// Register the location
		$this->locations_manager->register_location( $mock_location );

		// Get options using reflection
		$reflection       = new ReflectionClass( $this->locations_manager );
		$options_property = $reflection->getProperty( 'options' );
		$options_property->setAccessible( true );
		$options = $options_property->getValue( $this->locations_manager );

		// Check that options were stored correctly
		$this->assertArrayHasKey( 'option-test', $options, 'Options should be stored for the location' );
		$this->assertEquals( 'Option Test', $options['option-test']['title'], 'Title option should match' );
		$this->assertTrue( $options['option-test']['is_integration'], 'is_integration option should match' );
		$this->assertEquals( $mock_location->get_admin_fields(), $options['option-test']['fields'], 'fields option should match' );
		$this->assertEquals( $mock_location->get_fields(), $options['option-test']['frontend_fields'], 'frontend_fields option should match' );
	}
}
