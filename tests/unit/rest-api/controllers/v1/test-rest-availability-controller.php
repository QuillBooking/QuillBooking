<?php
/**
 * Class REST_Availability_Controller_Test
 *
 * @package QuillBooking
 */

use QuillBooking\REST_API\Controllers\v1\REST_Availability_Controller;
use QuillBooking\Availabilities;
use QuillBooking\Availability_service;

/**
 * Test for QuillBooking\REST_API\Controllers\v1\REST_Availability_Controller class
 */
class REST_Availability_Controller_Test extends QuillBooking_Base_Test_Case {

	/**
	 * REST Server
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * Controller instance
	 *
	 * @var REST_Availability_Controller
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
	 * REST Route base
	 *
	 * @var string
	 */
	protected $namespace = 'qb/v1';

	/**
	 * REST endpoint
	 *
	 * @var string
	 */
	protected $rest_base = 'availabilities';

	/**
	 * Mock Availability Service
	 *
	 * @var Availability_service
	 */
	protected $availability_service;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Define a constant for tests to use in the controller
		if ( ! defined( 'DOING_TESTS' ) ) {
			define( 'DOING_TESTS', true );
		}

		// Set up Illuminate\Support\Arr mock if needed
		$this->setUp_illuminate_arr();

		// Delete option to ensure clean state
		delete_option( Availabilities::$option_name );

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

		// Add admin capabilities
		$admin = get_user_by( 'id', $this->admin_user );
		$admin->add_cap( 'quillbooking_read_all_availability' );
		$admin->add_cap( 'quillbooking_read_own_availability' );
		$admin->add_cap( 'quillbooking_manage_all_availability' );
		$admin->add_cap( 'quillbooking_manage_own_availability' );

		// Add subscriber capabilities
		$subscriber = get_user_by( 'id', $this->subscriber_user );
		$subscriber->add_cap( 'quillbooking_read_own_availability' );
		$subscriber->add_cap( 'quillbooking_manage_own_availability' );

		// Initialize REST server
		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_REST_Server();

		// Register REST API routes properly
		do_action( 'rest_api_init' );

		// Initialize controller
		$this->controller = new REST_Availability_Controller();

		// Set up mock for Event_Meta_Model
		$this->setUp_event_meta_model();

		// Initialize availability service
		$this->availability_service = new Availability_service();
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

		// Clean up option
		delete_option( Availabilities::$option_name );
	}

	/**
	 * Test register_routes method
	 */
	public function test_register_routes() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/' . $this->namespace . '/' . $this->rest_base, $routes );
		$this->assertArrayHasKey( '/' . $this->namespace . '/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)', $routes );
	}

	/**
	 * Test get_item_schema method
	 */
	public function test_get_item_schema() {
		$schema = $this->controller->get_item_schema();

		$this->assertIsArray( $schema );
		$this->assertArrayHasKey( '$schema', $schema );
		$this->assertArrayHasKey( 'title', $schema );
		$this->assertArrayHasKey( 'type', $schema );
		$this->assertArrayHasKey( 'properties', $schema );

		// Check expected properties
		$properties = $schema['properties'];
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'user_id', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'weekly_hours', $properties );
		$this->assertArrayHasKey( 'override', $properties );
		$this->assertArrayHasKey( 'is_default', $properties );
	}

	/**
	 * Helper method to create a test availability directly
	 *
	 * @param int    $user_id User ID.
	 * @param string $name    Availability name.
	 * @return array Created availability
	 */
	private function create_test_availability( $user_id, $name = 'Test Availability' ) {
		$weekly_hours = array(
			'monday'    => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
			'tuesday'   => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
			'wednesday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
			'thursday'  => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
			'friday'    => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
			'saturday'  => array(
				'times' => array(),
				'off'   => true,
			),
			'sunday'    => array(
				'times' => array(),
				'off'   => true,
			),
		);

		$response = $this->availability_service->create_availability(
			$user_id,
			$name,
			$weekly_hours,
			array(),
			'UTC'
		);

		if ( $response instanceof WP_REST_Response ) {
			return $response->get_data();
		}

		return null;
	}

	/**
	 * Test get_items method as admin
	 */
	public function test_get_items_as_admin() {
		wp_set_current_user( $this->admin_user );

		// Create some test availabilities directly so we completely control the data
		$availability1 = array(
			'id'           => 'test-' . substr( md5( uniqid( rand(), true ) ), 0, 8 ),
			'user_id'      => $this->admin_user,
			'name'         => 'Admin Availability',
			'is_default'   => false,
			'weekly_hours' => array(
				'monday' => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
			),
			'override'     => array(),
			'timezone'     => 'UTC',
		);

		$availability2 = array(
			'id'           => 'test-' . substr( md5( uniqid( rand(), true ) ), 0, 8 ),
			'user_id'      => $this->subscriber_user,
			'name'         => 'Subscriber Availability',
			'is_default'   => false,
			'weekly_hours' => array(
				'monday' => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
			),
			'override'     => array(),
			'timezone'     => 'UTC',
		);

		// Add availabilities directly to ensure they're in the database
		Availabilities::add_availability( $availability1 );
		Availabilities::add_availability( $availability2 );

		// Make the request
		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_param( 'filter', array( 'user' => 'all' ) );
		$response = $this->server->dispatch( $request );

		// Check response
		$this->assertEquals( 200, $response->get_status() );

		// Admin should see both availabilities
		$data = $response->get_data();
		$this->assertCount( 2, $data );

		// Extract IDs from response data for comparison
		$response_ids = array_map(
			function( $item ) {
				return $item['id'];
			},
			$data
		);

		// Verify both IDs are in the response
		$this->assertContains( $availability1['id'], $response_ids );
		$this->assertContains( $availability2['id'], $response_ids );
	}

	/**
	 * Test get_items method as subscriber
	 */
	public function test_get_items_as_subscriber() {
		wp_set_current_user( $this->subscriber_user );

		// Create some test availabilities directly so we completely control the data
		$admin_availability = array(
			'id'           => 'test-' . substr( md5( uniqid( rand(), true ) ), 0, 8 ),
			'user_id'      => $this->admin_user,
			'name'         => 'Admin Availability',
			'is_default'   => false,
			'weekly_hours' => array(
				'monday' => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
			),
			'override'     => array(),
			'timezone'     => 'UTC',
		);

		$subscriber_availability = array(
			'id'           => 'test-' . substr( md5( uniqid( rand(), true ) ), 0, 8 ),
			'user_id'      => $this->subscriber_user,
			'name'         => 'Subscriber Availability',
			'is_default'   => false,
			'weekly_hours' => array(
				'monday' => array(
					'times' => array(
						array(
							'start' => '09:00',
							'end'   => '17:00',
						),
					),
					'off'   => false,
				),
			),
			'override'     => array(),
			'timezone'     => 'UTC',
		);

		// Add availabilities directly to ensure they're in the database
		Availabilities::add_availability( $admin_availability );
		Availabilities::add_availability( $subscriber_availability );

		// Make the request
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base );
		$response = $this->server->dispatch( $request );

		// Check response
		$this->assertEquals( 200, $response->get_status() );

		// Subscriber should only see their own availability
		$data = $response->get_data();
		$this->assertNotEmpty( $data, 'Response data should not be empty' );
		$this->assertCount( 1, $data );

		$found_subscriber = false;
		foreach ( $data as $item ) {
			if ( $item['id'] === $subscriber_availability['id'] ) {
				$found_subscriber = true;
				$this->assertEquals( 'Subscriber Availability', $item['name'] );
			}
		}

		$this->assertTrue( $found_subscriber, 'Subscriber availability not found in response' );
	}

	/**
	 * Test get_item method
	 */
	public function test_get_item() {
		wp_set_current_user( $this->admin_user );

		// Create a test availability
		$availability = $this->create_test_availability( $this->admin_user, 'Test Get Item' );

		// Make the request
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $availability['id'] );
		$response = $this->server->dispatch( $request );

		// Check response
		$this->assertEquals( 200, $response->get_status() );

		// Check data
		$data = $response->get_data();
		$this->assertEquals( $availability['id'], $data['id'] );
		$this->assertEquals( $availability['name'], $data['name'] );
		$this->assertEquals( $availability['user_id'], $data['user_id'] );
	}

	/**
	 * Test get_item method with invalid ID
	 */
	public function test_get_item_invalid_id() {
		wp_set_current_user( $this->admin_user );

		// Make the request with invalid ID
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/invalid-id' );
		$response = $this->server->dispatch( $request );

		// Check response is an error
		$this->assertEquals( 404, $response->get_status() );
	}




	/**
	 * Test create_item method
	 */
	public function test_create_item() {
		wp_set_current_user( $this->admin_user );

		// Prepare data for request
		$data = array(
			'user_id'      => $this->admin_user,
			'name'         => 'New Test Availability',
			'weekly_hours' => array(
				'monday'    => array(
					'times' => array(
						array(
							'start' => '10:00',
							'end'   => '16:00',
						),
					),
					'off'   => false,
				),
				'tuesday'   => array(
					'times' => array(
						array(
							'start' => '10:00',
							'end'   => '16:00',
						),
					),
					'off'   => false,
				),
				'wednesday' => array(
					'times' => array(
						array(
							'start' => '10:00',
							'end'   => '16:00',
						),
					),
					'off'   => false,
				),
				'thursday'  => array(
					'times' => array(
						array(
							'start' => '10:00',
							'end'   => '16:00',
						),
					),
					'off'   => false,
				),
				'friday'    => array(
					'times' => array(
						array(
							'start' => '10:00',
							'end'   => '16:00',
						),
					),
					'off'   => false,
				),
				'saturday'  => array(
					'times' => array(),
					'off'   => true,
				),
				'sunday'    => array(
					'times' => array(),
					'off'   => true,
				),
			),
			'timezone'     => 'UTC',
		);

		// Make the request
		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $data );
		$response = $this->server->dispatch( $request );

		// Check response status
		$this->assertEquals( 201, $response->get_status() );

		// Skip response data assertions and go directly to checking if the availability was created
		// Get the availabilities from storage
		$availabilities = Availabilities::get_availabilities();

		// Find the newly created availability by name
		$found                = false;
		$created_availability = null;

		foreach ( $availabilities as $availability ) {
			if ( $availability['name'] === $data['name'] && $availability['user_id'] == $data['user_id'] ) {
				$found                = true;
				$created_availability = $availability;
				break;
			}
		}

		// Assert that we found the availability
		$this->assertTrue( $found, 'Newly created availability should be found in storage' );

		// Verify the availability properties
		$this->assertNotEmpty( $created_availability['id'], 'ID should not be empty' );
		$this->assertEquals( $data['name'], $created_availability['name'], 'Name should match' );
		$this->assertEquals( $data['user_id'], $created_availability['user_id'], 'User ID should match' );
	}

	/**
	 * Test update_item method
	 */
	public function test_update_item() {
		wp_set_current_user( $this->admin_user );

		// Create a test availability
		$availability = $this->create_test_availability( $this->admin_user, 'Original Name' );

		// Prepare update data
		$update_data = array(
			'name'         => 'Updated Name',
			'weekly_hours' => array(
				'monday' => array(
					'times' => array(
						array(
							'start' => '11:00',
							'end'   => '15:00',
						),
					),
					'off'   => false,
				),
			),
		);

		// Make the request
		$request = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $availability['id'] );
		$request->set_body_params( $update_data );
		$response = $this->server->dispatch( $request );

		// Check response
		$this->assertEquals( 200, $response->get_status() );

		// Check data
		$data = $response->get_data();
		$this->assertEquals( $update_data['name'], $data['name'] );

		// Make sure monday has the updated time
		$this->assertArrayHasKey( 'monday', $data['weekly_hours'] );
		$this->assertArrayHasKey( 'times', $data['weekly_hours']['monday'] );
		$this->assertNotEmpty( $data['weekly_hours']['monday']['times'] );
		$this->assertEquals(
			$update_data['weekly_hours']['monday']['times'][0]['start'],
			$data['weekly_hours']['monday']['times'][0]['start']
		);

		// Verify availability was updated in storage
		$stored = Availabilities::get_availability( $availability['id'] );
		$this->assertEquals( $update_data['name'], $stored['name'] );
	}

	/**
	 * Test delete_item method
	 */
	public function test_delete_item() {
		wp_set_current_user( $this->admin_user );

		// Create a test availability
		$availability = $this->create_test_availability( $this->admin_user, 'To Be Deleted' );

		// Make the request
		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/' . $availability['id'] );
		$response = $this->server->dispatch( $request );

		// Check response
		$this->assertEquals( 204, $response->get_status() );

		// Verify availability was deleted from storage
		$stored = Availabilities::get_availability( $availability['id'] );
		$this->assertNull( $stored );
	}

	/**
	 * Test delete_item fails on non-existent ID
	 */
	public function test_delete_item_not_found() {
		wp_set_current_user( $this->admin_user );

		// Make the request with invalid ID
		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/invalid-id' );
		$response = $this->server->dispatch( $request );

		// Check response is an error
		$this->assertEquals( 404, $response->get_status() );
	}

	/**
	 * Set up the mock Event_Meta_Model
	 */
	protected function setUp_event_meta_model() {
		// Create a mock for the Event_Meta_Model with a static method 'where'
		if ( ! class_exists( 'QuillBooking\Models\Event_Meta_Model' ) ) {
			// Define a mock class for Event_Meta_Model
			eval(
				'
				namespace QuillBooking\Models;
				
				class Event_Meta_Model {
					public static function where($key, $value) {
						return new self();
					}
					
					public function where($key, $value) {
						return $this;
					}
					
					public function with($relation) {
						return $this;
					}
					
					public function get() {
						// Return an empty collection with a count method
						return new class {
							public function count() {
								return 0;
							}
						};
					}
				}
			'
			);
		}
	}

	/**
	 * Set up Illuminate\Support\Arr mock
	 */
	protected function setUp_illuminate_arr() {
		if ( ! class_exists( 'Illuminate\Support\Arr' ) ) {
			// Create a namespace for Illuminate
			eval(
				'
				namespace Illuminate\Support;
				
				class Arr {
					public static function get($array, $key, $default = null) {
						if (is_array($array) && array_key_exists($key, $array)) {
							return $array[$key];
						}
						return $default;
					}
					
					public static function first($array, $callback = null, $default = null) {
						if (is_null($callback)) {
							if (empty($array)) {
								return $default;
							}
							foreach ($array as $item) {
								return $item;
							}
						}
						
						foreach ($array as $key => $value) {
							if (call_user_func($callback, $value, $key)) {
								return $value;
							}
						}
						
						return $default;
					}
				}
				'
			);
		}
	}
}
