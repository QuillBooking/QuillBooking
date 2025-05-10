<?php
/**
 * Class REST_Settings_Controller_Test
 *
 * @package QuillBooking
 */

use QuillBooking\REST_API\Controllers\V1\REST_Settings_Controller;
use QuillBooking\REST_API\REST_API;
use QuillBooking\Settings;

/**
 * Test for QuillBooking\REST_API\Controllers\V1\REST_Settings_Controller class
 */
class REST_Settings_Controller_Test extends QuillBooking_Base_Test_Case {

	/**
	 * REST Server
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * Controller instance
	 *
	 * @var REST_Settings_Controller
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
	 * REST Route
	 *
	 * @var string
	 */
	protected $route = '/qb/v1/settings';

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

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

		// Initialize controller
		$this->controller = new REST_Settings_Controller();

		// Register REST API routes properly using the action hook
		do_action( 'rest_api_init' );

		// Reset settings before each test
		Settings::delete_all();
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
	 * Test get_schema method
	 */
	public function test_get_schema() {
		$schema = $this->controller->get_schema();

		$this->assertIsArray( $schema );
		$this->assertArrayHasKey( '$schema', $schema );
		$this->assertArrayHasKey( 'title', $schema );
		$this->assertArrayHasKey( 'type', $schema );
		$this->assertArrayHasKey( 'properties', $schema );

		// Check main property groups
		$this->assertArrayHasKey( 'general', $schema['properties'] );
		$this->assertArrayHasKey( 'payments', $schema['properties'] );
		$this->assertArrayHasKey( 'email', $schema['properties'] );
		$this->assertArrayHasKey( 'theme', $schema['properties'] );
	}

	/**
	 * Test schema for general section
	 */
	public function test_schema_general_section() {
		$schema  = $this->controller->get_schema();
		$general = $schema['properties']['general']['properties'];

		// Check general properties exist
		$this->assertArrayHasKey( 'admin_email', $general );
		$this->assertArrayHasKey( 'start_from', $general );
		$this->assertArrayHasKey( 'time_format', $general );
		$this->assertArrayHasKey( 'auto_cancel_after', $general );
		$this->assertArrayHasKey( 'auto_complete_after', $general );
		$this->assertArrayHasKey( 'default_country_code', $general );
		$this->assertArrayHasKey( 'enable_summary_email', $general );
		$this->assertArrayHasKey( 'summary_email_frequency', $general );

		// Check expected defaults
		$this->assertEquals( 'Monday', $general['start_from']['default'] );
		$this->assertEquals( '12', $general['time_format']['default'] );
		$this->assertEquals( 30, $general['auto_cancel_after']['default'] );
		$this->assertEquals( 30, $general['auto_complete_after']['default'] );
		$this->assertEquals( '+1', $general['default_country_code']['default'] );
		$this->assertEquals( false, $general['enable_summary_email']['default'] );
		$this->assertEquals( 'daily', $general['summary_email_frequency']['default'] );
	}

	/**
	 * Test schema for email section
	 */
	public function test_schema_email_section() {
		$schema = $this->controller->get_schema();
		$email  = $schema['properties']['email']['properties'];

		// Check email properties exist
		$this->assertArrayHasKey( 'from_name', $email );
		$this->assertArrayHasKey( 'from_email', $email );
		$this->assertArrayHasKey( 'reply_to_name', $email );
		$this->assertArrayHasKey( 'reply_to_email', $email );
		$this->assertArrayHasKey( 'use_host_from_name', $email );
		$this->assertArrayHasKey( 'use_host_reply_to_email', $email );
		$this->assertArrayHasKey( 'include_ics', $email );
		$this->assertArrayHasKey( 'footer', $email );

		// Check expected defaults
		$this->assertEquals( false, $email['use_host_from_name']['default'] );
		$this->assertEquals( false, $email['use_host_reply_to_email']['default'] );
		$this->assertEquals( false, $email['include_ics']['default'] );
	}

	/**
	 * Test schema for theme section
	 */
	public function test_schema_theme_section() {
		$schema = $this->controller->get_schema();
		$theme  = $schema['properties']['theme']['properties'];

		// Check theme properties exist
		$this->assertArrayHasKey( 'color_scheme', $theme );

		// Check expected defaults
		$this->assertEquals( 'system', $theme['color_scheme']['default'] );
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
	 * Test get method with no existing settings
	 */
	public function test_get_with_no_settings() {
		wp_set_current_user( $this->admin_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'general', $data );
		$this->assertArrayHasKey( 'payments', $data );
		$this->assertArrayHasKey( 'email', $data );
		$this->assertArrayHasKey( 'theme', $data );

		// Test that defaults are returned
		$schema = $this->controller->get_schema();
		$this->assertEquals(
			$schema['properties']['general']['properties']['time_format']['default'],
			$data['general']['time_format']
		);
	}

	/**
	 * Test get method with existing settings
	 */
	public function test_get_with_existing_settings() {
		// Set up test settings
		$test_settings = array(
			'general' => array(
				'admin_email' => 'test@example.com',
				'time_format' => '24',
			),
		);
		Settings::update_many( $test_settings );

		wp_set_current_user( $this->admin_user );
		$request  = new WP_REST_Request( 'GET', $this->route );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'test@example.com', $data['general']['admin_email'] );
		$this->assertEquals( '24', $data['general']['time_format'] );
	}

	/**
	 * Test update method for general settings
	 */
	public function test_update_general_settings() {
		wp_set_current_user( $this->admin_user );

		$test_settings = array(
			'general' => array(
				'admin_email'          => 'admin@example.com',
				'time_format'          => '24',
				'start_from'           => 'Sunday',
				'auto_cancel_after'    => 60,
				'auto_complete_after'  => 45,
				'default_country_code' => '+44',
				'enable_summary_email' => true,
			),
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $test_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );

		// Verify settings were updated
		$stored_settings = Settings::get_all();
		$this->assertEquals( 'admin@example.com', $stored_settings['general']['admin_email'] );
		$this->assertEquals( '24', $stored_settings['general']['time_format'] );
		$this->assertEquals( 'Sunday', $stored_settings['general']['start_from'] );
		$this->assertEquals( 60, $stored_settings['general']['auto_cancel_after'] );
		$this->assertEquals( 45, $stored_settings['general']['auto_complete_after'] );
		$this->assertEquals( '+44', $stored_settings['general']['default_country_code'] );
		$this->assertEquals( true, $stored_settings['general']['enable_summary_email'] );
	}

	/**
	 * Test update method for email settings
	 */
	public function test_update_email_settings() {
		wp_set_current_user( $this->admin_user );

		$test_settings = array(
			'email' => array(
				'from_name'               => 'Test Sender',
				'from_email'              => 'sender@example.com',
				'reply_to_name'           => 'Reply Handler',
				'reply_to_email'          => 'reply@example.com',
				'use_host_from_name'      => true,
				'use_host_reply_to_email' => true,
				'include_ics'             => true,
				'footer'                  => 'Test Footer Content',
			),
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $test_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );

		// Verify settings were updated
		$stored_settings = Settings::get_all();
		$this->assertEquals( 'Test Sender', $stored_settings['email']['from_name'] );
		$this->assertEquals( 'sender@example.com', $stored_settings['email']['from_email'] );
		$this->assertEquals( 'Reply Handler', $stored_settings['email']['reply_to_name'] );
		$this->assertEquals( 'reply@example.com', $stored_settings['email']['reply_to_email'] );
		$this->assertEquals( true, $stored_settings['email']['use_host_from_name'] );
		$this->assertEquals( true, $stored_settings['email']['use_host_reply_to_email'] );
		$this->assertEquals( true, $stored_settings['email']['include_ics'] );
		$this->assertEquals( 'Test Footer Content', $stored_settings['email']['footer'] );
	}

	/**
	 * Test update method for theme settings
	 */
	public function test_update_theme_settings() {
		wp_set_current_user( $this->admin_user );

		$test_settings = array(
			'theme' => array(
				'color_scheme' => 'dark',
			),
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $test_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );

		// Verify settings were updated
		$stored_settings = Settings::get_all();
		$this->assertEquals( 'dark', $stored_settings['theme']['color_scheme'] );
	}

	/**
	 * Test update method for updating all settings sections together
	 */
	public function test_update_all_settings_sections() {
		wp_set_current_user( $this->admin_user );

		$test_settings = array(
			'general'  => array(
				'admin_email' => 'admin@example.com',
				'time_format' => '24',
			),
			'email'    => array(
				'from_name'  => 'Test Sender',
				'from_email' => 'sender@example.com',
			),
			'theme'    => array(
				'color_scheme' => 'dark',
			),
			'payments' => array(
				'currency' => 'EUR',
			),
		);

		$request = new WP_REST_Request( 'POST', $this->route );
		$request->set_body( wp_json_encode( $test_settings ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['success'] );

		// Verify all settings were updated
		$stored_settings = Settings::get_all();
		$this->assertEquals( 'admin@example.com', $stored_settings['general']['admin_email'] );
		$this->assertEquals( '24', $stored_settings['general']['time_format'] );
		$this->assertEquals( 'Test Sender', $stored_settings['email']['from_name'] );
		$this->assertEquals( 'sender@example.com', $stored_settings['email']['from_email'] );
		$this->assertEquals( 'dark', $stored_settings['theme']['color_scheme'] );
		$this->assertEquals( 'EUR', $stored_settings['payments']['currency'] );
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
		$request->set_body( wp_json_encode( array( 'general' => array( 'admin_email' => 'test@example.com' ) ) ) );
		$request->set_header( 'content-type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() );
	}
}
