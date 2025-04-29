<?php
/**
 * Class AvailabilitiesTest
 *
 * @package QuillBooking
 */

use QuillBooking\Availabilities;

/**
 * Test for QuillBooking\Availabilities class
 */
class AvailabilitiesTest extends QuillBooking_Base_Test_Case {

	/**
	 * Test setup
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset the availabilities option before each test
		delete_option( Availabilities::$option_name );
	}

	/**
	 * Test get_availabilities returns empty array when no availabilities exist
	 */
	public function test_get_availabilities_empty() {
		$availabilities = Availabilities::get_availabilities();

		$this->assertIsArray( $availabilities );
		$this->assertEmpty( $availabilities );
	}

	/**
	 * Test add_availability adds an availability and get_availability retrieves it
	 */
	public function test_add_and_get_availability() {
		$test_availability = array(
			'id'           => 'test-availability-1',
			'user_id'      => '1',
			'name'         => 'Test Availability',
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

		$result = Availabilities::add_availability( $test_availability );

		// Test that add_availability returns the added availability
		$this->assertEquals( $test_availability, $result );

		// Test that the availability is correctly stored
		$stored_availabilities = Availabilities::get_availabilities();
		$this->assertCount( 1, $stored_availabilities );
		$this->assertEquals( $test_availability, $stored_availabilities[0] );

		// Test that get_availability retrieves the specific availability
		$retrieved = Availabilities::get_availability( 'test-availability-1' );
		$this->assertEquals( $test_availability, $retrieved );
	}

	/**
	 * Test get_availability returns null when availability doesn't exist
	 */
	public function test_get_availability_nonexistent() {
		$retrieved = Availabilities::get_availability( 'nonexistent-id' );
		$this->assertNull( $retrieved );
	}

	/**
	 * Test get_user_availabilities returns availabilities for specific user
	 */
	public function test_get_user_availabilities() {
		$test_availability1 = array(
			'id'           => 'test-availability-1',
			'user_id'      => '1',
			'name'         => 'User 1 Availability',
			'weekly_hours' => array(),
		);

		$test_availability2 = array(
			'id'           => 'test-availability-2',
			'user_id'      => '1',
			'name'         => 'User 1 Second Availability',
			'weekly_hours' => array(),
		);

		$test_availability3 = array(
			'id'           => 'test-availability-3',
			'user_id'      => '2',
			'name'         => 'User 2 Availability',
			'weekly_hours' => array(),
		);

		Availabilities::add_availability( $test_availability1 );
		Availabilities::add_availability( $test_availability2 );
		Availabilities::add_availability( $test_availability3 );

		$user1_availabilities = Availabilities::get_user_availabilities( '1' );
		$this->assertCount( 2, $user1_availabilities );

		$user2_availabilities = Availabilities::get_user_availabilities( '2' );
		$this->assertCount( 1, $user2_availabilities );

		$user3_availabilities = Availabilities::get_user_availabilities( '3' );
		$this->assertEmpty( $user3_availabilities );
	}

	/**
	 * Test update_availability updates an existing availability
	 */
	public function test_update_availability() {
		$test_availability = array(
			'id'           => 'test-availability-1',
			'user_id'      => '1',
			'name'         => 'Original Name',
			'weekly_hours' => array(),
		);

		Availabilities::add_availability( $test_availability );

		$updated_availability = array(
			'id'           => 'test-availability-1',
			'user_id'      => '1',
			'name'         => 'Updated Name',
			'weekly_hours' => array(),
		);

		$result = Availabilities::update_availability( $updated_availability );
		$this->assertTrue( $result );

		$retrieved = Availabilities::get_availability( 'test-availability-1' );
		$this->assertEquals( 'Updated Name', $retrieved['name'] );
	}

	/**
	 * Test delete_availability removes an availability
	 */
	public function test_delete_availability() {
		$test_availability = array(
			'id'           => 'test-availability-1',
			'user_id'      => '1',
			'name'         => 'Test Availability',
			'weekly_hours' => array(),
		);

		Availabilities::add_availability( $test_availability );

		$result = Availabilities::delete_availability( 'test-availability-1' );
		$this->assertTrue( $result );

		$availabilities = Availabilities::get_availabilities();
		$this->assertEmpty( $availabilities );
	}

	/**
	 * Test get_default_availability returns the default availability
	 */
	public function test_get_default_availability() {
		$regular_availability = array(
			'id'           => 'regular',
			'user_id'      => '1',
			'name'         => 'Regular',
			'is_default'   => false,
			'weekly_hours' => array(),
		);

		$default_availability = array(
			'id'           => 'default',
			'user_id'      => 'system',
			'name'         => 'Default',
			'is_default'   => true,
			'weekly_hours' => array(),
		);

		Availabilities::add_availability( $regular_availability );
		Availabilities::add_availability( $default_availability );

		$retrieved = Availabilities::get_default_availability();
		$this->assertEquals( 'default', $retrieved['id'] );
		$this->assertTrue( $retrieved['is_default'] );
	}

	/**
	 * Test get_system_availability returns the expected structure
	 */
	public function test_get_system_availability() {
		$system_availability = Availabilities::get_system_availability();

		$this->assertEquals( 'default', $system_availability['id'] );
		$this->assertEquals( 'system', $system_availability['user_id'] );
		$this->assertTrue( $system_availability['is_default'] );

		// Check that all days of the week are present
		$days = array(
			'monday',
			'tuesday',
			'wednesday',
			'thursday',
			'friday',
			'saturday',
			'sunday',
		);

		foreach ( $days as $day ) {
			$this->assertArrayHasKey( $day, $system_availability['weekly_hours'] );
			$this->assertArrayHasKey( 'times', $system_availability['weekly_hours'][ $day ] );
			$this->assertArrayHasKey( 'off', $system_availability['weekly_hours'][ $day ] );
		}

		// Weekend days should be off
		$this->assertTrue( $system_availability['weekly_hours']['saturday']['off'] );
		$this->assertTrue( $system_availability['weekly_hours']['sunday']['off'] );

		// Weekdays should be on
		$this->assertFalse( $system_availability['weekly_hours']['monday']['off'] );
	}

	/**
	 * Test add_default_availability creates the default availability when none exists
	 */
	public function test_add_default_availability() {
		$this->assertEmpty( Availabilities::get_availabilities() );

		Availabilities::add_default_availability();

		$availabilities = Availabilities::get_availabilities();
		$this->assertCount( 1, $availabilities );

		$default = $availabilities[0];
		$this->assertEquals( 'default', $default['id'] );
		$this->assertTrue( $default['is_default'] );
	}

	/**
	 * Test add_default_availability doesn't add another default when availabilities exist
	 */
	public function test_add_default_availability_with_existing() {
		$existing = array(
			'id'           => 'existing',
			'user_id'      => '1',
			'name'         => 'Existing',
			'is_default'   => false,
			'weekly_hours' => array(),
		);

		Availabilities::add_availability( $existing );

		Availabilities::add_default_availability();

		$availabilities = Availabilities::get_availabilities();
		$this->assertCount( 1, $availabilities );
		$this->assertEquals( 'existing', $availabilities[0]['id'] );
	}
}
