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
	 * Test generate_hash_key generates unique hash values
	 */
	public function test_generate_hash_key() {
		$hash1 = Utils::generate_hash_key();
		$hash2 = Utils::generate_hash_key();

		$this->assertIsString( $hash1 );
		$this->assertEquals( 32, strlen( $hash1 ) ); // MD5 is 32 characters
		$this->assertNotEquals( $hash1, $hash2 ); // Two calls should generate different hashes
	}

	/**
	 * Test create_date_time creates a DateTime object from a string
	 */
	public function test_create_date_time_from_string() {
		$date_string = '2023-01-15 14:30:00';
		$timezone    = 'America/New_York';

		$date = Utils::create_date_time( $date_string, $timezone );

		$this->assertInstanceOf( 'DateTime', $date );
		$this->assertEquals( 'UTC', $date->getTimezone()->getName() ); // Should be converted to UTC

		// The time in New York (EST/EDT) is 5/4 hours behind UTC, so check for appropriate conversion
		// This handles both standard and daylight saving time
		$hour_utc = (int) $date->format( 'G' );
		$this->assertTrue(
			$hour_utc === 19 || $hour_utc === 20,
			'Hour should be converted from EST/EDT to UTC'
		);
	}

	/**
	 * Test create_date_time creates a DateTime object from a timestamp
	 */
	public function test_create_date_time_from_timestamp() {
		$timestamp = strtotime( '2023-01-15 12:00:00' ); // This will be in UTC
		$timezone  = 'Europe/London';

		$date = Utils::create_date_time( $timestamp, $timezone );

		$this->assertInstanceOf( 'DateTime', $date );
		$this->assertEquals( 'UTC', $date->getTimezone()->getName() );
		$this->assertEquals( $timestamp, $date->getTimestamp() );
	}

	/**
	 * Test create_date_time without converting to UTC
	 */
	public function test_create_date_time_without_utc_conversion() {
		$date_string = '2023-01-15 14:30:00';
		$timezone    = 'Asia/Tokyo';

		$date = Utils::create_date_time( $date_string, $timezone, false );

		$this->assertInstanceOf( 'DateTime', $date );
		$this->assertEquals( $timezone, $date->getTimezone()->getName() );
		$this->assertEquals( '14:30:00', $date->format( 'H:i:s' ) );
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

	/**
	 * Test create_date_time with different time formats
	 */
	public function test_create_date_time_different_formats() {
		$formats = array(
			'Y-m-d H:i:s' => '2023-01-15 14:30:00',
			'Y-m-d'       => '2023-01-15',
			'H:i:s'       => '14:30:00',
		);

		$timezone = 'Europe/Paris';

		foreach ( $formats as $format => $date_string ) {
			$date = Utils::create_date_time( $date_string, $timezone );
			$this->assertInstanceOf( 'DateTime', $date, "Failed to create DateTime from format: $format" );
		}
	}
}
