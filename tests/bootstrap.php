<?php
/**
 * PHPUnit bootstrap file
 *
 * @package QuillBooking
 */

// Define plugin-specific constants
if ( ! defined( 'QUILLBOOKING_PLUGIN_FILE' ) ) {
	define( 'QUILLBOOKING_PLUGIN_FILE', dirname( dirname( __FILE__ ) ) . '/class-quillbooking.php' );
}

if ( ! defined( 'QUILLBOOKING_VERSION' ) ) {
	define( 'QUILLBOOKING_VERSION', '1.0.0' );
}

if ( ! defined( 'QUILLBOOKING_PLUGIN_DIR' ) ) {
	define( 'QUILLBOOKING_PLUGIN_DIR', dirname( dirname( __FILE__ ) ) . '/' );
}

// Get WordPress tests directory from environment variable
$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

// Get WordPress directory from environment variable
$_core_dir = getenv( 'WP_CORE_DIR' );
if ( ! $_core_dir ) {
	$_core_dir = '/tmp/wordpress';
}

// Make sure WordPress test library exists
if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $_tests_dir/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL;
	exit( 1 );
}

// Set up an autoloader for test classes
spl_autoload_register( function( $class ) {
	// Check if the class is in the QuillBooking\Tests namespace
	if ( strpos( $class, 'QuillBooking\\Tests\\' ) === 0 ) {
		$class_path = str_replace( 'QuillBooking\\Tests\\', '', $class );
		$class_path = str_replace( '\\', '/', $class_path );
		$class_file = dirname( __FILE__ ) . '/unit/' . $class_path . '.php';
		
		if ( file_exists( $class_file ) ) {
			require_once $class_file;
			return true;
		}
	}
	return false;
} );

// Load the WordPress test functions
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	require dirname( dirname( __FILE__ ) ) . '/class-quillbooking.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment
require $_tests_dir . '/includes/bootstrap.php';

// Load plugin autoloader
require_once dirname( dirname( __FILE__ ) ) . '/includes/autoload.php';

// Load QuillBooking test setup
require_once dirname( __FILE__ ) . '/test-setup.php';

// Define the WP_TESTS_TABLE_PREFIX constant if not already defined
if ( ! defined( 'WP_TESTS_TABLE_PREFIX' ) ) {
	global $wpdb;
	define( 'WP_TESTS_TABLE_PREFIX', $wpdb->prefix );
}

// Initialize QuillBooking tables in the test database
QuillBooking\Tests\initialize_test_database(); 