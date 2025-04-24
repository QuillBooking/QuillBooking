<?php
/**
 * Test Database Tables Creation
 *
 * Tests that QuillBooking tables are properly created in the test database.
 *
 * @package QuillBooking\Tests
 */

/**
 * Database Tables Test
 */
class DatabaseTablesTest extends QuillBooking_Base_Test_Case {

	/**
	 * Test all tables were created
	 */
	public function test_required_tables_exist() {
		// List of expected tables.
		$expected_tables = array(
			'bookings',
			'booking_meta',
			'booking_log',
			'calendars',
			'calendars_meta',
			'events',
			'events_meta',
			'guests',
			'tasks_meta',
			'booking_orders',
		);
		
		foreach ( $expected_tables as $table ) {
			$this->assertTrue(
				$this->table_exists( $table ),
				"Table {$table} should exist in the test database"
			);
		}
	}
	
	/**
	 * Test bookings table structure
	 */
	public function test_bookings_table_structure() {
		global $wpdb;
		
		$table_name = $this->get_table_name( 'bookings' );
		
		// Get table structure.
		$columns = $wpdb->get_results( "DESCRIBE {$table_name}" );
		
		// Assert the table has the expected number of columns.
		$this->assertCount( 14, $columns, 'Bookings table should have 14 columns' );
		
		// Check for specific columns.
		$column_names = array_map( function( $column ) {
			return $column->Field;
		}, $columns );
		
		$expected_columns = array(
			'id',
			'hash_id',
			'event_id',
			'calendar_id',
			'guest_id',
			'start_time',
			'end_time',
			'slot_time',
			'source',
			'status',
			'cancelled_by',
			'event_url',
			'created_at',
			'updated_at',
		);
		
		foreach ( $expected_columns as $column ) {
			$this->assertContains(
				$column,
				$column_names,
				"Bookings table should have column: {$column}"
			);
		}
	}
} 