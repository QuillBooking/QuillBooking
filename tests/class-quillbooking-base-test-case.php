<?php
/**
 * Base Test Case Class
 *
 * Provides common functionality for QuillBooking tests
 *
 * @package QuillBooking\Tests
 */

/**
 * Base Test Case abstract class
 */
abstract class QuillBooking_Base_Test_Case extends WP_UnitTestCase {

	/**
	 * Set up the test case - ensure database tables are created
	 */
	public function setUp(): void {
		parent::setUp();
		
		// Ensure QuillBooking tables exist in test database for each test
		if ( function_exists( '\QuillBooking\Tests\reset_test_database' ) ) {
			\QuillBooking\Tests\reset_test_database();
		}
	}

	/**
	 * Get database table name with proper prefix for test environment
	 *
	 * @param string $table_name The base table name without prefixes.
	 * @return string The full table name with proper prefix
	 */
	protected function get_table_name( $table_name ) {
		global $wpdb;
		return $wpdb->prefix . 'quillbooking_' . $table_name;
	}

	/**
	 * Check if a table exists in the database
	 *
	 * @param string $table_name Table name without the WordPress prefix.
	 * @return bool True if the table exists, false otherwise.
	 */
	protected function table_exists( $table_name ) {
		global $wpdb;
		$full_table_name = $this->get_table_name( $table_name );
		
		$result = $wpdb->get_var(
			$wpdb->prepare(
				'SHOW TABLES LIKE %s',
				$full_table_name
			)
		);
		
		return $result === $full_table_name;
	}
} 