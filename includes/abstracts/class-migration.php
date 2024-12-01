<?php
/**
 * Class Migration
 * This class is responsible for handling the database migrations
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Abstracts;

/**
 * Migration class
 */
abstract class Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . 'quillbooking_' . strtolower( $this->table_name );
	}

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	abstract public function get_query();

	/**
	 * Run the migration
	 *
	 * @since 1.0.0
	 */
	public function run() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();

		$query = $this->get_query();
		$sql   = "CREATE TABLE $this->table_name ( $query ) $charset_collate;";

		dbDelta( $sql );
	}
}
