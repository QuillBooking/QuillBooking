<?php
/**
 * Tests for the Payment_Gateway abstract class
 *
 * @package QuillBooking\Tests
 */

use QuillBooking\Payment_Gateway\Payment_Gateway;
use QuillBooking\Managers\Payment_Gateways_Manager;

/**
 * Mock Payment Gateway for testing
 */
class Test_Mock_Payment_Gateway extends Payment_Gateway {
	/**
	 * Payment Gateway Name
	 *
	 * @var string
	 */
	public $name = 'Test Gateway';

	/**
	 * Payment Gateway Slug
	 *
	 * @var string
	 */
	public $slug = 'test_gateway';

	/**
	 * Payment Gateway Description
	 *
	 * @var string
	 */
	public $description = 'Test Payment Gateway';

	/**
	 * Configuration state
	 *
	 * @var boolean
	 */
	private $configured = true;

	/**
	 * Mode settings
	 *
	 * @var array
	 */
	private $mode_settings = array(
		'mode'    => 'test',
		'api_key' => 'test_api_key',
	);

	/**
	 * Constructor
	 *
	 * @param boolean $configured Optional. Whether the gateway is configured. Default true.
	 */
	public function __construct( $configured = true ) {
		parent::__construct();
		$this->configured = $configured;
	}

	/**
	 * Is gateway and method configured
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public function is_configured() {
		return $this->configured;
	}

	/**
	 * Set configured state
	 *
	 * @since 1.0.0
	 *
	 * @param boolean $configured Whether the gateway is configured.
	 * @return void
	 */
	public function set_configured( $configured ) {
		$this->configured = $configured;
	}

	/**
	 * Get mode settings
	 *
	 * @since 1.0.0
	 *
	 * @return array|false
	 */
	public function get_mode_settings() {
		if ( ! $this->is_configured() ) {
			return false;
		}
		return $this->mode_settings;
	}

	/**
	 * Set mode settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Mode settings.
	 * @return void
	 */
	public function set_mode_settings( $settings ) {
		$this->mode_settings = $settings;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'api_key' => array(
				'type'     => 'text',
				'label'    => 'API Key',
				'required' => true,
			),
			'sandbox' => array(
				'type'    => 'checkbox',
				'label'   => 'Sandbox Mode',
				'default' => true,
			),
		);
	}
}

/**
 * Mock Payment Gateway with custom validation
 */
class Test_Mock_Payment_Gateway_With_Validation extends Test_Mock_Payment_Gateway {
	/**
	 * Custom validation implementation
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 *
	 * @return bool
	 */
	public function validate( $settings ) {
		// Check if API key is present and not empty
		if ( empty( $settings['api_key'] ) ) {
			return false;
		}

		return true;
	}
}

/**
 * Payment Gateway Test Case
 */
class Test_Payment_Gateway extends WP_UnitTestCase {

	/**
	 * Test instance
	 *
	 * @var Test_Mock_Payment_Gateway
	 */
	private $gateway;

	/**
	 * Set up each test
	 */
	public function setUp(): void {
		parent::setUp();
		$this->gateway = new Test_Mock_Payment_Gateway();
	}

	/**
	 * Clean up after each test
	 */
	public function tearDown(): void {
		parent::tearDown();
		delete_option( $this->gateway->option_name );
	}

	/**
	 * Test instance creation
	 */
	public function test_instance() {
		$gateway = Test_Mock_Payment_Gateway::instance();
		$this->assertInstanceOf( Test_Mock_Payment_Gateway::class, $gateway );

		// Second call should return the same instance
		$gateway2 = Test_Mock_Payment_Gateway::instance();
		$this->assertSame( $gateway, $gateway2 );
	}

	/**
	 * Test registration with manager
	 */
	public function test_gateway_registration() {
		// Call instance to trigger registration
		$gateway = Test_Mock_Payment_Gateway::instance();

		// Check if gateway is registered with the manager
		$manager             = Payment_Gateways_Manager::instance();
		$registered_gateways = $manager->get_items();

		// Verify our gateway exists in the registered gateways
		$this->assertArrayHasKey( 'test_gateway', $registered_gateways );
		$this->assertSame( $gateway, $registered_gateways['test_gateway'] );

		// Test other registration metadata
		$options = $manager->get_options();
		$meta    = $options['test_gateway'] ?? array();
		$this->assertEquals( 'Test Gateway', $meta['name'] );
		$this->assertEquals( 'Test Payment Gateway', $meta['description'] );
		$this->assertEquals( array(), $meta['settings'] );
		$this->assertEquals( $gateway->get_fields(), $meta['fields'] );
	}

	/**
	 * Test gateway properties
	 */
	public function test_gateway_properties() {
		$this->assertEquals( 'Test Gateway', $this->gateway->name );
		$this->assertEquals( 'test_gateway', $this->gateway->slug );
		$this->assertEquals( 'Test Payment Gateway', $this->gateway->description );
		$this->assertEquals( 'quillbooking_test_gateway_settings', $this->gateway->option_name );
	}

	/**
	 * Test settings methods
	 */
	public function test_settings() {
		// Default empty settings
		$this->assertEquals( array(), $this->gateway->get_settings() );

		// Test updating settings
		$test_settings = array(
			'api_key' => 'test_api_key',
			'sandbox' => true,
		);

		$this->gateway->update_settings( $test_settings );
		$this->assertEquals( $test_settings, $this->gateway->get_settings() );

		// Test getting individual setting
		$this->assertEquals( 'test_api_key', $this->gateway->get_setting( 'api_key' ) );
		$this->assertEquals( true, $this->gateway->get_setting( 'sandbox' ) );
		$this->assertEquals( '', $this->gateway->get_setting( 'nonexistent_key' ) );
		$this->assertEquals( 'default', $this->gateway->get_setting( 'nonexistent_key', 'default' ) );

		// Test updating individual setting
		$this->gateway->update_setting( 'api_key', 'new_api_key' );
		$this->assertEquals( 'new_api_key', $this->gateway->get_setting( 'api_key' ) );
		$this->assertEquals( true, $this->gateway->get_setting( 'sandbox' ) );
	}

	/**
	 * Test validate method
	 */
	public function test_validate() {
		$test_settings = array(
			'api_key' => 'test_api_key',
			'sandbox' => true,
		);

		$this->assertTrue( $this->gateway->validate( $test_settings ) );
	}

	/**
	 * Test custom validation implementation
	 */
	public function test_custom_validation() {
		$gateway = new Test_Mock_Payment_Gateway_With_Validation();

		// Test valid settings
		$valid_settings = array(
			'api_key' => 'test_api_key',
			'sandbox' => true,
		);
		$this->assertTrue( $gateway->validate( $valid_settings ) );

		// Test invalid settings
		$invalid_settings = array(
			'sandbox' => true,
		);
		$this->assertFalse( $gateway->validate( $invalid_settings ) );

		// Test empty API key
		$empty_api_key = array(
			'api_key' => '',
			'sandbox' => true,
		);
		$this->assertFalse( $gateway->validate( $empty_api_key ) );
	}

	/**
	 * Test fields method
	 */
	public function test_fields() {
		$expected_fields = array(
			'api_key' => array(
				'type'     => 'text',
				'label'    => 'API Key',
				'required' => true,
			),
			'sandbox' => array(
				'type'    => 'checkbox',
				'label'   => 'Sandbox Mode',
				'default' => true,
			),
		);

		$this->assertEquals( $expected_fields, $this->gateway->get_fields() );
	}

	/**
	 * Test is_configured method
	 */
	public function test_is_configured() {
		$this->assertTrue( $this->gateway->is_configured() );
	}

	/**
	 * Test configuration state
	 */
	public function test_configuration_state() {
		// Default state
		$this->assertTrue( $this->gateway->is_configured() );

		// Test unconfigured state
		$unconfigured_gateway = new Test_Mock_Payment_Gateway( false );
		$this->assertFalse( $unconfigured_gateway->is_configured() );

		// Test setting configured state
		$unconfigured_gateway->set_configured( true );
		$this->assertTrue( $unconfigured_gateway->is_configured() );
	}

	/**
	 * Test mode settings
	 */
	public function test_mode_settings() {
		// Default mode settings
		$expected_settings = array(
			'mode'    => 'test',
			'api_key' => 'test_api_key',
		);
		$this->assertEquals( $expected_settings, $this->gateway->get_mode_settings() );

		// Test unconfigured gateway
		$unconfigured_gateway = new Test_Mock_Payment_Gateway( false );
		$this->assertFalse( $unconfigured_gateway->get_mode_settings() );

		// Test custom mode settings
		$custom_settings = array(
			'mode'    => 'live',
			'api_key' => 'live_key',
		);
		$this->gateway->set_mode_settings( $custom_settings );
		$this->assertEquals( $custom_settings, $this->gateway->get_mode_settings() );
	}
}
