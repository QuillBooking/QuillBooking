<?php

namespace QuillBooking\Tests\REST_API\Controllers\V1;

// Base test case
use QuillBooking_Base_Test_Case; // Use your actual base test case namespace

// WP Core & REST API
use WP_REST_Server;
use WP_REST_Request;

// Internal dependencies
use QuillBooking\REST_API\Controllers\V1\REST_Calendar_Controller;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;


/**
 * Class RestCalendarControllerTest
 * Test for QuillBooking\REST_API\Controllers\V1\REST_Calendar_Controller class
 * Using integration testing style, avoiding Mockery for Capabilities.
 *
 * @package QuillBooking\Tests\REST_API\Controllers\V1
 * @coversDefaultClass \QuillBooking\REST_API\Controllers\V1\REST_Calendar_Controller
 */
class Test_Rest_Calendar_Controller extends QuillBooking_Base_Test_Case {
	// <-- Ensure correct base class

	// Use PHPMock trait if mocking functions like wp_mail, update_option etc. becomes necessary
	// You might not need it initially. Add it if a test fails due to a specific WP function call.
	// use PHPMock;

	/** @var WP_REST_Server */
	protected $server;

	/** @var int */
	protected $admin_user_id;

	/** @var int */
	protected $subscriber_user_id;

	/** @var int */
	protected $host_user_id_1;
	/** @var int */
	protected $host_user_id_2;

	/** @var string */
	protected $namespace = 'qb/v1';

	/** @var string */
	protected $rest_base = 'calendars';

	/** @var array */
	private $created_ids = array(
		'users'     => array(),
		'calendars' => array(),
		'events'    => array(),
	);

	public function setUp(): void {
		parent::setUp();

		// --- User Setup ---
		$this->admin_user_id          = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$this->created_ids['users'][] = $this->admin_user_id;
		$admin_user_obj               = get_user_by( 'id', $this->admin_user_id );

		$this->subscriber_user_id     = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		$this->created_ids['users'][] = $this->subscriber_user_id;
		$subscriber_user_obj          = get_user_by( 'id', $this->subscriber_user_id );

		$this->host_user_id_1         = $this->factory->user->create( array( 'role' => 'editor' ) );
		$this->created_ids['users'][] = $this->host_user_id_1;
		$host_user_obj_1              = get_user_by( 'id', $this->host_user_id_1 );

		$this->host_user_id_2         = $this->factory->user->create( array( 'role' => 'editor' ) );
		$this->created_ids['users'][] = $this->host_user_id_2;
		$host_user_obj_2              = get_user_by( 'id', $this->host_user_id_2 );

		// --- Capability Setup ---
		// Admin
		$admin_user_obj->add_cap( 'quillbooking_read_all_calendars' );
		$admin_user_obj->add_cap( 'quillbooking_manage_all_calendars' );
		$admin_user_obj->add_cap( 'quillbooking_manage_own_calendars' );
		$admin_user_obj->add_cap( 'manage_options' );
		// Add caps potentially checked by can_manage_calendar / can_read_calendar
		$admin_user_obj->add_cap( 'quillbooking_manage_calendar' ); // Example generic cap
		$admin_user_obj->add_cap( 'quillbooking_read_calendar' ); // Example generic cap

		// Subscriber (Basic User)
		$subscriber_user_obj->add_cap( 'quillbooking_manage_own_calendars' );
		$subscriber_user_obj->add_cap( 'quillbooking_read_calendar' ); // Allow reading own?

		// Host Users
		$host_user_obj_1->add_cap( 'quillbooking_manage_own_calendars' );
		$host_user_obj_1->add_cap( 'quillbooking_read_calendar' );
		$host_user_obj_2->add_cap( 'quillbooking_manage_own_calendars' );
		$host_user_obj_2->add_cap( 'quillbooking_read_calendar' );

		// --- Default Availability Setup ---
		if ( class_exists( '\QuillBooking\Availability_service' ) ) {
			$complete_weekly_hours = array(
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
			$availability_service  = new \QuillBooking\Availability_service();
			$users_needing_avail   = array( $this->admin_user_id, $this->subscriber_user_id, $this->host_user_id_1, $this->host_user_id_2 );
			foreach ( $users_needing_avail as $user_id ) {
				try {
					// Avoid creating duplicates if setup runs multiple times
					$existing_default = \QuillBooking\Availabilities::get_default_availability( $user_id );
					if ( ! $existing_default ) {
						$availability_service->create_availability(
							$user_id,
							'Default Hours',
							$complete_weekly_hours,
							array(),
							'UTC',
							true
						);
					}
				} catch ( \Exception $e ) { /* Log or ignore */
				}
			}
		}
		// --- End Availability Setup ---

		// --- REST Server Setup ---
		global $wp_rest_server;
		$this->server = $wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' ); // Assumes plugin hooks this action
	}

	public function tearDown(): void {
		// Clean up (Keep existing cleanup)
		foreach ( $this->created_ids['events'] as $id ) {
			Event_Model::destroy( $id );
		}
		foreach ( $this->created_ids['calendars'] as $id ) {
			Calendar_Model::destroy( $id );
		}
		foreach ( $this->created_ids['users'] as $id ) {
			wp_delete_user( $id );
		}
		$this->created_ids = array(
			'users'     => array(),
			'calendars' => array(),
			'events'    => array(),
		);

		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tearDown();
	}


	private function create_test_calendar_direct( int $user_id, string $name, string $type = 'host' ): Calendar_Model {

		$calendar = Calendar_Model::create(
			array(
				'user_id' => $user_id, // <-- This looks correct
				'name'    => $name,
				'slug'    => sanitize_title( $name . '-' . uniqid() ),
				'type'    => $type,
				'status'  => 'active',

			)
		);

		if ( $calendar ) {
			$this->created_ids['calendars'][] = $calendar->id;
		}
		return $calendar;
	}

	// --- Test Methods ---

	/** @covers ::register_routes */
	public function test_register_routes() {
		// Keep implementation (should be passing now)
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/' . $this->namespace . '/' . $this->rest_base, $routes, 'Collection route missing' );
		$this->assertArrayHasKey( '/' . $this->namespace . '/' . $this->rest_base . '/(?P<id>[\d]+)', $routes, 'Single item route missing' );
		$this->assertArrayHasKey( '/' . $this->namespace . '/' . $this->rest_base . '/(?P<id>[\d]+)/clone', $routes, 'Clone route missing' );
	}

	/** @covers ::get_item_schema */
	public function test_get_item_schema() {
		// Keep implementation
		$controller_for_schema = new REST_Calendar_Controller();
		$schema                = $controller_for_schema->get_item_schema();
		// ... assertions ...
		$this->assertEquals( 'calendar', $schema['title'] );
	}

	// --- GET /calendars ---

	/**
	 * @covers ::get_items
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_as_admin() {
		// Keep implementation (should work if direct creation is okay)
		wp_set_current_user( $this->admin_user_id );
		$cal1     = $this->create_test_calendar_direct( $this->admin_user_id, 'Admin Calendar Test', 'host' );
		$cal2     = $this->create_test_calendar_direct( $this->subscriber_user_id, 'Subscriber Calendar Test', 'host' );
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$paginator_obj = $response->get_data();
		$this->assertInstanceOf( \Illuminate\Pagination\LengthAwarePaginator::class, $paginator_obj );
		// ... other assertions ...
		$this->assertGreaterThanOrEqual( 2, $paginator_obj->total() );
	}

	/**
	 * @covers ::get_items
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_as_subscriber() {
		// Keep implementation
		wp_set_current_user( $this->subscriber_user_id );
		$cal1     = $this->create_test_calendar_direct( $this->admin_user_id, 'Admin Calendar Test 2', 'host' );
		$cal2     = $this->create_test_calendar_direct( $this->subscriber_user_id, 'My Calendar Test', 'host' );
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$paginator_obj = $response->get_data();
		$this->assertInstanceOf( \Illuminate\Pagination\LengthAwarePaginator::class, $paginator_obj );
		$this->assertEquals( 1, $paginator_obj->total() );
		// ... other assertions ...
	}

	// --- GET /calendars/{id} ---

	/**
	 * @covers ::get_item
	 * @covers ::get_item_permissions_check
	 */
	public function test_get_item_as_owner() {
		wp_set_current_user( $this->subscriber_user_id );
		$cal = $this->create_test_calendar_direct( $this->subscriber_user_id, 'My Single Calendar', 'host' );

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_read_calendar')->with($cal->id)->andReturn(true);

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal->id );
		$response = $this->server->dispatch( $request );

		// Assertions rely on real Capabilities::can_read_calendar() check
		$this->assertEquals( 200, $response->get_status() );
		$calendar_obj_data = $response->get_data();
		$this->assertInstanceOf( Calendar_Model::class, $calendar_obj_data );
		$this->assertEquals( $cal->id, $calendar_obj_data->id );
		$this->assertEquals( $cal->name, $calendar_obj_data->name );
	}

	/**
	 * @covers ::get_item
	 * @covers ::get_item_permissions_check
	 */
	public function test_get_item_as_admin() {
		wp_set_current_user( $this->admin_user_id ); // Admin has 'read_all_calendars'
		$cal = $this->create_test_calendar_direct( $this->subscriber_user_id, 'Other User Calendar', 'host' );

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_read_calendar')->with($cal->id)->andReturn(true);

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal->id );
		$response = $this->server->dispatch( $request );

		// Assertions rely on real Capabilities::can_read_calendar() check
		$this->assertEquals( 200, $response->get_status() );
		$calendar_obj_data = $response->get_data();
		$this->assertInstanceOf( Calendar_Model::class, $calendar_obj_data );
		$this->assertEquals( $cal->id, $calendar_obj_data->id );
	}

	/**
	 * @covers ::get_item
	 * @covers ::get_item_permissions_check
	 */
	public function test_get_item_permission_denied() {
		wp_set_current_user( $this->subscriber_user_id ); // Subscriber cannot read admin's
		$cal = $this->create_test_calendar_direct( $this->admin_user_id, 'Admin Private Calendar', 'host' );

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_read_calendar')->with($cal->id)->andReturn(false);

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal->id );
		$response = $this->server->dispatch( $request );

		// Assertions rely on real Capabilities::can_read_calendar() check
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * @covers ::get_item
	 */
	public function test_get_item_not_found() {
		wp_set_current_user( $this->admin_user_id );
		$non_existent_id = 99999;

		// ** REMOVE Mockery **
		// Assuming real Capabilities::can_read_calendar() returns true for admin
		// or is modified to handle non-existent IDs correctly for admins.
		// Capabilities::shouldReceive('can_read_calendar')->with($non_existent_id)->andReturn(true);

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $non_existent_id );
		$response = $this->server->dispatch( $request );

		// Assertions rely on controller returning 404
		$this->assertEquals( 404, $response->get_status() );
	}


	// --- POST /calendars ---

	/**
	 * @covers ::create_item
	 * @covers ::create_item_permissions_check
	 * @covers ::create_availability
	 * @covers ::validate_host_calendar
	 */
	public function test_create_item_host_success() {
		wp_set_current_user( $this->admin_user_id ); // Needs 'manage_all_calendars'

		$host_for_cal = $this->host_user_id_1; // Use one of the prepared host users
		$cal_name     = 'New Host Calendar API Test Integration';

		// Make sure the host user doesn't already have a host calendar from direct creation
		Calendar_Model::where( 'user_id', $host_for_cal )->where( 'type', 'host' )->delete();

		$availability_data = array( // Data structure expected by controller's create_availability
			'weekly_hours' => array( /* ... include full 7-day schedule ... */ ),
			'override'     => array(),
		);
		// Copy the full $complete_weekly_hours array here
		$availability_data['weekly_hours'] = array(
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

		$request_data = array(
			'name'         => $cal_name,
			'type'         => 'host',
			'user_id'      => $host_for_cal, // ID of the user who will be the host
			'timezone'     => 'America/Denver',
			'availability' => $availability_data, // Pass the full schedule structure
		);

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );

		// --- Real Availability_Service will run ---
		$response = $this->server->dispatch( $request );
		// --- ---

		// If this fails with 500, add logging to controller's create_item/create_availability
		// and debug the Availability_Service execution.
		$this->assertEquals( 200, $response->get_status(), 'API call failed: ' . ( is_wp_error( $response ) ? $response->get_error_message() : 'Status was ' . $response->get_status() ) );

		// Verify DB
		$created_cal = Calendar_Model::where( 'name', $cal_name )->where( 'user_id', $host_for_cal )->where( 'type', 'host' )->first();
		$this->assertNotNull( $created_cal, 'Host calendar not found in DB' );
		if ( $created_cal ) {
			// Assuming timezone is a direct column on calendars table
			// $this->assertEquals('America/Denver', $created_cal->timezone);
			// Check meta if timezone is stored there via an accessor/mutator
			// $this->assertEquals( 'America/Denver', $created_cal->get_meta( 'timezone' ) ); // Adjust if needed

			$this->created_ids['calendars'][] = $created_cal->id;

			// Verify availability was created FOR THE HOST USER
			$default_avail = \QuillBooking\Availabilities::get_default_availability( $host_for_cal );
			$this->assertNotNull( $default_avail, "Default availability not created/set for host user {$host_for_cal}" );
		}
	}

	/**
	 * @covers ::create_item
	 * @covers ::create_item_permissions_check
	 * @covers ::validate_team_calendar
	 */
	// Inside test_create_item_team_success()
	public function test_create_item_team_success() {
		wp_set_current_user( $this->admin_user_id );

		// --- Add Cleanup Specific to This Test ---

		Calendar_Model::where( 'user_id', $this->host_user_id_1 )->where( 'type', 'host' )->delete();
		Calendar_Model::where( 'user_id', $this->host_user_id_2 )->where( 'type', 'host' )->delete();

		// --- End Cleanup ---

		// ... (Setup: cleanup, create host cals) ...
		$this->create_test_calendar_direct( $this->host_user_id_1, 'Host Cal For Team 1', 'host' );
		$this->create_test_calendar_direct( $this->host_user_id_2, 'Host Cal For Team 2', 'host' );

		$team_cal_name = 'New Team Calendar API Test Integration';
		$member_ids    = array( $this->host_user_id_1, $this->host_user_id_2 );
		$request_data  = array(
			'name'    => $team_cal_name,
			'type'    => 'team',
			'members' => $member_ids,
		);

		$request = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'API call failed: ' . ( is_wp_error( $response ) ? $response->get_error_message() : 'Status was ' . $response->get_status() ) );

		// --- Get the ID from the response ---
		$response_data = $response->get_data();
		// Assuming get_data() returns the Calendar_Model object for a successful POST
		$this->assertInstanceOf( Calendar_Model::class, $response_data, 'Response data should be Calendar_Model object' );
		$created_cal_id = $response_data->id;
		$this->assertNotNull( $created_cal_id, 'Created calendar ID not found in response' );
		// --- End Get ID ---

		// Verify DB using the CORRECT ID
		$created_cal = Calendar_Model::find( $created_cal_id ); // <-- Find by ID
		$this->assertNotNull( $created_cal, 'Team calendar not found in DB using ID from response' );

		if ( $created_cal ) {
			// Ensure we add the correct ID for cleanup
			if ( ! in_array( $created_cal->id, $this->created_ids['calendars'] ) ) {
				$this->created_ids['calendars'][] = $created_cal->id;
			}

			// Verification using meta check
			$meta_value                  = $created_cal->get_meta( 'team_members' );
			$synced_member_ids_from_meta = is_array( $meta_value ) ? $meta_value : array();

			$this->assertIsArray( $synced_member_ids_from_meta );
			// Use $member_ids defined earlier in the test
			$this->assertCount( count( $member_ids ), $synced_member_ids_from_meta, 'Incorrect number of team members stored in meta' );
			$this->assertEqualsCanonicalizing( $member_ids, $synced_member_ids_from_meta, 'Stored team member IDs do not match expected IDs' );
		}
	}

	/** @covers ::create_item @covers ::create_item_permissions_check */
	public function test_create_item_permission_denied() {
		// Keep implementation (should pass now if caps are right)
		wp_set_current_user( $this->subscriber_user_id );
		$request_data = array(
			'name'         => 'Denied Cal',
			'type'         => 'host',
			'user_id'      => $this->subscriber_user_id,
			'availability' => array( 'weekly_hours' => array() ),
		); // Add minimal valid data
		$request      = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() );
	}

	// --- PUT /calendars/{id} ---

	/**
	 * @covers ::update_item
	 * @covers ::update_item_permissions_check
	 */
	public function test_update_item_success() {
		$cal_owner_id = $this->subscriber_user_id; // Test updating own calendar
		wp_set_current_user( $cal_owner_id );
		$cal = $this->create_test_calendar_direct( $cal_owner_id, 'Calendar To Update', 'host' );

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_manage_calendar')->with($cal->id)->andReturn(true);

		$update_data = array(
			'name'        => 'Updated Calendar Name',
			'description' => 'New description.',
			'slug'        => 'updated-calendar-slug',
		);
		$request     = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal->id );
		$request->set_body_params( $update_data );

		$response = $this->server->dispatch( $request );

		// Relies on real Capabilities::can_manage_calendar check
		$this->assertEquals( 200, $response->get_status() );

		// Verify DB
		$updated_cal = Calendar_Model::find( $cal->id );
		$this->assertNotNull( $updated_cal );
		$this->assertEquals( $update_data['name'], $updated_cal->name );
		$this->assertEquals( $update_data['description'], $updated_cal->description );
		$this->assertEquals( $update_data['slug'], $updated_cal->slug );
	}

	/**
	 * @covers ::update_item
	 * @covers ::update_item_permissions_check
	 */
	public function test_update_item_permission_denied() {
		wp_set_current_user( $this->subscriber_user_id ); // Subscriber trying to update admin's calendar
		$cal = $this->create_test_calendar_direct( $this->admin_user_id, 'Admin Cal To Update', 'host' );

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_manage_calendar')->with($cal->id)->andReturn(false);

		$update_data = array( 'name' => 'Attempted Update' );
		$request     = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal->id );
		$request->set_body_params( $update_data );

		$response = $this->server->dispatch( $request );
		// Relies on real Capabilities::can_manage_calendar check
		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * @covers ::update_item
	 */
	public function test_update_item_not_found() {
		wp_set_current_user( $this->admin_user_id );
		$non_existent_id = 99998;

		// ** REMOVE Mockery **
		// Assuming real Capabilities::can_manage_calendar returns true for admin for non-existent ID
		// Capabilities::shouldReceive('can_manage_calendar')->with($non_existent_id)->andReturn(true);

		$update_data = array( 'name' => 'Update Non Existent' );
		$request     = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $non_existent_id );
		$request->set_body_params( $update_data );

		$response = $this->server->dispatch( $request );
		// Relies on controller returning 404
		$this->assertEquals( 404, $response->get_status() );
	}

	// --- DELETE /calendars/{id} ---

	/**
	 * @covers ::delete_item
	 * @covers ::delete_item_permissions_check
	 */
	public function test_delete_item_success() {
		wp_set_current_user( $this->admin_user_id );
		$cal    = $this->create_test_calendar_direct( $this->admin_user_id, 'Calendar To Delete', 'host' );
		$cal_id = $cal->id;

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_manage_calendar')->with($cal_id)->andReturn(true);
		$this->assertNotNull( Calendar_Model::find( $cal_id ), 'Calendar should exist before delete.' );

		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal_id );
		$response = $this->server->dispatch( $request );

		// Relies on real capability check
		$this->assertEquals( 200, $response->get_status() );
		// ... rest of assertions ...
		$this->assertNull( Calendar_Model::find( $cal_id ), 'Calendar should be deleted from DB.' );
		$this->created_ids['calendars'] = array_diff( $this->created_ids['calendars'], array( $cal_id ) );
	}

	/**
	 * @covers ::delete_item
	 * @covers ::delete_item_permissions_check
	 */
	public function test_delete_item_permission_denied() {
		wp_set_current_user( $this->subscriber_user_id ); // Subscriber cannot delete admin's
		$cal = $this->create_test_calendar_direct( $this->admin_user_id, 'Admin Cal To Delete', 'host' );

		// ** REMOVE Mockery **
		// Capabilities::shouldReceive('can_manage_calendar')->with($cal->id)->andReturn(false);

		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/' . $cal->id );
		$response = $this->server->dispatch( $request );

		// Relies on real capability check
		$this->assertEquals( 403, $response->get_status() );
		$this->assertNotNull( Calendar_Model::find( $cal->id ), 'Calendar should still exist.' );
	}

	/**
	 * @covers ::delete_item
	 */
	public function test_delete_item_not_found() {
		wp_set_current_user( $this->admin_user_id );
		$non_existent_id = 99997;

		// ** REMOVE Mockery **
		// Assuming real Capabilities::can_manage_calendar returns true for admin for non-existent ID
		// Capabilities::shouldReceive('can_manage_calendar')->with($non_existent_id)->andReturn(true);

		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/' . $non_existent_id );
		$response = $this->server->dispatch( $request );

		// Relies on controller returning 404
		$this->assertEquals( 404, $response->get_status() );
	}

	// --- DELETE /calendars (Bulk) ---

	/**
	 * @covers ::delete_items
	 * @covers ::delete_items_permissions_check
	 */
	public function test_delete_items_bulk_success() {
		wp_set_current_user( $this->admin_user_id ); // Needs manage_all_calendars

		$cal1          = $this->create_test_calendar_direct( $this->admin_user_id, 'Bulk Delete 1', 'host' );
		$cal2          = $this->create_test_calendar_direct( $this->admin_user_id, 'Bulk Delete 2', 'host' );
		$ids_to_delete = array( $cal1->id, $cal2->id );

		// *** Potential Missing Assertion ***
		// It's good practice to assert they exist before deleting
		$this->assertNotNull( Calendar_Model::find( $cal1->id ) );
		$this->assertNotNull( Calendar_Model::find( $cal2->id ) );

		$request = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base );
		// Note: Bulk delete data might need to be in body, not query params for DELETE
		// $request->set_param('ids', $ids_to_delete); // Check if this works for DELETE
		$request->set_body_params( array( 'ids' => $ids_to_delete ) ); // More common for DELETE body

		$response = $this->server->dispatch( $request );

		// *** ASSERTIONS ARE PRESENT HERE ***
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data ); // Check if data is an array
		$this->assertArrayHasKey( 'message', $data ); // Check for message key

		$this->assertNull( Calendar_Model::find( $cal1->id ), 'Calendar 1 should be deleted.' );
		$this->assertNull( Calendar_Model::find( $cal2->id ), 'Calendar 2 should be deleted.' );
		// Remove from created IDs
		$this->created_ids['calendars'] = array_diff( $this->created_ids['calendars'], $ids_to_delete );
	}
	/**
	 * @covers ::delete_items
	 * @covers ::delete_items_permissions_check
	 */
	public function test_delete_items_bulk_permission_denied() {
		wp_set_current_user( $this->subscriber_user_id ); // Lacks manage_all_calendars

		$cal1          = $this->create_test_calendar_direct( $this->admin_user_id, 'Bulk Delete Fail 1', 'host' );
		$ids_to_delete = array( $cal1->id );

		// *** Potential Missing Assertion ***
		$this->assertNotNull( Calendar_Model::find( $cal1->id ) );

		$request = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base );
		// $request->set_param('ids', $ids_to_delete);
		$request->set_body_params( array( 'ids' => $ids_to_delete ) ); // Use body for DELETE data

		$response = $this->server->dispatch( $request );

		// *** ASSERTIONS ARE PRESENT HERE ***
		$this->assertEquals( 403, $response->get_status() );
		$this->assertNotNull( Calendar_Model::find( $cal1->id ), 'Calendar should not be deleted.' );
	}
} // End Class
