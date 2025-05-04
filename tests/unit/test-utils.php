<?php
/**
 * Class UtilsTest
 *
 * @package QuillBooking
 */

use QuillBooking\Utils;

/**
 * Test for QuillBooking\Utils class
 */
class UtilsTest extends QuillBooking_Base_Test_Case {

	/**
	 * Test get_timezones returns a non-empty array of timezones
	 */
	public function test_get_timezones() {
		$timezones = Utils::get_timezones();

		$this->assertIsArray( $timezones );
		$this->assertNotEmpty( $timezones );

		// Test that it contains common timezones
		$this->assertArrayHasKey( 'UTC', $timezones );
		$this->assertArrayHasKey( 'America/New_York', $timezones );
		$this->assertArrayHasKey( 'Europe/London', $timezones );
		$this->assertArrayHasKey( 'Asia/Tokyo', $timezones );
	}

	/**
	 * Test generate_hash_key generates unique identifiers
	 */
	public function test_generate_hash_key() {
		// Test uniqueness - generating multiple keys should produce different values
		$keys = array();
		for ( $i = 0; $i < 5; $i++ ) {
			$key = Utils::generate_hash_key();
			$this->assertIsString( $key );
			$this->assertNotEmpty( $key );
			$this->assertNotContains( $key, $keys, 'Generated keys should be unique' );
			$keys[] = $key;
		}

		// Test that each call generates a different hash (the function doesn't accept parameters)
		$this->assertNotEquals(
			Utils::generate_hash_key(),
			Utils::generate_hash_key(),
			'Different calls should generate different hash keys'
		);
	}

	/**
	 * Test create_date_time functionality with various inputs and configurations
	 */
	public function test_create_date_time() {
		// Test case 1: String date input with timezone conversion to UTC
		$date_string = '2023-01-15 14:30:00';
		$timezone    = 'America/New_York';

		$date = Utils::create_date_time( $date_string, $timezone );

		// Verify basic functionality
		$this->assertInstanceOf( 'DateTime', $date, 'Should return a DateTime object' );

		// Verify timezone conversion behavior
		$this->assertEquals( 'UTC', $date->getTimezone()->getName(), 'Timezone should be converted to UTC by default' );

		// Verify the time was correctly adjusted for timezone
		$original_date = new DateTime( $date_string, new DateTimeZone( $timezone ) );
		$this->assertEquals(
			$original_date->getTimestamp(),
			$date->getTimestamp(),
			'Timestamp should remain the same after timezone conversion'
		);

		// Test case 2: Timestamp input
		$timestamp = strtotime( '2023-01-15 12:00:00' );
		$date      = Utils::create_date_time( $timestamp, 'Europe/London' );

		$this->assertInstanceOf( 'DateTime', $date, 'Should handle timestamp input' );
		$this->assertEquals( $timestamp, $date->getTimestamp(), 'Should preserve the exact timestamp' );

		// Test case 3: Option to keep original timezone
		$date = Utils::create_date_time( $date_string, 'Asia/Tokyo', false );

		$this->assertEquals( 'Asia/Tokyo', $date->getTimezone()->getName(), 'Should keep original timezone when specified' );
		$this->assertEquals( '14:30:00', $date->format( 'H:i:s' ), 'Time should remain unchanged when keeping original timezone' );

		// Test case 4: Different date formats
		$formats = array(
			'Y-m-d H:i:s' => '2023-01-15 14:30:00',
			'Y-m-d'       => '2023-01-15',
			'H:i:s'       => '14:30:00',
		);

		foreach ( $formats as $format => $date_string ) {
			$date = Utils::create_date_time( $date_string, 'UTC' );
			$this->assertInstanceOf( 'DateTime', $date, "Should handle date format: $format" );
		}
	}

	/**
	 * Test get_user_capabilities returns capabilities for a user
	 */
	public function test_get_user_capabilities() {
		// Create a test user with the 'administrator' role
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );

		$capabilities = Utils::get_user_capabilities( $user_id );

		$this->assertIsArray( $capabilities );
		$this->assertNotEmpty( $capabilities );

		// Administrator should have these capabilities
		$this->assertContains( 'edit_posts', $capabilities );
		$this->assertContains( 'manage_options', $capabilities );
	}

	/**
	 * Test get_user_capabilities returns empty array for non-existent user
	 */
	public function test_get_user_capabilities_nonexistent_user() {
		$capabilities = Utils::get_user_capabilities( 999999 ); // Non-existent user ID

		$this->assertIsArray( $capabilities );
		$this->assertEmpty( $capabilities );
	}

	/**
	 * Test get_user_capabilities with a user that has multiple roles
	 */
	public function test_get_user_capabilities_multiple_roles() {
		// Create a test user
		$user_id = $this->factory->user->create( array( 'role' => 'editor' ) );

		// Add an additional role
		$user = get_userdata( $user_id );
		$user->add_role( 'author' );

		$capabilities = Utils::get_user_capabilities( $user_id );

		$this->assertIsArray( $capabilities );
		$this->assertNotEmpty( $capabilities );

		// Should have editor capabilities
		$this->assertContains( 'edit_others_posts', $capabilities );

		// Should have author capabilities
		$this->assertContains( 'publish_posts', $capabilities );
	}
}
