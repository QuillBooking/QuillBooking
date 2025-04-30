<?php
/**
 * Class REST_Settings_Controller_Test
 *
 * @package QuillBooking
 */

use QuillBooking\Payment_Gateway\REST_API\REST_Settings_Controller;
use QuillBooking\Tests\Mocks\Mock_Payment_Gateway;
use Exception;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Test implementation of the abstract REST_Settings_Controller
 */
class Test_Payment_REST_Settings_Controller extends REST_Settings_Controller {

	/**
	 * Get schema for the REST endpoint
	 *
	 * @since 1.0.0
	 * @return array
	 */
	public function get_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'test_payment_gateway',
			'type'       => 'object',
			'properties' => array(
				'mode'         => array(
					'description' => 'Mode',
					'type'        => 'string',
					'enum'        => array( 'sandbox', 'live' ),
					'default'     => 'sandbox',
				),
				'test_api_key' => array(
					'description' => 'Test API Key',
					'type'        => 'string',
				),
				'live_api_key' => array(
					'description' => 'Live API Key',
					'type'        => 'string',
				),
			),
		);
	}
}

/**
 * Test for REST_Settings_Controller abstract class
 */
class Payment_Gateway_REST_Settings_Controller_Test extends QuillBooking_Base_Test_Case {

	/**
	 * REST Server
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * Controller instance
	 *
	 * @var Test_Payment_REST_Settings_Controller
	 */
	protected $controller;

	/**
	 * Admin user ID
	 *
	 * @var int
	 */
	protected $admin_user;

	/**
	 * Subscriber user ID
	 *
	 * @var int
	 */
	protected $subscriber_user;

	/**
	 * Payment Gateway instance
	 *
	 * @var Mock_Payment_Gateway
	 */
	protected $payment_gateway;

	/**
	 * Route for testing
	 *
	 * @var string
	 */
	protected $route;

	/**
	 * Setup the test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Load mock payment gateway
		require_once __DIR__ . '/test-mock-payment-gateway.php';

		// Create test admin user
		$this->admin_user = $this->factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		// Create test subscriber (non-admin) user
		$this->subscriber_user = $this->factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);

		// Initialize REST server
		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_REST_Server();

		// Initialize payment gateway
		$this->payment_gateway = new Mock_Payment_Gateway(
			true,
			array(
				'mode'         => 'sandbox',
				'test_api_key' => 'test_123456',
				'live_api_key' => 'live_654321',
			)
		);

		// Initialize controller
		$this->controller = new Test_Payment_REST_Settings_Controller( $this->payment_gateway );

		// Set the route
		$this->route = '/qb/v1/payment-gateways/' . $this->payment_gateway->slug;

		// Register REST API routes properly
		do_action( 'rest_api_init' );

		// Delete the settings to ensure a clean state
		delete_option( $this->payment_gateway->option_name );
	}

	/**
	 * Clean up test environment
	 */
	public function tearDown(): void {
		parent::tearDown();

		// Reset users
		wp_delete_user( $this->admin_user );
		wp_delete_user( $this->subscriber_user );

		// Reset server
		global $wp_rest_server;
		$wp_rest_server = null;

		// Delete the settings
		delete_option( $this->payment_gateway->option_name );
	}

	/**
	 * Test register_routes method
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( $this->route, $routes );
		$this->assertEquals( 2, count( $routes[ $this->route ] ) );
	}

	/**
	 * Test get_permissions_check method with admin user
	 */
	public function test_get_permissions_check_with_admin() {
		wp_set_current_user( $this->admin_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->controller->get_permissions_check( $request );
		$this->assertTrue( $response );
	}

	/**
	 * Test get_permissions_check method with non-admin user
	 */
	public function test_get_permissions_check_with_non_admin() {
		wp_set_current_user( $this->subscriber_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->controller->get_permissions_check( $request );
		$this->assertFalse( $response );
	}

	/**
	 * Test update_permissions_check method with admin user
	 */
	public function test_update_permissions_check_with_admin() {
		wp_set_current_user( $this->admin_user );
		$request  = new WP_REST_Request( 'POST', $this->route );
		$response = $this->controller->update_permissions_check( $request );
		$this->assertTrue( $response );
	}

	/**
	 * Test update_permissions_check method with non-admin user
	 */
	public function test_update_permissions_check_with_non_admin() {
		wp_set_current_user( $this->subscriber_user );
		$request  = new WP_REST_Request( 'POST', $this->route );
		$response = $this->controller->update_permissions_check( $request );
		$this->assertFalse( $response );
	}

	/**
	 * Test get method with empty settings
	 */
	public function test_get_with_empty_settings() {
		wp_set_current_user( $this->admin_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertEmpty( $data['settings'] );
	}

	/**
	 * Test get method with existing settings
	 */
	public function test_get_with_existing_settings() {
		// Set up test settings
		$test_settings = array(
			'mode'         => 'live',
			'live_api_key' => 'test_key_123',
		);
		$this->payment_gateway->update_settings( $test_settings );

		wp_set_current_user( $this->admin_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertIsArray( $data['settings'] );
		$this->assertArrayHasKey( 'mode', $data['settings'] );
		$this->assertArrayHasKey( 'live_api_key', $data['settings'] );
		$this->assertEquals( 'live', $data['settings']['mode'] );
		$this->assertEquals( 'test_key_123', $data['settings']['live_api_key'] );
	}

	/**
	 * Test update method
	 */
	public function test_update_settings() {
		wp_set_current_user( $this->admin_user );

		$test_settings = array(
			'mode'         => 'sandbox',
			'test_api_key' => 'updated_test_key',
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $test_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertIsArray( $data['settings'] );
		$this->assertArrayHasKey( 'mode', $data['settings'] );
		$this->assertArrayHasKey( 'test_api_key', $data['settings'] );
		$this->assertEquals( 'sandbox', $data['settings']['mode'] );
		$this->assertEquals( 'updated_test_key', $data['settings']['test_api_key'] );

		// Verify settings were stored
		$stored_settings = $this->payment_gateway->get_settings();
		$this->assertIsArray( $stored_settings );
		$this->assertArrayHasKey( 'mode', $stored_settings );
		$this->assertArrayHasKey( 'test_api_key', $stored_settings );
		$this->assertEquals( 'sandbox', $stored_settings['mode'] );
		$this->assertEquals( 'updated_test_key', $stored_settings['test_api_key'] );
	}

	/**
	 * Test update method with validation error
	 */
	public function test_update_with_validation_error() {
		wp_set_current_user( $this->admin_user );

		// Create a mock payment gateway that will return a validation error
		$payment_gateway = $this->createMock( Mock_Payment_Gateway::class );

		$payment_gateway->slug        = 'mock_gateway';
		$payment_gateway->option_name = 'quillbooking_mock_gateway_settings';

		// Set up the validate method to return a WP_Error
		$payment_gateway->method( 'validate' )
			->willReturn( new WP_Error( 'invalid_key', 'API key is invalid' ) );

		// Configure get_settings to return an array when called
		$payment_gateway->method( 'get_settings' )
			->willReturn( array() );

		// Create controller with the mock
		$controller = new Test_Payment_REST_Settings_Controller( $payment_gateway );

		$test_settings = array(
			'mode'         => 'sandbox',
			'test_api_key' => 'invalid_key',
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $test_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		// Use the controller directly since we're using a mock
		$response = $controller->update( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'invalid_key', $response->get_error_code() );
		$this->assertEquals( 'API key is invalid', $response->get_error_message() );
	}

	/**
	 * Test get endpoint with unauthorized user
	 */
	public function test_get_endpoint_unauthorized() {
		wp_set_current_user( $this->subscriber_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test update endpoint with unauthorized user
	 */
	public function test_update_endpoint_unauthorized() {
		wp_set_current_user( $this->subscriber_user );

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( array( 'mode' => 'sandbox' ) ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test exception handling in get method
	 */
	public function test_get_with_exception() {
		wp_set_current_user( $this->admin_user );

		// Create a payment gateway that throws an exception
		$payment_gateway = $this->getMockBuilder( Mock_Payment_Gateway::class )
			->setMethods( array( 'get_settings' ) )
			->disableOriginalConstructor()
			->getMock();

		$payment_gateway->method( 'get_settings' )
			->will( $this->throwException( new Exception( 'Test exception' ) ) );

		$payment_gateway->slug = 'mock_gateway';

		// Create controller with the mock
		$controller = new Test_Payment_REST_Settings_Controller( $payment_gateway );

		$request = new WP_REST_Request( 'GET', $this->route );

		// Use the controller directly since we're using a mock
		$response = $controller->get( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'rest_invalid_request', $response->get_error_code() );
		$this->assertEquals( 'Test exception', $response->get_error_message() );
	}

	/**
	 * Test exception handling in update method
	 */
	public function test_update_with_exception() {
		wp_set_current_user( $this->admin_user );

		// Create a payment gateway that throws an exception on update
		$payment_gateway = $this->getMockBuilder( Mock_Payment_Gateway::class )
			->setMethods( array( 'validate', 'update_settings', 'get_settings' ) )
			->disableOriginalConstructor()
			->getMock();

		$payment_gateway->method( 'validate' )
			->willReturn( true );

		$payment_gateway->method( 'update_settings' )
			->will( $this->throwException( new Exception( 'Update failed' ) ) );

		// Configure get_settings to return an array
		$payment_gateway->method( 'get_settings' )
			->willReturn( array() );

		$payment_gateway->slug = 'mock_gateway';

		// Create controller with the mock
		$controller = new Test_Payment_REST_Settings_Controller( $payment_gateway );

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( array( 'mode' => 'sandbox' ) ) );
		$request->set_header( 'content-type', 'application/json' );

		// Use the controller directly since we're using a mock
		$response = $controller->update( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'rest_invalid_request', $response->get_error_code() );
		$this->assertEquals( 'Update failed', $response->get_error_message() );
	}

	/**
	 * Test partial update of settings
	 */
	public function test_partial_update_settings() {
		wp_set_current_user( $this->admin_user );

		// First set some initial settings
		$initial_settings = array(
			'mode'         => 'live',
			'live_api_key' => 'live_key_123',
			'test_api_key' => 'test_key_123',
		);
		$this->payment_gateway->update_settings( $initial_settings );

		// Now perform a partial update
		$partial_settings = array(
			'test_api_key' => 'updated_test_key',
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $partial_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'settings', $data );
		$this->assertIsArray( $data['settings'] );

		// The response should contain only the updated setting
		$this->assertArrayHasKey( 'test_api_key', $data['settings'] );
		$this->assertEquals( 'updated_test_key', $data['settings']['test_api_key'] );

		// The response should not include other settings
		$this->assertCount( 1, $data['settings'], 'Response should only include the updated setting' );
		$this->assertFalse( isset( $data['settings']['mode'] ), 'Response should not include mode setting' );
		$this->assertFalse( isset( $data['settings']['live_api_key'] ), 'Response should not include live_api_key setting' );

		// Verify all settings were stored correctly
		$stored_settings = $this->payment_gateway->get_settings();
		$this->assertIsArray( $stored_settings );

		// test_api_key should be updated
		$this->assertArrayHasKey( 'test_api_key', $stored_settings );
		$this->assertEquals( 'updated_test_key', $stored_settings['test_api_key'] );
	}

	/**
	 * Test update with invalid data
	 */
	public function test_update_with_invalid_data() {
		wp_set_current_user( $this->admin_user );

		// Create a mock payment gateway with custom validation
		$payment_gateway = $this->getMockBuilder( Mock_Payment_Gateway::class )
			->setMethods( array( 'validate' ) )
			->getMock();

		$payment_gateway->slug        = 'mock_gateway';
		$payment_gateway->option_name = 'quillbooking_mock_gateway_settings';

		// Setup validate method to return WP_Error for specific values
		$payment_gateway->method( 'validate' )
			->will(
				$this->returnCallback(
					function( $settings ) {
						if ( isset( $settings['mode'] ) && $settings['mode'] === 'invalid' ) {
							  return new WP_Error( 'invalid_mode', 'Invalid mode specified' );
						}
						if ( isset( $settings['test_api_key'] ) && $settings['test_api_key'] === 'invalid_key' ) {
							return new WP_Error( 'invalid_key', 'API key is invalid' );
						}
						return true;
					}
				)
			);

		// Create controller with the mock
		$controller = new Test_Payment_REST_Settings_Controller( $payment_gateway );

		// Test case 1: Invalid mode
		$invalid_mode_settings = array(
			'mode' => 'invalid',
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $invalid_mode_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $controller->update( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'invalid_mode', $response->get_error_code() );
		$this->assertEquals( 'Invalid mode specified', $response->get_error_message() );

		// Test case 2: Invalid API key
		$invalid_key_settings = array(
			'test_api_key' => 'invalid_key',
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $invalid_key_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $controller->update( $request );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertEquals( 'invalid_key', $response->get_error_code() );
		$this->assertEquals( 'API key is invalid', $response->get_error_message() );
	}
}
