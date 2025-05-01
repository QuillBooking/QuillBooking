<?php
/**
 * PHPUnit Bootstrap File
 *
 * @package QuillBooking
 */

/**
 * Setup autoloader for tests
 */
require_once dirname( dirname( __FILE__ ) ) . '/vendor/autoload.php';

// Define plugin-specific constants
if ( ! defined( 'QUILLBOOKING_PLUGIN_FILE' ) ) {
	define( 'QUILLBOOKING_PLUGIN_FILE', dirname( dirname( __FILE__ ) ) . '/class-quillbooking.php' );
}

// Make sure we're using the real validator class in tests by loading it first
if ( ! class_exists( 'QuillBooking\Booking\Booking_Validator' ) ) {
	require_once dirname( dirname( __FILE__ ) ) . '/includes/booking/class-booking-validator.php';
}

// Make sure we're loading utility classes needed by the real BookingValidator
if ( ! class_exists( 'QuillBooking\Utils' ) ) {
	require_once dirname( dirname( __FILE__ ) ) . '/includes/class-utils.php';
}

// Ensure the WordPress test suite is available
$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $_tests_dir/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL;
	exit( 1 );
}

// Include core WordPress files
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually loads the plugin being tested.
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

// Load the Base Test Case abstract class
require_once dirname( __FILE__ ) . '/class-quillbooking-base-test-case.php';

// Load Integration Test base class and setup files
require_once dirname( __FILE__ ) . '/class-quillbooking-integration-test-case.php';
require_once dirname( __FILE__ ) . '/integration/integration-setup.php';

// Define the WP_TESTS_TABLE_PREFIX constant if not already defined
if ( ! defined( 'WP_TESTS_TABLE_PREFIX' ) ) {
	global $wpdb;
	define( 'WP_TESTS_TABLE_PREFIX', $wpdb->prefix );
}

// Initialize QuillBooking tables in the test database
QuillBooking\Tests\initialize_test_database();
