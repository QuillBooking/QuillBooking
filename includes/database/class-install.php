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
use QuillBooking\Models\Availability_Model;


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
		$current_version = get_option( 'quillbooking_version' );
		$plugin_version = QUILLBOOKING_VERSION;
		
		if ( version_compare( $current_version, $plugin_version, '<' ) ) {
			self::install();
			do_action( 'quillbooking_updated' );
		}
	}

	/**
	 * Install
	 *
	 * @since 1.0.0
	 */
	public static function install() {
		// Check if we are not already running this routine.
		if ( 'yes' === get_transient( 'quillbooking_installing' ) ) {
			return;
		}

		// If we made it till here nothing is running yet, lets set the transient now.
		set_transient( 'quillbooking_installing', 'yes', MINUTE_IN_SECONDS * 10 );

		try {
			Capabilities::assign_capabilities_for_user_roles();
			
			// Create/update database tables
			self::create_tables();
			
			// Run migrations
			self::availability_migration();
			
			// Availabilities::add_default_availability();
			self::update_quillbooking_version();
		} catch ( Exception $e ) {
		}

		delete_transient( 'quillbooking_installing' );
	}

	/**
	 * Create/Update database tables
	 *
	 * @since 1.0.0
	 */
	private static function create_tables() {
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

		foreach ( $tables as $index => $class ) {
			if ( ! class_exists( $class ) ) {
				continue;
			}
			
			try {
				/** @var \QuillBooking\Database\Migrations\Migration $migration */
				$migration = new $class();
				$migration->run();
			} catch ( Exception $e ) {
			}
		}
	}

	/**
	 * Availability migration
	 * Migrate availability data from wp_options and events_meta to new table structure
	 *
	 * @since 1.1.0
	 */
	private static function availability_migration() {
		global $wpdb;
		
		$version = get_option( 'quillbooking_version' );
		
		// Only run migration for versions before 2.0.0
		if ( $version && version_compare( $version, '1.1.0', '>=' ) ) {
			return;
		}
		
		// First, migrate availabilities from wp_options to availability table
		$availability_id_map = self::migrate_availabilities_from_options();

		// Then, migrate events data
		self::migrate_events_availability_data( $availability_id_map );

		// Clean up old data
		// self::cleanup_old_availability_data();
	}

	/**
	 * Migrate availabilities from wp_options to availability table
	 *
	 * @return array Map of old availability IDs to new database IDs
	 */
	private static function migrate_availabilities_from_options() {
		global $wpdb;
		
		$availability_id_map = array();
		$availability_table = $wpdb->prefix . 'quillbooking_availability';
		
		// Check if table exists
		$table_exists = $wpdb->get_var( "SHOW TABLES LIKE '$availability_table'" );
		if ( $table_exists !== $availability_table ) {
			return $availability_id_map;
		}
		
		// Get availability data from wp_options 
		$availabilities_data = get_option( 'quillbooking_availabilities', array() );
		
		if ( empty( $availabilities_data ) || ! is_array( $availabilities_data ) ) {
			return $availability_id_map;
		}
		
		foreach ( $availabilities_data as $index => $availability ) {
			if ( ! is_array( $availability ) ) {
				continue;
			}
	
			// Extract required fields
			$old_id = isset( $availability['id'] ) ? $availability['id'] : '';
			$user_id = isset( $availability['user_id'] ) ? $availability['user_id'] : 0;
			$name = isset( $availability['name'] ) ? $availability['name'] : 'Unnamed Availability';
			$timezone = isset( $availability['timezone'] ) ? $availability['timezone'] : 'UTC';
			$is_default = isset( $availability['is_default'] ) ? (bool) $availability['is_default'] : false;
	
			// Skip system availability
			if ( $user_id === 'system' ) {
				continue;
			} else {
				$user_id = (int) $user_id;
			}
	
			// Prepare the value field
			$value_data = $availability;
			unset( $value_data['id'], $value_data['user_id'], $value_data['name'], $value_data['timezone'], $value_data['is_default'] );
			
			$serialized_value = maybe_serialize( $value_data );
	
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
	
			// Insert into availability table
			$insert_result = $wpdb->insert(
				$availability_table,
				$insert_data,
				array( '%d', '%s', '%s', '%s', '%d', '%s', '%s' )
			);
			
			if ( $insert_result !== false ) {
				$new_id = $wpdb->insert_id;
				$availability_id_map[ $old_id ] = array(
					'new_id' => $new_id,
					'user_id' => $user_id
				);
			}

			error_log( "QuillBooking Migration: Inserted availability {$new_id} for user {$user_id}" );
		}

		error_log( "QuillBooking Migration: Availability ID map: " . print_r( $availability_id_map, true ) );
	
		return $availability_id_map;
	}
	
	/**
	 * Migrate events availability data
	 *
	 * @param array $availability_id_map Map of old availability IDs to new database IDs
	 */
	private static function migrate_events_availability_data( $availability_id_map ) {
		error_log( "QuillBooking Migration: Migrating events availability data" );
		error_log( "QuillBooking Migration: Availability ID map: " . print_r( $availability_id_map, true ) );
		global $wpdb;

		// First, add new columns to events table if they don't exist
		self::update_events_table_structure();

		$events_table = $wpdb->prefix . 'quillbooking_events';
		$events_meta_table = $wpdb->prefix . 'quillbooking_events_meta';

		// Check if tables exist
		$events_exists = $wpdb->get_var( "SHOW TABLES LIKE '$events_table'" );
		$events_meta_exists = $wpdb->get_var( "SHOW TABLES LIKE '$events_meta_table'" );
		
		if ( $events_exists !== $events_table || $events_meta_exists !== $events_meta_table ) {
			return;
		}

		// Get all events with availability meta
		$query = $wpdb->prepare(
			"SELECT e.id, e.type, em.meta_value as availability_data
			FROM {$events_table} e
			LEFT JOIN {$events_meta_table} em ON e.id = em.event_id AND em.meta_key = %s",
			'availability'
		);
		
		$events_with_availability = $wpdb->get_results( $query );
		
		foreach ( $events_with_availability as $event_data ) {
			$event_id = $event_data->id;
			$event_type = $event_data->type;
			$raw_meta_value = $event_data->availability_data;
			
			if ( empty( $raw_meta_value ) ) {
				continue;
			}
			
			$availability_data = maybe_unserialize( $raw_meta_value );

			$availability_type = 'existing';
			$availability_meta_value = array(
				'custom_availability' => array( 
					'value' => array(
						'weekly_hours' => array(
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
								'times' => array(
									array(
										'start' => '09:00',
										'end'   => '17:00',
									),
								),
								'off'   => true,
							),
							'sunday'    => array(
								'times' => array(
									array(
										'start' => '09:00',
										'end'   => '17:00',
									),
								),
								'off'   => true,
							),
						),
						'override'     => (object) array(),
					) 
				),
				'is_common' => true,
			);

			$availability_id = null;
			$user_id = null;

			// Handle different data types
			if ( is_string( $availability_data ) ) {
				// This is a reference to an existing availability by ID
				$old_availability_id = $availability_data;
				
				if ( isset( $availability_id_map[ $old_availability_id ] ) ) {
					$availability_id = $availability_id_map[ $old_availability_id ]['new_id'];
					$availability_type = 'existing';
				} else {
					$availability_type = 'custom';
					$availability_meta_value = maybe_serialize( array( 'old_id' => $old_availability_id, 'type' => 'unmapped' ) );
				}
			}
			elseif ( is_array( $availability_data ) ) {
				// Check if this is custom availability
				if ( isset( $availability_data['type'] ) && $availability_data['type'] === 'custom' ) {
					$availability_type = 'custom';
					$availability_meta_value = array('custom_availability' =>  array( 'value' => $availability_data), 'is_common' => true);
				} elseif ( isset( $availability_data['id'] ) ) {
					// This is an array with ID, extract it
					$old_availability_id = $availability_data['id'];
					
					if ( isset( $availability_id_map[ $old_availability_id ] ) ) {
						$availability_id = $availability_id_map[ $old_availability_id ]['new_id'];
						$availability_type = 'existing';
					} else {
						$availability_type = 'custom';
						$availability_meta_value = array('custom_availability' =>  array( 'value' => $availability_data), 'is_common' => true);
					}
				} else {
					$availability_type = 'custom';
					$availability_meta_value = array('custom_availability' =>  array('value' => $availability_data), 'is_common' => true);
				}
			}
			else {
				continue;
			}

			// Special handling for round-robin events
			if ( $event_type === 'round-robin' ) {
				error_log( "QuillBooking Migration: Processing round-robin event {$event_id}" );
				
				// Get team members for this event
				$team_members_query = $wpdb->prepare(
					"SELECT meta_value FROM {$events_meta_table} WHERE event_id = %d AND meta_key = %s",
					$event_id,
					'team_members'
				);
				$team_members_data = $wpdb->get_var( $team_members_query );
				
				if ( $team_members_data ) {
					$team_members = maybe_unserialize( $team_members_data );
					error_log( "QuillBooking Migration: Found team members for event {$event_id}: " . print_r( $team_members, true ) );
					
					if ( is_array( $team_members ) && ! empty( $team_members ) ) {
						$hosts_schedules = array();
						
						// For each team member, get their default availability ID
						foreach ( $team_members as $member_id ) {
							$member_default_availability_id = \QuillBooking\Models\Availability_Model::getUserDefaultAvailabilityId( $member_id );
							
							if ( $member_default_availability_id ) {
								$hosts_schedules[ $member_id ] = $member_default_availability_id;
								error_log( "QuillBooking Migration: Set member {$member_id} default availability to {$member_default_availability_id}" );
							} else {
								error_log( "QuillBooking Migration: No default availability found for member {$member_id}" );
							}
						}
						
						if ( ! empty( $hosts_schedules ) ) {
							// Update availability meta to include hosts_schedules
							$availability_meta_value['hosts_schedules'] = $hosts_schedules;
							$availability_meta_value['is_common'] = true; // Individual schedules, not common
							
							error_log( "QuillBooking Migration: Updated availability meta for round-robin event {$event_id}: " . print_r( $availability_meta_value, true ) );
						}
					}
				} else {
					error_log( "QuillBooking Migration: No team members found for round-robin event {$event_id}" );
				}
			}

			// If we don't have a mapped availability_id, try to get user's default
			if ( $availability_id === null && isset( $availability_id_map[ $old_availability_id ]['user_id'] ) ) {
				$user_id = $availability_id_map[ $old_availability_id ]['user_id'];
				error_log( "QuillBooking Migration: User ID: " . $user_id );
				if ( $user_id ) {
					error_log( "QuillBooking Migration: Looking for default availability for user {$user_id}" );
					$default_availability = \QuillBooking\Models\Availability_Model::getUserDefaultAvailabilityId( $user_id );
					
					if ( $default_availability ) {
						$availability_id = $default_availability;
						error_log( "QuillBooking Migration: Set availability_id to {$availability_id} (user {$user_id}'s default)" );
					} else {
						error_log( "QuillBooking Migration: No default availability found for user {$user_id}" );
					}
				} else {
					error_log( "QuillBooking Migration: user_id is empty, cannot get default availability" );
				}
				
				error_log( "QuillBooking Migration: Final availability_id for event {$event_id}: " . ( $availability_id ? $availability_id : 'NULL' ) );
			}

			// Update the events table
			$update_data = array(
				'availability_type' => $availability_type,
				'availability_meta' => maybe_serialize( $availability_meta_value ),
				'availability_id'   => $availability_id,
				'updated_at'        => current_time( 'mysql' ),
			);
			
			$wpdb->update(
				$events_table,
				$update_data,
				array( 'id' => $event_id ),
				array( '%s', '%s', '%d', '%s' ),
				array( '%d' )
			);
			
			error_log( "QuillBooking Migration: Updated event {$event_id} with availability data" );
		}
	}

	/**
	 * Update events table structure to add new columns
	 */
	private static function update_events_table_structure() {
		global $wpdb;

		$events_table = $wpdb->prefix . 'quillbooking_events';

		// Check if the table exists
		$table_exists = $wpdb->get_var( "SHOW TABLES LIKE '$events_table'" );
		if ( $table_exists !== $events_table ) {
			return;
		}

		// Add availability_type column if it doesn't exist
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SHOW COLUMNS FROM {$events_table} LIKE %s",
				'availability_type'
			)
		);

		if ( empty( $column_exists ) ) {
			$alter_query = "ALTER TABLE {$events_table} ADD COLUMN availability_type varchar(255) NOT NULL DEFAULT 'existing' AFTER visibility";
			$result = $wpdb->query( $alter_query );
		}

		// Add availability_meta column if it doesn't exist
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SHOW COLUMNS FROM {$events_table} LIKE %s",
				'availability_meta'
			)
		);

		if ( empty( $column_exists ) ) {
			$alter_query = "ALTER TABLE {$events_table} ADD COLUMN availability_meta longtext AFTER availability_type";
			$result = $wpdb->query( $alter_query );
		}

		// Add availability_id column if it doesn't exist
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SHOW COLUMNS FROM {$events_table} LIKE %s",
				'availability_id'
			)
		);

		if ( empty( $column_exists ) ) {
			$alter_query = "ALTER TABLE {$events_table} ADD COLUMN availability_id int(11) NULL AFTER availability_meta, ADD KEY availability_id (availability_id)";
			$result = $wpdb->query( $alter_query );
		}
	}

	/**
	 * Clean up old availability data
	 */
	private static function cleanup_old_availability_data() {
		global $wpdb;

		// Remove availability meta from events_meta table
		$events_meta_table = $wpdb->prefix . 'quillbooking_events_meta';
		
		$delete_result = $wpdb->delete(
			$events_meta_table,
			array( 'meta_key' => 'availability' ),
			array( '%s' )
		);

		// Remove old availability data from wp_options
		$option_deleted = delete_option( 'quillbooking_availabilities' );
	}

	/**
	 * Update QuillBooking version to current.
	 *
	 * @since 1.0.0
	 */
	private static function update_quillbooking_version() {
		$old_version = get_option( 'quillbooking_version' );
		
		delete_option( 'quillbooking_version' );
		$add_result = add_option( 'quillbooking_version', QUILLBOOKING_VERSION );
	}
}