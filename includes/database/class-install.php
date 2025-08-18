<?php
/**
 * Class Install
 * This class is responsible for handling the database installation
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Database;

use QuillBooking\Capabilities;
use QuillBooking\Database\Migrations\Booking_Hosts_Table;
use QuillBooking\Database\Migrations\Calendars_Table;
use QuillBooking\Database\Migrations\Calendars_Meta_Table;
use QuillBooking\Database\Migrations\Events_Table;
use QuillBooking\Database\Migrations\Events_Meta_Table;
use QuillBooking\Database\Migrations\Bookings_Table;
use QuillBooking\Database\Migrations\Booking_Meta_Table;
use QuillBooking\Database\Migrations\Booking_Log_Table;
use QuillBooking\Database\Migrations\Guests_Table;
use QuillBooking\Database\Migrations\Tasks_Meta_Table;
use QuillBooking\Database\Migrations\Booking_Orders_Table;
use QuillBooking\Database\Migrations\Availability_Table;
use QuillBooking\Availabilities;

/**
 * Install class
 */
class Install {

	/**
	 * Init
	 *
	 * @since 1.0.0
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'check_version' ), 5 );
	}

	/**
	 * Check QuillBooking version and run the updater if required.
	 *
	 * This check is done on all requests and runs if the versions do not match.
	 */
	public static function check_version() {
		error_log( 'QuillBooking: Starting version check' );
		$current_version = get_option( 'quillbooking_version' );
		$plugin_version = QUILLBOOKING_VERSION;
		
		error_log( "QuillBooking: Current version: {$current_version}, Plugin version: {$plugin_version}" );
		
		if ( version_compare( $current_version, $plugin_version, '<' ) ) {
			error_log( 'QuillBooking: Version update needed, starting installation' );
			self::install();
			do_action( 'quillbooking_updated' );
		} else {
			error_log( 'QuillBooking: No version update needed' );
		}
	}

	/**
	 * Install
	 *
	 * @since 1.0.0
	 */
	public static function install() {
		error_log( 'QuillBooking: Starting installation process' );
		
		// Check if we are not already running this routine.
		if ( 'yes' === get_transient( 'quillbooking_installing' ) ) {
			error_log( 'QuillBooking: Installation already in progress, skipping' );
			return;
		}

		// If we made it till here nothing is running yet, lets set the transient now.
		set_transient( 'quillbooking_installing', 'yes', MINUTE_IN_SECONDS * 10 );
		error_log( 'QuillBooking: Set installation transient' );

		try {
			error_log( 'QuillBooking: Assigning capabilities' );
			Capabilities::assign_capabilities_for_user_roles();
			
			error_log( 'QuillBooking: Creating/updating database tables' );
			// Create/update database tables
			self::create_tables();
			
			error_log( 'QuillBooking: Running availability migration' );
			// Run migrations
			self::availability_migration();
			
			error_log( 'QuillBooking: Updating version' );
			// Availabilities::add_default_availability();
			self::update_quillbooking_version();
			
			error_log( 'QuillBooking: Installation completed successfully' );
		} catch ( Exception $e ) {
			error_log( 'QuillBooking: Installation failed with exception: ' . $e->getMessage() );
		}

		delete_transient( 'quillbooking_installing' );
		error_log( 'QuillBooking: Removed installation transient' );
	}

	/**
	 * Create/Update database tables
	 *
	 * @since 1.0.0
	 */
	private static function create_tables() {
		error_log( 'QuillBooking: Starting table creation' );
		
		$tables = apply_filters(
			'quillbooking_database_tables',
			array(
				Calendars_Table::class,
				Calendars_Meta_Table::class,
				Events_Table::class,
				Events_Meta_Table::class,
				Bookings_Table::class,
				Booking_Meta_Table::class,
				Booking_Log_Table::class,
				Guests_Table::class,
				Tasks_Meta_Table::class,
				Booking_Orders_Table::class,
				Booking_Hosts_Table::class,
				Availability_Table::class,
			)
		);

		error_log( 'QuillBooking: Found ' . count( $tables ) . ' tables to process' );

		foreach ( $tables as $index => $class ) {
			if ( ! class_exists( $class ) ) {
				error_log( "QuillBooking: Class {$class} does not exist, skipping" );
				continue;
			}

			error_log( "QuillBooking: Processing table {$index}: {$class}" );
			
			try {
				/** @var \QuillBooking\Database\Migrations\Migration $migration */
				$migration = new $class();
				$migration->run();
				error_log( "QuillBooking: Successfully processed table: {$class}" );
			} catch ( Exception $e ) {
				error_log( "QuillBooking: Failed to process table {$class}: " . $e->getMessage() );
			}
		}
		
		error_log( 'QuillBooking: Completed table creation' );
	}

	/**
	 * Availability migration
	 * Migrate availability data from wp_options and events_meta to new table structure
	 *
	 * @since 2.0.0
	 */
	private static function availability_migration() {
		global $wpdb;
		
		error_log( 'QuillBooking: Starting availability migration' );
		
		$version = get_option( 'quillbooking_version' );
		error_log( "QuillBooking: Current stored version: {$version}" );
		
		// Only run migration for versions before 2.0.0
		if ( $version && version_compare( $version, '2.0.0', '>=' ) ) {
			error_log( 'QuillBooking: Version is 2.0.0 or higher, skipping migration' );
			return;
		}

		error_log( 'QuillBooking: Version check passed, proceeding with migration' );
		
		// First, migrate availabilities from wp_options to availability table
		error_log( 'QuillBooking: Step 1 - Migrating availabilities from wp_options' );
		$availability_id_map = self::migrate_availabilities_from_options();
		error_log( 'QuillBooking: Step 1 completed. ID mapping result:' );
		error_log( print_r( $availability_id_map, true ) );

		// Then, migrate events data
		error_log( 'QuillBooking: Step 2 - Migrating events availability data' );
		self::migrate_events_availability_data( $availability_id_map );

		// Clean up old data
		error_log( 'QuillBooking: Step 3 - Cleaning up old data' );
		self::cleanup_old_availability_data();
		
		error_log( 'QuillBooking: Availability migration completed' );
	}

	/**
	 * Migrate availabilities from wp_options to availability table
	 *
	 * @return array Map of old availability IDs to new database IDs
	 */
	private static function migrate_availabilities_from_options() {
		global $wpdb;
		
		error_log( 'QuillBooking: Starting migration from wp_options' );
		
		$availability_id_map = array();
		$availability_table = $wpdb->prefix . 'quillbooking_availability';
		
		error_log( "QuillBooking: Target table: {$availability_table}" );
		
		// Check if table exists
		$table_exists = $wpdb->get_var( "SHOW TABLES LIKE '$availability_table'" );
		if ( $table_exists !== $availability_table ) {
			error_log( "QuillBooking: ERROR - Table {$availability_table} does not exist!" );
			return $availability_id_map;
		}
		
		// Get availability data from wp_options 
		error_log( 'QuillBooking: Fetching availability data from wp_options' );
		$availabilities_data = get_option( 'quillbooking_availabilities', array() );
		
		error_log( 'QuillBooking: Raw availability data from wp_options:' );
		error_log( print_r( $availabilities_data, true ) );
		
		if ( empty( $availabilities_data ) ) {
			error_log( 'QuillBooking: No availability data found in wp_options' );
			return $availability_id_map;
		}
		
		if ( ! is_array( $availabilities_data ) ) {
			error_log( 'QuillBooking: Availability data is not an array: ' . gettype( $availabilities_data ) );
			return $availability_id_map;
		}

		error_log( 'QuillBooking: Found ' . count( $availabilities_data ) . ' availabilities to migrate' );

		foreach ( $availabilities_data as $index => $availability ) {
			error_log( "QuillBooking: Processing availability #{$index}" );
			error_log( 'QuillBooking: Availability data: ' . print_r( $availability, true ) );
			
			if ( ! is_array( $availability ) ) {
				error_log( "QuillBooking: Skipping availability #{$index} - not an array: " . gettype( $availability ) );
				continue;
			}

			// Extract required fields
			$old_id = isset( $availability['id'] ) ? $availability['id'] : '';
			$user_id = isset( $availability['user_id'] ) ? $availability['user_id'] : 0;
			$name = isset( $availability['name'] ) ? $availability['name'] : 'Unnamed Availability';
			$timezone = isset( $availability['timezone'] ) ? $availability['timezone'] : 'UTC';
			$is_default = isset( $availability['is_default'] ) ? (bool) $availability['is_default'] : false;

			error_log( "QuillBooking: Extracted fields - ID: {$old_id}, User: {$user_id}, Name: {$name}, Timezone: {$timezone}, Default: " . ( $is_default ? 'true' : 'false' ) );

			// Convert user_id to integer, handle 'system' case
			if ( $user_id === 'system' ) {
				error_log( 'QuillBooking: Converting system user to admin user' );
				$admin = get_users( array( 'role' => 'administrator', 'number' => 1 ) );
				if ( ! empty( $admin ) ) {
					$user_id = $admin[0]->ID;
					error_log( "QuillBooking: Found admin user ID: {$user_id}" );
				} else {
					$user_id = 1; // Fallback
					error_log( 'QuillBooking: No admin found, using user ID 1 as fallback' );
				}
			} else {
				$user_id = (int) $user_id;
				error_log( "QuillBooking: User ID converted to integer: {$user_id}" );
			}

			// Prepare the value field (remove id, user_id, name, timezone, is_default as they have dedicated columns)
			$value_data = $availability;
			unset( $value_data['id'], $value_data['user_id'], $value_data['name'], $value_data['timezone'], $value_data['is_default'] );
			
			error_log( 'QuillBooking: Value data for storage: ' . print_r( $value_data, true ) );
			$serialized_value = maybe_serialize( $value_data );
			error_log( 'QuillBooking: Serialized value length: ' . strlen( $serialized_value ) );

			// Prepare insert data
			$insert_data = array(
				'user_id'    => $user_id,
				'name'       => $name,
				'value'      => $serialized_value,
				'timezone'   => $timezone,
				'is_default' => $is_default ? 1 : 0,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			);
			
			error_log( 'QuillBooking: Insert data prepared: ' . print_r( $insert_data, true ) );

			// Insert into availability table
			error_log( "QuillBooking: Attempting to insert availability '{$old_id}' into database" );
			$insert_result = $wpdb->insert(
				$availability_table,
				$insert_data,
				array( '%d', '%s', '%s', '%s', '%d', '%s', '%s' )
			);

			error_log( "QuillBooking: Insert result: " . print_r( $insert_result, true ) );
			error_log( "QuillBooking: Last query: " . $wpdb->last_query );
			
			if ( $insert_result === false ) {
				error_log( "QuillBooking: Failed to migrate availability '{$old_id}': " . $wpdb->last_error );
			} else {
				$new_id = $wpdb->insert_id;
				$availability_id_map[ $old_id ] = $new_id;
				error_log( "QuillBooking: Successfully migrated availability '{$old_id}' to new ID: {$new_id}" );
			}
		}

		error_log( 'QuillBooking: Final availability ID mapping: ' . print_r( $availability_id_map, true ) );
		return $availability_id_map;
	}

	/**
	 * Migrate events availability data
	 *
	 * @param array $availability_id_map Map of old availability IDs to new database IDs
	 */
	private static function migrate_events_availability_data( $availability_id_map ) {
		global $wpdb;

		error_log( 'QuillBooking: Starting events availability data migration' );
		error_log( 'QuillBooking: Using ID mapping: ' . print_r( $availability_id_map, true ) );

		// First, add new columns to events table if they don't exist
		error_log( 'QuillBooking: Updating events table structure' );
		self::update_events_table_structure();

		$events_table = $wpdb->prefix . 'quillbooking_events';
		$events_meta_table = $wpdb->prefix . 'quillbooking_events_meta';
		
		error_log( "QuillBooking: Events table: {$events_table}" );
		error_log( "QuillBooking: Events meta table: {$events_meta_table}" );

		// Check if tables exist
		$events_exists = $wpdb->get_var( "SHOW TABLES LIKE '$events_table'" );
		$events_meta_exists = $wpdb->get_var( "SHOW TABLES LIKE '$events_meta_table'" );
		
		if ( $events_exists !== $events_table ) {
			error_log( "QuillBooking: ERROR - Events table {$events_table} does not exist!" );
			return;
		}
		
		if ( $events_meta_exists !== $events_meta_table ) {
			error_log( "QuillBooking: ERROR - Events meta table {$events_meta_table} does not exist!" );
			return;
		}

		// Get all events with availability meta
		error_log( 'QuillBooking: Fetching events with availability meta' );
		$query = $wpdb->prepare(
			"SELECT event_id, meta_value 
			FROM {$events_meta_table} 
			WHERE meta_key = %s",
			'availability'
		);
		
		error_log( "QuillBooking: Query: {$query}" );
		$availability_meta = $wpdb->get_results( $query );
		
		if ( $wpdb->last_error ) {
			error_log( "QuillBooking: Query error: " . $wpdb->last_error );
		}
		
		error_log( 'QuillBooking: Found ' . count( $availability_meta ) . ' events with availability meta' );
		error_log( 'QuillBooking: Events availability meta: ' . print_r( $availability_meta, true ) );
		
		foreach ( $availability_meta as $meta_index => $meta ) {
			error_log( "QuillBooking: Processing event meta #{$meta_index}" );
			
			$event_id = $meta->event_id;
			$raw_meta_value = $meta->meta_value;
			
			error_log( "QuillBooking: Event ID: {$event_id}" );
			error_log( "QuillBooking: Raw meta value: " . print_r( $raw_meta_value, true ) );
			
			$availability_data = maybe_unserialize( $raw_meta_value );
			error_log( "QuillBooking: Unserialized availability data: " . print_r( $availability_data, true ) );
			error_log( "QuillBooking: Data type: " . gettype( $availability_data ) );

			$availability_type = 'existing';
			$availability_id = null;
			$availability_meta_value = '';

			// Handle different data types
			if ( is_string( $availability_data ) ) {
				error_log( "QuillBooking: Processing string availability data: {$availability_data}" );
				// This is a reference to an existing availability by ID
				$old_availability_id = $availability_data;
				
				if ( isset( $availability_id_map[ $old_availability_id ] ) ) {
					$availability_id = $availability_id_map[ $old_availability_id ];
					$availability_type = 'existing';
					error_log( "QuillBooking: Mapped string ID '{$old_availability_id}' to new ID: {$availability_id}" );
				} else {
					error_log( "QuillBooking: Could not find mapping for string ID '{$old_availability_id}'" );
					$availability_type = 'custom';
					$availability_meta_value = maybe_serialize( array( 'old_id' => $old_availability_id, 'type' => 'unmapped' ) );
				}
			}
			elseif ( is_array( $availability_data ) ) {
				error_log( 'QuillBooking: Processing array availability data' );
				
				// Check if this is custom availability
				if ( isset( $availability_data['type'] ) && $availability_data['type'] === 'custom' ) {
					error_log( 'QuillBooking: Detected custom availability type' );
					$availability_type = 'custom';
					$availability_meta_value = maybe_serialize( $availability_data );
				} elseif ( isset( $availability_data['id'] ) ) {
					// This is an array with ID, extract it
					$old_availability_id = $availability_data['id'];
					error_log( "QuillBooking: Found availability ID in array: {$old_availability_id}" );
					
					if ( isset( $availability_id_map[ $old_availability_id ] ) ) {
						$availability_id = $availability_id_map[ $old_availability_id ];
						$availability_type = 'existing';
						error_log( "QuillBooking: Mapped array ID '{$old_availability_id}' to new ID: {$availability_id}" );
					} else {
						error_log( "QuillBooking: Could not find mapping for array ID '{$old_availability_id}'" );
						$availability_type = 'custom';
						$availability_meta_value = maybe_serialize( $availability_data );
					}
				} else {
					error_log( 'QuillBooking: Array has no recognizable structure, treating as custom' );
					$availability_type = 'custom';
					$availability_meta_value = maybe_serialize( $availability_data );
				}
			}
			else {
				error_log( "QuillBooking: Unknown data type, skipping event {$event_id}" );
				continue;
			}

			error_log( "QuillBooking: Final decision for event {$event_id}:" );
			error_log( "  - Type: {$availability_type}" );
			error_log( "  - ID: " . ( $availability_id ? $availability_id : 'null' ) );
			error_log( "  - Meta length: " . strlen( $availability_meta_value ) );

			// Update the events table
			$update_data = array(
				'availability_type' => $availability_type,
				'availability_meta' => $availability_meta_value,
				'availability_id'   => $availability_id,
				'updated_at'        => current_time( 'mysql' ),
			);
			
			error_log( "QuillBooking: Updating event {$event_id} with data: " . print_r( $update_data, true ) );
			
			$update_result = $wpdb->update(
				$events_table,
				$update_data,
				array( 'id' => $event_id ),
				array( '%s', '%s', '%d', '%s' ),
				array( '%d' )
			);

			error_log( "QuillBooking: Update result: " . print_r( $update_result, true ) );
			error_log( "QuillBooking: Last query: " . $wpdb->last_query );

			if ( $update_result === false ) {
				error_log( "QuillBooking: Failed to update event {$event_id}: " . $wpdb->last_error );
			} else {
				error_log( "QuillBooking: Successfully updated event {$event_id} with availability type: {$availability_type}" );
			}
		}
		
		error_log( 'QuillBooking: Completed events availability data migration' );
	}

	/**
	 * Update events table structure to add new columns
	 */
	private static function update_events_table_structure() {
		global $wpdb;

		error_log( 'QuillBooking: Starting events table structure update' );

		$events_table = $wpdb->prefix . 'quillbooking_events';
		error_log( "QuillBooking: Target events table: {$events_table}" );

		// Check if the table exists
		$table_exists = $wpdb->get_var( "SHOW TABLES LIKE '$events_table'" );
		if ( $table_exists !== $events_table ) {
			error_log( "QuillBooking: Events table does not exist: {$events_table}" );
			return;
		}

		// Add availability_type column if it doesn't exist
		error_log( 'QuillBooking: Checking for availability_type column' );
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SHOW COLUMNS FROM {$events_table} LIKE %s",
				'availability_type'
			)
		);

		if ( empty( $column_exists ) ) {
			error_log( 'QuillBooking: Adding availability_type column' );
			$alter_query = "ALTER TABLE {$events_table} ADD COLUMN availability_type varchar(255) NOT NULL DEFAULT 'existing' AFTER visibility";
			error_log( "QuillBooking: Query: {$alter_query}" );
			$result = $wpdb->query( $alter_query );
			error_log( "QuillBooking: Alter result: " . print_r( $result, true ) );
			if ( $wpdb->last_error ) {
				error_log( "QuillBooking: Error adding availability_type column: " . $wpdb->last_error );
			}
		} else {
			error_log( 'QuillBooking: availability_type column already exists' );
		}

		// Add availability_meta column if it doesn't exist
		error_log( 'QuillBooking: Checking for availability_meta column' );
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SHOW COLUMNS FROM {$events_table} LIKE %s",
				'availability_meta'
			)
		);

		if ( empty( $column_exists ) ) {
			error_log( 'QuillBooking: Adding availability_meta column' );
			$alter_query = "ALTER TABLE {$events_table} ADD COLUMN availability_meta longtext AFTER availability_type";
			error_log( "QuillBooking: Query: {$alter_query}" );
			$result = $wpdb->query( $alter_query );
			error_log( "QuillBooking: Alter result: " . print_r( $result, true ) );
			if ( $wpdb->last_error ) {
				error_log( "QuillBooking: Error adding availability_meta column: " . $wpdb->last_error );
			}
		} else {
			error_log( 'QuillBooking: availability_meta column already exists' );
		}

		// Add availability_id column if it doesn't exist
		error_log( 'QuillBooking: Checking for availability_id column' );
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SHOW COLUMNS FROM {$events_table} LIKE %s",
				'availability_id'
			)
		);

		if ( empty( $column_exists ) ) {
			error_log( 'QuillBooking: Adding availability_id column and index' );
			$alter_query = "ALTER TABLE {$events_table} ADD COLUMN availability_id int(11) NULL AFTER availability_meta, ADD KEY availability_id (availability_id)";
			error_log( "QuillBooking: Query: {$alter_query}" );
			$result = $wpdb->query( $alter_query );
			error_log( "QuillBooking: Alter result: " . print_r( $result, true ) );
			if ( $wpdb->last_error ) {
				error_log( "QuillBooking: Error adding availability_id column: " . $wpdb->last_error );
			}
		} else {
			error_log( 'QuillBooking: availability_id column already exists' );
		}
		
		error_log( 'QuillBooking: Completed events table structure update' );
	}

	/**
	 * Clean up old availability data
	 */
	private static function cleanup_old_availability_data() {
		global $wpdb;

		error_log( 'QuillBooking: Starting cleanup of old availability data' );

		// Remove availability meta from events_meta table
		$events_meta_table = $wpdb->prefix . 'quillbooking_events_meta';
		error_log( "QuillBooking: Removing availability meta from {$events_meta_table}" );
		
		$delete_result = $wpdb->delete(
			$events_meta_table,
			array( 'meta_key' => 'availability' ),
			array( '%s' )
		);
		
		error_log( "QuillBooking: Deleted {$delete_result} rows from events_meta table" );
		if ( $wpdb->last_error ) {
			error_log( "QuillBooking: Error deleting from events_meta: " . $wpdb->last_error );
		}

		// Remove old availability data from wp_options
		error_log( 'QuillBooking: Removing quillbooking_availabilities from wp_options' );
		$option_deleted = delete_option( 'quillbooking_availabilities' );
		error_log( "QuillBooking: Option deletion result: " . ( $option_deleted ? 'success' : 'failed' ) );

		error_log( 'QuillBooking: Cleanup of old availability data completed' );
	}

	/**
	 * Update QuillBooking version to current.
	 *
	 * @since 1.0.0
	 */
	private static function update_quillbooking_version() {
		error_log( 'QuillBooking: Updating version in database' );
		
		$old_version = get_option( 'quillbooking_version' );
		error_log( "QuillBooking: Old version: {$old_version}" );
		
		delete_option( 'quillbooking_version' );
		$add_result = add_option( 'quillbooking_version', QUILLBOOKING_VERSION );
		
		error_log( "QuillBooking: Version update result: " . ( $add_result ? 'success' : 'failed' ) );
		error_log( "QuillBooking: New version: " . QUILLBOOKING_VERSION );
	}
}