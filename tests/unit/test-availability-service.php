<?php
/**
 * Class AvailabilityServiceTest
 *
 * @package QuillBooking
 */

use QuillBooking\Availability_service;
use QuillBooking\Availabilities;

/**
 * Test for QuillBooking\Availability_service class
 */
class AvailabilityServiceTest extends QuillBooking_Base_Test_Case {

	/**
	 * The service instance
	 *
	 * @var Availability_service
	 */
	private $service;

	/**
	 * Test setup
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset the availabilities option before each test
		delete_option( Availabilities::$option_name );

		$this->service = new Availability_service();
	}

	/**
	 * Test successful availability creation
	 */
	public function test_create_availability_success() {
		$user_id      = 1;
		$name         = 'Test Availability';
		$weekly_hours = array(
			'monday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
		);
		$timezone     = 'UTC';

		$response = $this->service->create_availability( $user_id, $name, $weekly_hours, array(), $timezone );

		// Test that the response is a WP_REST_Response
		$this->assertInstanceOf( 'WP_REST_Response', $response );

		// Test response code
		$this->assertEquals( 201, $response->get_status() );

		// Test response data
		$data = $response->get_data();
		$this->assertEquals( $user_id, $data['user_id'] );
		$this->assertEquals( $name, $data['name'] );
		$this->assertEquals( $weekly_hours, $data['weekly_hours'] );
		$this->assertEquals( $timezone, $data['timezone'] );
		$this->assertFalse( $data['is_default'] );

		// Verify it was stored correctly
		$availabilities = Availabilities::get_availabilities();
		$this->assertCount( 1, $availabilities );
		$this->assertEquals( $name, $availabilities[0]['name'] );
	}

	/**
	 * Test availability creation with default flag
	 */
	public function test_create_availability_default() {
		$user_id      = 1;
		$name         = 'Default Availability';
		$weekly_hours = array(
			'monday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
		);
		$timezone     = 'UTC';
		$default      = true;

		$response = $this->service->create_availability( $user_id, $name, $weekly_hours, array(), $timezone, $default );

		// Test response data
		$data = $response->get_data();
		$this->assertTrue( $data['is_default'] );

		// Verify it was stored correctly as default
		$default_availability = Availabilities::get_default_availability();
		$this->assertEquals( $name, $default_availability['name'] );
		$this->assertTrue( $default_availability['is_default'] );
	}

	/**
	 * Test error when no name is provided
	 */
	public function test_create_availability_invalid_name() {
		$user_id      = 1;
		$name         = ''; // Invalid - empty name
		$weekly_hours = array(
			'monday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
		);
		$timezone     = 'UTC';

		$response = $this->service->create_availability( $user_id, $name, $weekly_hours, array(), $timezone );

		// Test that the response is a WP_Error
		$this->assertInstanceOf( 'WP_Error', $response );

		// Test error code
		$this->assertEquals( 'rest_availability_invalid_name', $response->get_error_code() );

		// No availability should be stored
		$availabilities = Availabilities::get_availabilities();
		$this->assertEmpty( $availabilities );
	}

	/**
	 * Test error when no weekly hours are provided
	 */
	public function test_create_availability_invalid_weekly_hours() {
		$user_id      = 1;
		$name         = 'Test Availability';
		$weekly_hours = array(); // Invalid - empty weekly hours
		$timezone     = 'UTC';

		$response = $this->service->create_availability( $user_id, $name, $weekly_hours, array(), $timezone );

		// Test that the response is a WP_Error
		$this->assertInstanceOf( 'WP_Error', $response );

		// Test error code
		$this->assertEquals( 'rest_availability_invalid_weekly_hours', $response->get_error_code() );

		// No availability should be stored
		$availabilities = Availabilities::get_availabilities();
		$this->assertEmpty( $availabilities );
	}

	/**
	 * Test error when no timezone is provided
	 */
	public function test_create_availability_invalid_timezone() {
		$user_id      = 1;
		$name         = 'Test Availability';
		$weekly_hours = array(
			'monday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
		);
		$timezone     = ''; // Invalid - empty timezone

		$response = $this->service->create_availability( $user_id, $name, $weekly_hours, array(), $timezone );

		// Test that the response is a WP_Error
		$this->assertInstanceOf( 'WP_Error', $response );

		// Test error code
		$this->assertEquals( 'rest_availability_invalid_timezone', $response->get_error_code() );

		// No availability should be stored
		$availabilities = Availabilities::get_availabilities();
		$this->assertEmpty( $availabilities );
	}

	/**
	 * Test availability creation with overrides
	 */
	public function test_create_availability_with_overrides() {
		$user_id      = 1;
		$name         = 'Test Availability with Overrides';
		$weekly_hours = array(
			'monday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
		);
		$overrides    = array(
			'2023-01-01' => array(
				'times' => array(
					array(
						'start' => '10:00',
						'end'   => '15:00',
					),
				),
				'off'   => false,
			),
		);
		$timezone     = 'UTC';

		$response = $this->service->create_availability( $user_id, $name, $weekly_hours, $overrides, $timezone );

		// Test response data
		$data = $response->get_data();
		$this->assertEquals( $overrides, $data['override'] );

		// Verify overrides were stored correctly
		$availabilities = Availabilities::get_availabilities();
		$this->assertEquals( $overrides, $availabilities[0]['override'] );
	}

	/**
	 * Test that a unique ID is generated for each availability
	 */
	public function test_create_availability_unique_ids() {
		$user_id      = 1;
		$name1        = 'Test Availability 1';
		$name2        = 'Test Availability 2';
		$weekly_hours = array(
			'monday' => array(
				'times' => array(
					array(
						'start' => '09:00',
						'end'   => '17:00',
					),
				),
				'off'   => false,
			),
		);
		$timezone     = 'UTC';

		$response1 = $this->service->create_availability( $user_id, $name1, $weekly_hours, array(), $timezone );
		$response2 = $this->service->create_availability( $user_id, $name2, $weekly_hours, array(), $timezone );

		$data1 = $response1->get_data();
		$data2 = $response2->get_data();

		// IDs should be different
		$this->assertNotEquals( $data1['id'], $data2['id'] );

		// Verify both availabilities were stored
		$availabilities = Availabilities::get_availabilities();
		$this->assertCount( 2, $availabilities );
	}
}
