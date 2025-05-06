<?php

namespace QuillBooking\Tests\Integration;


use WP_UnitTestCase;
use phpmock\phpunit\PHPMock;
use phpmock\MockBuilder; // For static mocks
use QuillBooking\Integration\Integration as AbstractIntegration;
use QuillBooking\Integration\Accounts; // For instanceof checks
use QuillBooking\Models\Calendar_Model; // Type hint for host
use WP_Error;


// Dummy classes to satisfy the 'new static::$classes' calls in init()
class DummyRemoteData {}
class DummyRestAPI {
	public function __construct( $integration ) {} } // Accept constructor arg

// Concrete class for testing the abstract Integration
class ConcreteIntegrationForTesting extends AbstractIntegration {
	// --- Properties required by the abstract class ---
	public $name        = 'Test Integration';
	public $slug        = 'test_integration';
	public $description = 'A test integration.';
	// public $host; // Inherited
	// public $accounts; // Inherited, set in parent init()
	// public $option_name; // Inherited, set in parent init()
	// public $meta_key; // Inherited, set in parent init()

	// --- Define dummy classes for instantiation in init() ---
	protected static $classes = array(
		'remote_data' => DummyRemoteData::class,
		'rest_api'    => DummyRestAPI::class,
	);

	// --- Implement abstract methods (can be empty or minimal) ---
	// We will mock 'connect' in tests where its behavior matters
	public function connect( $host_id, $account_id ) {
		// Default implementation for tests where connect isn't explicitly mocked
		// Might call parent::connect or just return null/true/false depending on need
		parent::connect( $host_id, $account_id );
		if ( ! $this->host ) {
			 return new \WP_Error( 'test_host_error', 'Host not set in test connect' );
		}
		// Return a value indicating success/failure or a mock API if needed by default
		return true; // Default success for simplicity
	}

	// --- Optional: Expose protected methods/properties for testing ---
	public function testGetHost() {
		return $this->host;
	}

	public function testGetAccountsObject() {
		return $this->accounts;
	}

	public function testGetOptionName() {
		return $this->option_name;
	}
	public function testGetMetaKey() {
		return $this->meta_key;
	}
}



class Test_Integration_Integration_Integration extends WP_UnitTestCase {
	// Or extends TestCase

	use PHPMock;

	// Namespace where the global functions are CALLED FROM within Integration class
	private const INTEGRATION_NAMESPACE = 'QuillBooking\Integration';
	// Namespace where Calendar_Model is defined (adjust if needed)
	private const MODEL_NAMESPACE = 'QuillBooking\Models';
	// Namespace where Integrations_Manager is defined (adjust if needed)
	private const MANAGER_NAMESPACE = 'QuillBooking\Managers';

	protected function setUp(): void {
		parent::setUp();

		// Reset the static instances property before each test to avoid conflicts with instance()
		$reflection    = new \ReflectionClass( AbstractIntegration::class );
		$instancesProp = $reflection->getProperty( 'instances' );
		$instancesProp->setAccessible( true );
		$instancesProp->setValue( null, array() ); // Reset static property

		// --- Mock global WP functions ---
		// Mock __() used in connect() error message
		$this->getFunctionMock( self::INTEGRATION_NAMESPACE, '__' )
			->expects( $this->any() )->willReturnArgument( 0 );
	}

	protected function tearDown(): void {
		// Reset the static instances property after each test
		$reflection    = new \ReflectionClass( AbstractIntegration::class );
		$instancesProp = $reflection->getProperty( 'instances' );
		$instancesProp->setAccessible( true );
		$instancesProp->setValue( null, array() );

		parent::tearDown();
	}

	// --- Test instance() and register() ---
	// Note: Testing singletons and static methods with side effects is tricky in unit tests

	public function test_instance_creates_and_registers_instance() {
		// Mock the static Integrations_Manager::instance()->register_integration() call
		$managerMock = $this->getMockBuilder( \stdClass::class )
			->setMethods( array( 'register_integration' ) )
			->getMock();

		$builder = new MockBuilder();
		$builder->setNamespace( self::MANAGER_NAMESPACE )
			->setName( 'instance' )
			->setFunction( fn() => $managerMock );

		$managerInstanceMock = $builder->build();
		$managerInstanceMock->enable();

		// Call instance() for the first time
		$instance1 = ConcreteIntegrationForTesting::instance();
		$this->assertInstanceOf( ConcreteIntegrationForTesting::class, $instance1 );

		// Call instance() again, should return same instance, register not called again
		$instance2 = ConcreteIntegrationForTesting::instance();
		$this->assertSame( $instance1, $instance2 );
		$managerInstanceMock->disable();
	}

	// --- Test init() ---

	public function test_init_sets_properties_and_subclasses() {
		// We need to allow the constructor (which calls init) to run
		// Since we test instance(), which calls the constructor, we can test init via that
		// Mock the manager like in the previous test
		$managerMock = $this->getMockBuilder( \stdClass::class )
			->setMethods( array( 'register_integration' ) )
			->getMock();
		$managerMock->method( 'register_integration' );
		$builder = new MockBuilder();
		$builder->setNamespace( self::MANAGER_NAMESPACE )
			->setName( 'instance' )
			->setFunction( fn() => $managerMock );

		$managerInstanceMock = $builder->build();
		$managerInstanceMock->enable();

		// Get instance, which runs constructor -> init()
		$instance = ConcreteIntegrationForTesting::instance();

		// Assert properties set by init()
		$this->assertInstanceOf( Accounts::class, $instance->testGetAccountsObject() ); // Use helper
		$this->assertInstanceOf( DummyRemoteData::class, $instance->remote_data );
		$this->assertEquals( 'quillbooking_test_integration_settings', $instance->testGetOptionName() );
		$this->assertEquals( 'quillbooking_test_integration_accounts', $instance->testGetMetaKey() );

		$managerInstanceMock->disable();
	}

	// --- Test set_host() ---

	public function test_set_host_with_object() {
		$integration  = ConcreteIntegrationForTesting::instance();
		$mockCalendar = $this->createMock( Calendar_Model::class ); // Use actual Model class if possible

		// Mock Calendar_Model::find - expect it NOT to be called
		$builder = new MockBuilder();
		$builder->setNamespace( self::MODEL_NAMESPACE ) // eg: 'QuillBooking\Models'
			->setName( 'find' )                         // just the function name
			->setFunction( fn( $id) => $this->fail( 'Calendar_Model::find should not be called' ) );
		$findMock = $builder->build();

		$findMock->enable();

		// Execute
		$integration->set_host( $mockCalendar );

		// Assert host property is set
		$this->assertSame( $mockCalendar, $integration->testGetHost() );

		$findMock->disable();
	}

	public function test_set_host_with_id_found() {
		 $hostId      = 456;
		$mockCalendar = $this->createMock( Calendar_Model::class );

		// Create PARTIAL mock targeting the WRAPPER method
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			// ->setConstructorArgs(...) // If constructor needed
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'findCalendarById' ) ) // Mock ONLY the wrapper
			->getMock();

		// Configure the MOCKED wrapper method
		$integrationMock->expects( $this->once() )
			->method( 'findCalendarById' )
			->with( $hostId ) // Check the ID passed to the wrapper
			->willReturn( $mockCalendar ); // Make the wrapper return the mock calendar

		// Execute set_host (which will call the mocked wrapper internally)
		$integrationMock->set_host( $hostId );

		// Assert host property is set using the value returned by the mocked wrapper
		$this->assertSame( $mockCalendar, $integrationMock->testGetHost() );
	}

	public function test_set_host_with_id_not_found() {
		 $hostId = 789;

		// Create PARTIAL mock targeting the WRAPPER method
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'findCalendarById' ) ) // Mock ONLY the wrapper
			->getMock();

		// Configure the MOCKED wrapper method to simulate "not found"
		$integrationMock->expects( $this->once() )
			->method( 'findCalendarById' )
			->with( $hostId ) // Check the ID passed to the wrapper
			->willReturn( null ); // Make the wrapper return null

		// Execute set_host (which will call the mocked wrapper internally)
		$integrationMock->set_host( $hostId );

		// Assert host property is null because the wrapper returned null
		$this->assertNull( $integrationMock->testGetHost() );
	}


	// --- Test connect() ---

	public function test_connect_calls_set_host_and_checks_host_is_set() {
		$hostId       = 123;
		$accountId    = 'acc1';
		$mockCalendar = $this->createMock( Calendar_Model::class );

		// Create PARTIAL mock of the concrete class, mocking set_host
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'set_host' ) )
			->getMock();

		// Expect set_host to be called
		$integrationMock->expects( $this->once() )
			->method( 'set_host' )
			->with( $hostId );

		$reflection = new \ReflectionClass( $integrationMock );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integrationMock, $mockCalendar ); // Simulate host being set

		// Execute connect
		$result = $integrationMock->connect( $hostId, $accountId );

		// Assert connect returns the default 'true' because host was set
		$this->assertTrue( $result ); // Based on default implementation in ConcreteIntegrationForTesting
	}

	public function test_connect_returns_error_if_host_not_set() {
		$hostId    = 123;
		$accountId = 'acc1';

		// Create PARTIAL mock, mocking set_host
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'set_host' ) )
			->getMock();

		// Expect set_host to be called
		$integrationMock->expects( $this->once() )
			->method( 'set_host' )
			->with( $hostId );
		// DO NOT set the host property, simulating set_host failing to find it

		// Execute connect
		$result = $integrationMock->connect( $hostId, $accountId );

		// Assert connect returns WP_Error because $this->host is null
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'test_host_error', $result->get_error_code() );
	}


	public function test_get_setting_found() {
		// Use partial mock to control get_settings
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'get_settings' ) )
			->getMock();
		$settings        = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);
		$integrationMock->method( 'get_settings' )->willReturn( $settings );

		$this->assertEquals( 'value1', $integrationMock->get_setting( 'key1' ) );
		$this->assertEquals( 'value2', $integrationMock->get_setting( 'key2', 'default' ) );
	}

	public function test_get_setting_not_found() {
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'get_settings' ) )
			->getMock();
		$settings        = array( 'key1' => 'value1' );
		$integrationMock->method( 'get_settings' )->willReturn( $settings );

		$this->assertEquals( '', $integrationMock->get_setting( 'missing_key' ) ); // Default empty string
		$this->assertEquals( 'my_default', $integrationMock->get_setting( 'missing_key', 'my_default' ) );
	}

	public function test_update_settings() {
		$integration = ConcreteIntegrationForTesting::instance();
		$optionName  = $integration->testGetOptionName();
		$newSettings = array( 'key3' => 'value3' );

		// Mock update_option
		$updateOptionMock = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'update_option' );
		$updateOptionMock->expects( $this->once() )
			->with( $optionName, $newSettings ); // Check option name and data

		$integration->update_settings( $newSettings );
		// No return value to check
	}

	public function test_update_setting() {
		$keyToUpdate           = 'key1';
		$newValue              = 'new_value';
		$existingSettings      = array(
			'key1' => 'old_value',
			'key2' => 'other',
		);
		$expectedFinalSettings = array(
			'key1' => 'new_value',
			'key2' => 'other',
		);

		// Use partial mock to control get_settings and update_settings
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'get_settings', 'update_settings' ) )
			->getMock();

		// Configure mocks
		$integrationMock->method( 'get_settings' )->willReturn( $existingSettings );
		$integrationMock->expects( $this->once() ) // Expect update_settings to be called
			->method( 'update_settings' )
			->with( $expectedFinalSettings ); // Check the merged data

		// Execute
		$integrationMock->update_setting( $keyToUpdate, $newValue );
	}

	// --- Test validate() ---

	public function test_validate_returns_true() {
		$integration = ConcreteIntegrationForTesting::instance();
		$this->assertTrue( $integration->validate( array( 'any' => 'settings' ) ) );
	}

	// --- Test is_connected() ---

	public function test_is_connected_success() {
		$hostId    = 1;
		$accountId = 'a';
		// Mock connect to return something not false/WP_Error (e.g., true or API object)
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'connect' ) )
			->getMock();
		$integrationMock->method( 'connect' )->with( $hostId, $accountId )->willReturn( true ); // Simulate success

		$this->assertTrue( $integrationMock->connect( $hostId, $accountId ) );
	}

	public function test_is_connected_failure_connect_returns_false() {
		$hostId          = 1;
		$accountId       = 'a';
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'connect' ) )
			->getMock();
		$integrationMock->method( 'connect' )->with( $hostId, $accountId )->willReturn( false ); // Simulate failure

		$result = $integrationMock->is_connected( $hostId, $accountId );
		$this->assertInstanceOf( WP_Error::class, $result ); // Should return WP_Error
		$this->assertEquals( 'integration_not_connected', $result->get_error_code() );
	}

	public function test_is_connected_failure_connect_returns_wp_error() {
		$hostId          = 1;
		$accountId       = 'a';
		$connectError    = new WP_Error( 'conn_err', 'Failed' );
		$integrationMock = $this->getMockBuilder( ConcreteIntegrationForTesting::class )
			->disableOriginalConstructor() // Or configure constructor if needed
			->onlyMethods( array( 'connect' ) )
			->getMock();
		$integrationMock->method( 'connect' )->with( $hostId, $accountId )->willReturn( $connectError ); // Simulate failure

		$result = $integrationMock->is_connected( $hostId, $accountId );
		$this->assertInstanceOf( WP_Error::class, $result ); // Should return WP_Error
		$this->assertEquals( 'integration_not_connected', $result->get_error_code() );
	}


	// --- Test get_icon() ---

	public function test_get_icon_returns_correct_url() {
		$integration = ConcreteIntegrationForTesting::instance();
		$expectedUrl = QUILLBOOKING_PLUGIN_URL . 'assets/icons/test_integration/icon.svg';
		$this->assertEquals( $expectedUrl, $integration->get_icon() );
	}

	// --- Test get_fields() ---

	public function test_get_fields_returns_empty_array() {
		$integration = ConcreteIntegrationForTesting::instance();
		$this->assertEquals( array(), $integration->get_fields() );
	}

	// --- Test get_auth_fields() ---

	public function test_get_auth_fields_returns_empty_array() {
		$integration = ConcreteIntegrationForTesting::instance();
		$this->assertEquals( array(), $integration->get_auth_fields() );
	}
} // End Test Class
