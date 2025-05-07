<?php
/**
 * Tests for the Payment_Validator class
 *
 * @package QuillBooking\Tests
 */

use QuillBooking\Payment_Gateway\Payment_Validator;
use QuillBooking\Payment_Gateway\Payment_Gateway;
use QuillBooking\Managers\Payment_Gateways_Manager;

/**
 * Mock Payment Gateway for validation tests
 */
class Validation_Mock_Gateway extends Payment_Gateway {
	/**
	 * Payment Gateway Name
	 *
	 * @var string
	 */
	public $name = 'Validation Mock Gateway';

	/**
	 * Payment Gateway Slug
	 *
	 * @var string
	 */
	public $slug = 'validation_mock';

	/**
	 * Payment Gateway Description
	 *
	 * @var string
	 */
	public $description = 'Validation Mock Gateway';

	/**
	 * Is gateway and method configured
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public function is_configured() {
		return true;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}
}

/**
 * Payment_Validator Test Case
 */
class Test_Payment_Validator extends WP_UnitTestCase {

	/**
	 * Mock gateway instance
	 *
	 * @var Validation_Mock_Gateway
	 */
	private $mock_gateway;

	/**
	 * Set up each test
	 */
	public function setUp(): void {
		parent::setUp();

		// Register a mock gateway for testing
		$this->mock_gateway = new Validation_Mock_Gateway();

		// Make sure it's registered with the manager
		$manager = Payment_Gateways_Manager::instance();
		$manager->register_payment_gateway( $this->mock_gateway );
	}

	/**
	 * Test validation with null settings
	 */
	public function test_validate_null_settings() {
		$result = Payment_Validator::validate_payment_gateways( null );
		$this->assertTrue( $result );
	}

	/**
	 * Test validation with empty settings
	 */
	public function test_validate_empty_settings() {
		$result = Payment_Validator::validate_payment_gateways( array() );
		$this->assertTrue( $result );
	}

	/**
	 * Test validation with payments disabled
	 */
	public function test_validate_payments_disabled() {
		$settings = array(
			'enable_payment' => false,
			'items'          => array(
				array(
					'item'  => 'Test',
					'price' => 10,
				),
			),
		);

		$result = Payment_Validator::validate_payment_gateways( $settings );
		$this->assertTrue( $result );
	}

	/**
	 * Test validation with no payment items
	 */
	public function test_validate_no_payment_items() {
		$settings = array(
			'enable_payment' => true,
			'items'          => array(),
		);

		$result = Payment_Validator::validate_payment_gateways( $settings );
		$this->assertTrue( $result );
	}

	/**
	 * Test validation with payment enabled and items but no gateway
	 */
	public function test_validate_payment_enabled_no_gateway() {
		$settings = array(
			'enable_payment' => true,
			'items'          => array(
				array(
					'item'  => 'Test',
					'price' => 10,
				),
			),
		);

		$result = Payment_Validator::validate_payment_gateways( $settings );
		$this->assertWPError( $result );
		$this->assertEquals( 'payment_gateway_required', $result->get_error_code() );
	}

	/**
	 * Test validation with valid payment settings
	 */
	public function test_validate_valid_payment_settings() {
		$settings = array(
			'enable_payment'         => true,
			'items'                  => array(
				array(
					'item'  => 'Test',
					'price' => 10,
				),
			),
			'enable_validation_mock' => true,
		);

		$result = Payment_Validator::validate_payment_gateways( $settings );
		$this->assertTrue( $result );
	}

	/**
	 * Test with multiple gateways - one enabled
	 */
	public function test_validate_multiple_gateways() {
		$settings = array(
			'enable_payment'         => true,
			'items'                  => array(
				array(
					'item'  => 'Test',
					'price' => 10,
				),
			),
			'enable_validation_mock' => true,
			'enable_other_gateway'   => false,
		);

		$result = Payment_Validator::validate_payment_gateways( $settings );
		$this->assertTrue( $result );
	}
}
