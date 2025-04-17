<?php
/**
 * PHPUnit bootstrap file
 *
 * @package QuillBooking
 */

// Define constants that the plugin uses
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( dirname( __FILE__ ) ) . '/' );
}

if ( ! defined( 'QUILLBOOKING_PLUGIN_FILE' ) ) {
	define( 'QUILLBOOKING_PLUGIN_FILE', dirname( dirname( __FILE__ ) ) . '/class-quillbooking.php' );
}

if ( ! defined( 'QUILLBOOKING_VERSION' ) ) {
	define( 'QUILLBOOKING_VERSION', '1.0.0' );
}

if ( ! defined( 'QUILLBOOKING_PLUGIN_DIR' ) ) {
	define( 'QUILLBOOKING_PLUGIN_DIR', dirname( dirname( __FILE__ ) ) . '/' );
}

if ( ! defined( 'QUILLBOOKING_PLUGIN_URL' ) ) {
	define( 'QUILLBOOKING_PLUGIN_URL', 'http://example.org/wp-content/plugins/quillbooking/' );
}

// Load autoloader
require_once dirname( dirname( __FILE__ ) ) . '/includes/autoload.php';

// Setup test environment
class WP_UnitTestCase extends \PHPUnit\Framework\TestCase {} 