<?php

namespace QuillBooking\Tests\Integration; // Match the namespace of the class being tested

// Use WP_UnitTestCase if you need the WP environment (e.g., for the Integration mock)
// Or use standard TestCase if WP environment isn't strictly needed for the mock
use WP_UnitTestCase;
// use PHPUnit\Framework\TestCase;

use QuillBooking\Integration\Remote_Data as AbstractRemoteData;
use QuillBooking\Integration\Integration; // Dependency for constructor

// --- Concrete implementation for testing ---
// Define this *outside* the test class or ensure autoloading if in separate file
class ConcreteRemoteDataForTesting extends AbstractRemoteData {

	// No abstract methods to implement in the parent

	// Helper method to access the protected property for assertion
	public function getIntegrationDependency(): Integration {
		return $this->integration;
	}
}
// --- End Concrete implementation ---


class Test_Integration_Remote_Data_Integration extends WP_UnitTestCase {
	// Or extends TestCase

	/**
	 * Mock object for the Integration dependency.
	 *
	 * @var Integration|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $integrationMock;

	protected function setUp(): void {
		parent::setUp(); // Needed for WP_UnitTestCase

		// Mock the Integration dependency required by the constructor
		$this->integrationMock = $this->createMock( Integration::class );
	}

	/**
	 * Test that the constructor correctly assigns the Integration dependency
	 * to the protected property.
	 */
	public function test_constructor_sets_integration_property() {
		// Arrange: $this->integrationMock is created in setUp

		// Act: Instantiate the concrete class using the mock
		$remoteData = new ConcreteRemoteDataForTesting( $this->integrationMock );

		// Assert: Check if the protected property holds the mock object instance
		// We use the public helper method added to the concrete test class
		$this->assertSame(
			$this->integrationMock,
			$remoteData->getIntegrationDependency(),
			'The Integration dependency was not correctly assigned in the constructor.'
		);

		// Alternative using Reflection API (if not adding helper method):
		// $reflection = new \ReflectionClass(AbstractRemoteData::class);
		// $property = $reflection->getProperty('integration');
		// $property->setAccessible(true);
		// $this->assertSame($this->integrationMock, $property->getValue($remoteData));
	}

	/**
	 * Test that the class is actually abstract and cannot be instantiated directly.
	 */
	public function test_class_is_abstract() {
		$reflection = new \ReflectionClass( AbstractRemoteData::class );
		$this->assertTrue(
			$reflection->isAbstract(),
			AbstractRemoteData::class . ' should be an abstract class.'
		);
	}
} // End Test Class
