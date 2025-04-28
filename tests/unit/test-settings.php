<?php
/**
 * Class SettingsTest
 *
 * @package QuillBooking
 */

use QuillBooking\Settings;

/**
 * Test for QuillBooking\Settings class
 */
class SettingsTest extends QuillBooking_Base_Test_Case {

	/**
	 * Test setup
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset settings before each test
		Settings::delete_all();
	}

	/**
	 * Test get method returns default when setting doesn't exist
	 */
	public function test_get_default() {
		$result = Settings::get( 'nonexistent_key', 'default_value' );
		$this->assertEquals( 'default_value', $result );
	}

	/**
	 * Test get method returns the setting when it exists
	 */
	public function test_get_existing() {
		update_option( Settings::OPTION_NAME, array( 'test_key' => 'test_value' ) );

		$result = Settings::get( 'test_key', 'default_value' );
		$this->assertEquals( 'test_value', $result );
	}

	/**
	 * Test update method sets a new setting
	 */
	public function test_update_new_setting() {
		$result = Settings::update( 'new_key', 'new_value' );

		$this->assertTrue( $result );
		$this->assertEquals( 'new_value', Settings::get( 'new_key' ) );
	}

	/**
	 * Test update method updates an existing setting
	 */
	public function test_update_existing_setting() {
		// First add a setting
		Settings::update( 'update_key', 'original_value' );

		// Then update it
		$result = Settings::update( 'update_key', 'updated_value' );

		$this->assertTrue( $result );
		$this->assertEquals( 'updated_value', Settings::get( 'update_key' ) );
	}

	/**
	 * Test delete method removes a setting
	 */
	public function test_delete() {
		// First add a setting
		Settings::update( 'delete_key', 'delete_value' );

		// Verify it exists
		$this->assertEquals( 'delete_value', Settings::get( 'delete_key' ) );

		// Delete it
		$result = Settings::delete( 'delete_key' );

		$this->assertTrue( $result );
		$this->assertFalse( Settings::get( 'delete_key' ) );
	}

	/**
	 * Test get_all method returns all settings
	 */
	public function test_get_all() {
		$test_settings = array(
			'key1' => 'value1',
			'key2' => 'value2',
			'key3' => 'value3',
		);

		update_option( Settings::OPTION_NAME, $test_settings );

		$result = Settings::get_all();

		$this->assertEquals( $test_settings, $result );
	}

	/**
	 * Test get_all returns empty array when no settings exist
	 */
	public function test_get_all_empty() {
		$result = Settings::get_all();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	/**
	 * Test update_many method updates multiple settings at once
	 */
	public function test_update_many() {
		// First add some initial settings
		$initial_settings = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);

		Settings::update_many( $initial_settings );

		// Update with new values
		$new_settings = array(
			'key2' => 'new_value2',
			'key3' => 'value3',
		);

		$result = Settings::update_many( $new_settings );

		$this->assertTrue( $result );

		// Get all settings and verify
		$all_settings = Settings::get_all();

		$expected = array(
			'key1' => 'value1',    // Unchanged
			'key2' => 'new_value2', // Updated
			'key3' => 'value3',     // New
		);

		$this->assertEquals( $expected, $all_settings );
	}

	/**
	 * Test delete_all method removes all settings
	 */
	public function test_delete_all() {
		// First add some settings
		$test_settings = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);

		Settings::update_many( $test_settings );

		// Verify they exist
		$this->assertNotEmpty( Settings::get_all() );

		// Delete all
		$result = Settings::delete_all();

		$this->assertTrue( $result );
		$this->assertEmpty( Settings::get_all() );
	}

	/**
	 * Test settings with different data types
	 */
	public function test_different_data_types() {
		$test_settings = array(
			'string_value'  => 'test string',
			'integer_value' => 42,
			'float_value'   => 3.14,
			'boolean_value' => true,
			'array_value'   => array( 1, 2, 3 ),
			'object_value'  => (object) array( 'foo' => 'bar' ),
			'null_value'    => null,
		);

		Settings::update_many( $test_settings );

		foreach ( $test_settings as $key => $expected ) {
			$actual = Settings::get( $key );
			$this->assertEquals( $expected, $actual );
		}
	}

	/**
	 * Test that settings are properly stored in WordPress options
	 */
	public function test_storage_in_wp_options() {
		$test_settings = array(
			'key1' => 'value1',
			'key2' => 'value2',
		);

		Settings::update_many( $test_settings );

		// Get directly from WordPress options
		$stored_option = get_option( Settings::OPTION_NAME );

		$this->assertEquals( $test_settings, $stored_option );
	}
}
