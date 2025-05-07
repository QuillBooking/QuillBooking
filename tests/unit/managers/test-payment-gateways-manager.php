<?php
/**
 * Class Payment_Gateways_Manager_Test
 *
 * @package QuillBooking
 * @group managers
 * @group payment-gateways
 */

use QuillBooking\Managers\Payment_Gateways_Manager;
use QuillBooking\Payment_Gateway\Payment_Gateway;

/**
 * Mock Payment Gateway implementation for testing
 */
class MockPaymentGateway extends Payment_Gateway {
	/**
	 * Constructor
	 *
	 * @param string $slug Slug
	 * @param string $name Name
	 * @param string $description Description
	 */
	public function __construct( $slug = 'mock-gateway', $name = 'Mock Gateway', $description = 'This is a mock payment gateway for testing' ) {
		$this->slug        = $slug;
		$this->name        = $name;
		$this->description = $description;
		parent::__construct();
	}

	/**
	 * Is gateway configured
	 *
	 * @return boolean
	 */
	public function is_configured() {
		return true;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'api_key'    => array(
				'type'        => 'text',
				'label'       => 'API Key',
				'placeholder' => 'Enter API Key',
				'required'    => true,
			),
			'secret_key' => array(
				'type'        => 'password',
				'label'       => 'Secret Key',
				'placeholder' => 'Enter Secret Key',
				'required'    => true,
			),
		);
	}
}

/**
 * Test for QuillBooking\Managers\Payment_Gateways_Manager class
 */
class Payment_Gateways_Manager_Test extends QuillBooking_Base_Test_Case {

	/**
	 * Instance of Payment_Gateways_Manager
	 *
	 * @var Payment_Gateways_Manager
	 */
	private $payment_gateways_manager;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset the Payment_Gateways_Manager singleton instance
		$reflection        = new ReflectionClass( Payment_Gateways_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, null );

		// Get a fresh instance
		$this->payment_gateways_manager = Payment_Gateways_Manager::instance();
	}

	/**
	 * Test singleton pattern
	 */
	public function test_singleton_pattern() {
		// Get the instance property using reflection
		$reflection        = new ReflectionClass( Payment_Gateways_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );

		// Get two instances
		$instance1 = Payment_Gateways_Manager::instance();
		$instance2 = Payment_Gateways_Manager::instance();

		// They should be the same object
		$this->assertSame( $instance1, $instance2, 'Singleton should return the same instance' );

		// Register a payment gateway in one instance
		$mock_payment_gateway = new MockPaymentGateway();
		$instance1->register_payment_gateway( $mock_payment_gateway );

		// Get it from the other instance
		$retrieved_payment_gateway = $instance2->get_item( 'mock-gateway' );

		// Should be the same payment gateway
		$this->assertSame( $mock_payment_gateway, $retrieved_payment_gateway, 'Payment gateway registered in one instance should be available in the other' );
	}

	/**
	 * Test register_payment_gateway method
	 */
	public function test_register_payment_gateway() {
		$mock_payment_gateway = new MockPaymentGateway();

		// Register the payment gateway
		$this->payment_gateways_manager->register_payment_gateway( $mock_payment_gateway );

		// Check that the payment gateway was registered
		$registered_payment_gateway = $this->payment_gateways_manager->get_item( 'mock-gateway' );

		$this->assertSame( $mock_payment_gateway, $registered_payment_gateway, 'The registered payment gateway should be retrievable' );

		// Check that the payment gateway options were correctly set
		$options = $this->payment_gateways_manager->get_options();

		$this->assertArrayHasKey( 'mock-gateway', $options, 'Options should include the payment gateway' );
		$this->assertArrayHasKey( 'name', $options['mock-gateway'], 'Options should include the name' );
		$this->assertArrayHasKey( 'description', $options['mock-gateway'], 'Options should include the description' );
		$this->assertArrayHasKey( 'settings', $options['mock-gateway'], 'Options should include the settings' );
		$this->assertArrayHasKey( 'fields', $options['mock-gateway'], 'Options should include the fields' );

		$this->assertEquals( 'Mock Gateway', $options['mock-gateway']['name'], 'Name should match' );
		$this->assertEquals( 'This is a mock payment gateway for testing', $options['mock-gateway']['description'], 'Description should match' );
		$this->assertIsArray( $options['mock-gateway']['settings'], 'Settings should be an array' );
		$this->assertIsArray( $options['mock-gateway']['fields'], 'Fields should be an array' );
	}

	/**
	 * Test register_payment_gateway with invalid object
	 */
	public function test_register_payment_gateway_with_invalid_object() {
		$this->expectException( TypeError::class );

		// Create an object that is not a Payment_Gateway
		$invalid_object = new stdClass();

		// Attempt to register it, should throw an exception
		$this->payment_gateways_manager->register_payment_gateway( $invalid_object );
	}

	/**
	 * Test getting items and options
	 */
	public function test_get_items_and_options() {
		// Create multiple mock payment gateways
		$gateway1 = new MockPaymentGateway( 'gateway-1', 'Gateway 1', 'First gateway' );
		$gateway2 = new MockPaymentGateway( 'gateway-2', 'Gateway 2', 'Second gateway' );
		$gateway3 = new MockPaymentGateway( 'gateway-3', 'Gateway 3', 'Third gateway' );

		// Register the payment gateways
		$this->payment_gateways_manager->register_payment_gateway( $gateway1 );
		$this->payment_gateways_manager->register_payment_gateway( $gateway2 );
		$this->payment_gateways_manager->register_payment_gateway( $gateway3 );

		// Get all payment gateways
		$gateways = $this->payment_gateways_manager->get_items();

		// Should have 3 payment gateways
		$this->assertCount( 3, $gateways, 'Should have 3 registered payment gateways' );

		// Check that all payment gateways are in the array
		$this->assertArrayHasKey( 'gateway-1', $gateways, 'Gateway 1 should be in the array' );
		$this->assertArrayHasKey( 'gateway-2', $gateways, 'Gateway 2 should be in the array' );
		$this->assertArrayHasKey( 'gateway-3', $gateways, 'Gateway 3 should be in the array' );

		// Check that the objects are the ones we registered
		$this->assertSame( $gateway1, $gateways['gateway-1'], 'Gateway 1 should be the same object' );
		$this->assertSame( $gateway2, $gateways['gateway-2'], 'Gateway 2 should be the same object' );
		$this->assertSame( $gateway3, $gateways['gateway-3'], 'Gateway 3 should be the same object' );

		// Get all options
		$options = $this->payment_gateways_manager->get_options();

		// Should have 3 sets of options
		$this->assertCount( 3, $options, 'Should have 3 sets of options' );

		// Check that all option sets are in the array
		$this->assertArrayHasKey( 'gateway-1', $options, 'Options for Gateway 1 should be in the array' );
		$this->assertArrayHasKey( 'gateway-2', $options, 'Options for Gateway 2 should be in the array' );
		$this->assertArrayHasKey( 'gateway-3', $options, 'Options for Gateway 3 should be in the array' );

		// Check that the options have the correct properties
		$this->assertEquals( 'Gateway 1', $options['gateway-1']['name'], 'Name for Gateway 1 should match' );
		$this->assertEquals( 'Gateway 2', $options['gateway-2']['name'], 'Name for Gateway 2 should match' );
		$this->assertEquals( 'Gateway 3', $options['gateway-3']['name'], 'Name for Gateway 3 should match' );
	}

	/**
	 * Test getting item by slug
	 */
	public function test_get_item() {
		$mock_payment_gateway = new MockPaymentGateway();

		// Register the payment gateway
		$this->payment_gateways_manager->register_payment_gateway( $mock_payment_gateway );

		// Get the payment gateway by slug
		$retrieved_gateway = $this->payment_gateways_manager->get_item( 'mock-gateway' );

		// Should be the same payment gateway
		$this->assertSame( $mock_payment_gateway, $retrieved_gateway, 'Should retrieve the correct payment gateway by slug' );

		// Try to get a non-existent payment gateway
		$non_existent_gateway = $this->payment_gateways_manager->get_item( 'non-existent' );

		// Should be null
		$this->assertNull( $non_existent_gateway, 'Should return null for non-existent payment gateway' );
	}
}
