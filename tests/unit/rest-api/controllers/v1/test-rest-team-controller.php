<?php

namespace QuillBooking\Tests\REST_API\Controllers\V1;

// Base test case
use QuillBooking_Base_Test_Case; // Use your actual base test case namespace

// WP Core & REST API
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_User;

// Internal dependencies
use QuillBooking\REST_API\Controllers\V1\REST_Team_Controller;
use QuillBooking\Models\Team_Model; // Assuming Team_Model exists
use QuillBooking\Models\Calendar_Model; // Used for is_host check
use QuillBooking\Models\User_Model;   // May be used by Team_Model
use QuillBooking\Capabilities;       // Used in controller

/**
 * Class Test_Rest_Team_Controller
 * Test for QuillBooking\REST_API\Controllers\V1\REST_Team_Controller class
 *
 * @package QuillBooking\Tests\REST_API\Controllers\V1
 * @coversDefaultClass \QuillBooking\REST_API\Controllers\V1\REST_Team_Controller
 */
class Test_Rest_Team_Controller extends QuillBooking_Base_Test_Case {


	/** @var WP_REST_Server */
	protected $server;

	/** @var int */
	protected $admin_user_id;

	/** @var int */
	protected $basic_user_id; // A user to be made into a team member

	/** @var int */
	protected $non_member_user_id; // A user who should NOT be a team member

	/** @var string */
	protected $namespace = 'qb/v1';

	/** @var string */
	protected $rest_base = 'team-members';

	/** @var array */
	private $created_ids = array(
		'users'     => array(),
		'calendars' => array(),
	); // Track users and maybe calendars

	/** @var array */
	private $test_capabilities = array( // Define some capabilities for testing
		'quillbooking_read_own_bookings',
		'quillbooking_manage_own_calendars',
		// Add other relevant non-admin caps
	);


	public function setUp(): void {
		parent::setUp();

		// --- User Setup ---
		$this->admin_user_id          = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$this->created_ids['users'][] = $this->admin_user_id;
		$admin_user_obj               = get_user_by( 'id', $this->admin_user_id );
		// Ensure admin has manage_options (usually implicit with administrator role)
		$admin_user_obj->add_cap( 'manage_options' );

		$this->basic_user_id          = $this->factory->user->create( array( 'role' => 'subscriber' ) ); // Start as editor maybe
		$this->created_ids['users'][] = $this->basic_user_id;

		$this->non_member_user_id     = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		$this->created_ids['users'][] = $this->non_member_user_id;

		// Pre-assign manage_options to admin for permission checks
		// Note: Team controller mostly uses manage_options, specific caps are assigned/removed by API calls

		// --- REST Server Setup ---
		global $wp_rest_server;
		$this->server = $wp_rest_server = new \WP_REST_Server();
		do_action( 'rest_api_init' );
	}

	public function tearDown(): void {
		// Clean up users and any calendars created
		foreach ( $this->created_ids['calendars'] as $id ) {
			Calendar_Model::destroy( $id );
		}
		foreach ( $this->created_ids['users'] as $id ) {
			delete_user_meta( $id, 'quillbooking_team_member' ); // Clean up meta
			wp_delete_user( $id );
		}
		$this->created_ids = array(
			'users'     => array(),
			'calendars' => array(),
		);

		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tearDown();
	}

	// --- Helper ---
	/** Make a user a team member directly for setup */
	private function make_user_team_member( int $user_id, array $caps = array() ) {
		update_user_meta( $user_id, 'quillbooking_team_member', 'yes' );
		$user = new WP_User( $user_id ); // Get user object
		if ( ! $user->exists() ) {
			return;
		}

		$user->add_cap( 'manage_quillbooking' );

		// Add specific caps
		if ( ! empty( $caps ) ) {
			foreach ( $caps as $cap ) {
				$user->add_cap( $cap );
			}
		}

		// *** ADD CACHE CLEARING ***
		clean_user_cache( $user_id );
		// *** END CACHE CLEARING ***

		$user_check = get_userdata( $user_id ); // Re-fetch
	}

	/** Helper to create a Calendar directly */
	private function create_test_calendar( int $user_id, string $name = 'Test Calendar', string $type = 'host' ): Calendar_Model {
		$calendar = Calendar_Model::create(
			array(
				'user_id' => $user_id,
				'name'    => $name,
				'type'    => $type,
				'slug'    => sanitize_title( $name . '-' . uniqid() ),
				'status'  => 'active',
			)
		);
		if ( $calendar ) {
			$this->created_ids['calendars'][] = $calendar->id;
		} else {
			trigger_error( "Failed to create test calendar '{$name}'", E_USER_ERROR );
		}
		return $calendar;
	}

	// --- Test Methods ---

	/** @covers ::register_routes */
	public function test_register_routes() {
		$routes     = $this->server->get_routes();
		$base_route = '/' . $this->namespace . '/' . $this->rest_base;
		$this->assertArrayHasKey( $base_route, $routes, 'Collection route missing' );
		$this->assertArrayHasKey( $base_route . '/(?P<id>[\d]+)', $routes, 'Single item route missing' );
	}

	// --- GET /team-members ---

	/**
	 * @covers ::get_items
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_as_admin() {
		wp_set_current_user( $this->admin_user_id );

		// Make admin and basic_user team members
		$this->make_user_team_member( $this->admin_user_id, array( 'manage_options' ) );
		$this->make_user_team_member( $this->basic_user_id, $this->test_capabilities );
		// non_member_user_id should NOT be included

		$request = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base );
		// Request first page (default)
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		// *** ADJUSTED ASSERTIONS ***

		// 1. Assert the response data is an instance of Collection
		$items_collection = $response->get_data(); // Controller returns Collection directly
		$this->assertInstanceOf( \Illuminate\Support\Collection::class, $items_collection, 'Response data should be an Illuminate Collection' );

		// 2. Assert the number of items IN THE COLLECTION (items on the current page)
		// NOTE: We cannot reliably test the *total* number of members across all pages with this controller implementation.
		// We assume here that both members fit on the first page (default per_page=10).
		$this->assertCount( 2, $items_collection, 'Should find 2 team members on the first page' );

		// 3. Check the contents of the collection
		// Convert collection to array for easier checking or use collection methods
		$items_array = $items_collection->all(); // Convert to plain array
		$ids         = wp_list_pluck( $items_array, 'ID' ); // Pluck from the array of formatted items

		$this->assertContains( $this->admin_user_id, $ids );
		$this->assertContains( $this->basic_user_id, $ids );
		$this->assertNotContains( $this->non_member_user_id, $ids );

		// You can also check the structure of the first item if needed
		if ( count( $items_array ) > 0 ) {
			$first_item = $items_array[0];
			$this->assertIsArray( $first_item );
			$this->assertArrayHasKey( 'ID', $first_item );
			$this->assertArrayHasKey( 'display_name', $first_item );
			$this->assertArrayHasKey( 'capabilities', $first_item );
			$this->assertArrayHasKey( 'is_host', $first_item );
		}
	}

	/**
	 * @covers ::get_items
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_permission_denied() {
		wp_set_current_user( $this->basic_user_id ); // Non-admin

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 403, $response->get_status() ); // Requires manage_options
	}

	// --- POST /team-members ---

	/**
	 * @covers ::create_item
	 * @covers ::create_item_permissions_check
	 */
	public function test_create_item_success() {
		wp_set_current_user( $this->admin_user_id ); // Needs manage_options

		$user_to_add = $this->non_member_user_id;
		$this->assertFalse( get_user_meta( $user_to_add, 'quillbooking_team_member', true ) === 'yes', 'User should not be member initially' );

		$request_data = array(
			'user_id'      => $user_to_add,
			'capabilities' => $this->test_capabilities,
		);
		$request      = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		// Verify meta and capabilities
		$this->assertEquals( 'yes', get_user_meta( $user_to_add, 'quillbooking_team_member', true ), 'Team member meta not set' );
		$user_obj = new WP_User( $user_to_add );
		$this->assertTrue( $user_obj->has_cap( 'manage_quillbooking' ), 'Base cap not added' );
		foreach ( $this->test_capabilities as $cap ) {
			$this->assertTrue( $user_obj->has_cap( $cap ), "Capability '{$cap}' not added" );
		}
	}

	/** @covers ::create_item */
	public function test_create_item_user_not_found() {
		wp_set_current_user( $this->admin_user_id );
		$request_data = array(
			'user_id'      => 99999,
			'capabilities' => $this->test_capabilities,
		);
		$request      = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() ); // User not found
	}

	/** @covers ::create_item */
	public function test_create_item_already_member() {
		wp_set_current_user( $this->admin_user_id );
		$this->make_user_team_member( $this->basic_user_id ); // Make user a member first

		$request_data = array(
			'user_id'      => $this->basic_user_id,
			'capabilities' => $this->test_capabilities,
		);
		$request      = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() ); // Already member
	}

	/** @covers ::create_item @covers ::create_item_permissions_check */
	public function test_create_item_permission_denied() {
		wp_set_current_user( $this->basic_user_id ); // Non-admin
		$request_data = array(
			'user_id'      => $this->non_member_user_id,
			'capabilities' => $this->test_capabilities,
		);
		$request      = new WP_REST_Request( 'POST', '/' . $this->namespace . '/' . $this->rest_base );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() ); // Requires manage_options
	}

	// --- GET /team-members/{id} ---

	/** @covers ::get_item @covers ::get_item_permissions_check @covers ::format_item_for_response */
	public function test_get_item_success() {
		wp_set_current_user( $this->admin_user_id );
		$this->make_user_team_member( $this->basic_user_id, $this->test_capabilities );
		// Create a calendar for this user to test the 'is_host' check
		$this->create_test_calendar( $this->basic_user_id, 'Basic User Host Cal', 'host' );

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->basic_user_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertEquals( $this->basic_user_id, $data['ID'] );
		$this->assertArrayHasKey( 'capabilities', $data );
		$this->assertIsArray( $data['capabilities'] );
		// Check if specific caps are present (note: WP stores caps as key=>true)
		$this->assertArrayHasKey( 'manage_quillbooking', $data['capabilities'] );
		foreach ( $this->test_capabilities as $cap ) {
			$this->assertArrayHasKey( $cap, $data['capabilities'] );
		}
		$this->assertTrue( $data['is_host'], 'User should be marked as host' );
	}

	/** @covers ::get_item */
	public function test_get_item_is_not_host() {
		wp_set_current_user( $this->admin_user_id );
		$this->make_user_team_member( $this->basic_user_id ); // Member, but no calendar

		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->basic_user_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertFalse( $data['is_host'], 'User should NOT be marked as host' );
	}

	/** @covers ::get_item */
	public function test_get_item_not_found() {
		wp_set_current_user( $this->admin_user_id );
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/99999' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() ); // User not found by Team_Model::find
	}

	/** @covers ::get_item @covers ::get_item_permissions_check */
	public function test_get_item_permission_denied() {
		wp_set_current_user( $this->basic_user_id ); // Non-admin
		$this->make_user_team_member( $this->admin_user_id ); // Admin is member we try to get
		$request  = new WP_REST_Request( 'GET', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->admin_user_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() ); // Requires manage_options
	}

	// --- PUT /team-members/{id} ---

	/** @covers ::update_item @covers ::update_item_permissions_check */
	public function test_update_item_success() {
		wp_set_current_user( $this->admin_user_id );

		// Use a QB cap that WILL be removed by the corrected controller logic
		$cap_to_remove = 'quillbooking_read_own_availability'; // Example QB cap
		$caps_before   = array( $cap_to_remove );
		$this->make_user_team_member( $this->basic_user_id, $caps_before );

		// Capabilities to SET via API (doesn't include the one above)
		$caps_after = $this->test_capabilities; // e.g., ['quillbooking_read_own_bookings', 'quillbooking_manage_own_calendars']

		// Verify initial state
		$user_check = new WP_User( $this->basic_user_id );
		$this->assertTrue( $user_check->has_cap( $cap_to_remove ), 'User should have initial cap before update.' );

		$request_data = array( 'capabilities' => $caps_after );
		$request      = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->basic_user_id );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		// Verify capabilities on the actual WP_User object AFTER update
		$user_obj = new WP_User( $this->basic_user_id );
		// Base cap should still be there (assuming controller adds it)
		$this->assertTrue( $user_obj->has_cap( 'manage_quillbooking' ), "Base cap 'manage_quillbooking' missing after update." );
		// Check caps from request were added
		foreach ( $caps_after as $cap ) {
			$this->assertTrue( $user_obj->has_cap( $cap ), "Cap '{$cap}' should be present after update" );
		}
		// Assert the original QB cap was removed correctly
		$this->assertFalse( $user_obj->has_cap( $cap_to_remove ), "Old QB cap '{$cap_to_remove}' should have been removed" );
	}

	/** @covers ::update_item */
	public function test_update_item_user_not_team_member() {
		wp_set_current_user( $this->admin_user_id );
		// $this->non_member_user_id is NOT a team member
		$request_data = array( 'capabilities' => $this->test_capabilities );
		$request      = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->non_member_user_id );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() ); // User is not a team member
	}

	/** @covers ::update_item @covers ::update_item_permissions_check */
	public function test_update_item_permission_denied() {
		wp_set_current_user( $this->basic_user_id ); // Non-admin
		$this->make_user_team_member( $this->admin_user_id ); // Admin is member we try to update
		$request_data = array( 'capabilities' => $this->test_capabilities );
		$request      = new WP_REST_Request( 'PUT', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->admin_user_id );
		$request->set_body_params( $request_data );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() ); // Requires manage_options
	}

	// --- DELETE /team-members/{id} ---

	/** @covers ::delete_item @covers ::delete_item_permissions_check */
	public function test_delete_item_success() {
		wp_set_current_user( $this->admin_user_id );
		$caps_to_remove = array_merge( array( 'manage_quillbooking' ), $this->test_capabilities );
		$this->make_user_team_member( $this->basic_user_id, $this->test_capabilities );

		// Verify user is member and has caps before delete
		$this->assertEquals( 'yes', get_user_meta( $this->basic_user_id, 'quillbooking_team_member', true ) );
		$user_obj = new WP_User( $this->basic_user_id );
		foreach ( $caps_to_remove as $cap ) {
			$this->assertTrue( $user_obj->has_cap( $cap ) );
		}

		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->basic_user_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() ); // Controller returns 200

		// Verify meta removed and caps removed
		$this->assertFalse( get_user_meta( $this->basic_user_id, 'quillbooking_team_member', true ) === 'yes', 'Team member meta should be removed' );
		$user_obj = new WP_User( $this->basic_user_id ); // Re-fetch user data
		foreach ( $caps_to_remove as $cap ) {
			$this->assertFalse( $user_obj->has_cap( $cap ), "Capability '{$cap}' should be removed" );
		}
	}

	/** @covers ::delete_item */
	public function test_delete_item_user_not_found() {
		wp_set_current_user( $this->admin_user_id );
		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/99999' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 404, $response->get_status() );
	}

	/** @covers ::delete_item @covers ::delete_item_permissions_check */
	public function test_delete_item_permission_denied() {
		wp_set_current_user( $this->basic_user_id ); // Non-admin
		$this->make_user_team_member( $this->admin_user_id ); // Admin is member we try to delete
		$request  = new WP_REST_Request( 'DELETE', '/' . $this->namespace . '/' . $this->rest_base . '/' . $this->admin_user_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 403, $response->get_status() ); // Requires manage_options

		// Verify meta NOT removed
		$this->assertEquals( 'yes', get_user_meta( $this->admin_user_id, 'quillbooking_team_member', true ) );
	}
} // End Class
