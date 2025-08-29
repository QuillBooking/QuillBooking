<?php
/**
 * Plugin Name:       Quill Booking
 * Plugin URI:        https://quillbooking.com/
 * Description:       Quill Booking is a booking plugin for WordPress.
 * Version:           1.1.0
 * Author:            quillbooking.com
 * Author URI:        http://quillbooking.com
 * Text Domain:       quillbooking
 * Requires at least: 5.4
 * Requires PHP: 7.1
 *
 * @package QuillBooking
 */

defined( 'ABSPATH' ) || exit;

// Plugin file.
if ( ! defined( 'QUILLBOOKING_PLUGIN_FILE' ) ) {
	define( 'QUILLBOOKING_PLUGIN_FILE', __FILE__ );
}

// Plugin version.
if ( ! defined( 'QUILLBOOKING_VERSION' ) ) {
	define( 'QUILLBOOKING_VERSION', '1.1.0' );
}

// Plugin Folder Path.
if ( ! defined( 'QUILLBOOKING_PLUGIN_DIR' ) ) {
	define( 'QUILLBOOKING_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

// Plugin Folder URL.
if ( ! defined( 'QUILLBOOKING_PLUGIN_URL' ) ) {
	define( 'QUILLBOOKING_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}

// Minimum WordPress version required.
if ( ! defined( 'QUILLBOOKING_MIN_WP_VERSION' ) ) {
	define( 'QUILLBOOKING_MIN_WP_VERSION', '5.4' );
}

// Minimum PHP version required.
if ( ! defined( 'QUILLBOOKING_MIN_PHP_VERSION' ) ) {
	define( 'QUILLBOOKING_MIN_PHP_VERSION', '7.1' );
}

// Require dependencies.
require_once QUILLBOOKING_PLUGIN_DIR . 'dependencies/libraries/load.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'dependencies/vendor/autoload.php';

// Do version checks early
quillbooking_pre_init();

// Suppress the WordPress 6.7+ notice and load textdomain immediately
add_filter( 'doing_it_wrong_trigger_error', 'quillbooking_suppress_translation_notice', 10, 2 );

// Load textdomain immediately before QuillBooking initializes
quillbooking_load_textdomain_early();

// Initialize QuillBooking on plugins_loaded as normal
add_action( 'plugins_loaded', 'quillbooking_initialize_main' );

/**
 * Verify that we can initialize QuillBooking, then load it.
 *
 * @since 1.0.0
 */
function quillbooking_pre_init() {
	global $wp_version;
	
	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';
	
	// Strip '-src' from the version string. Messes up version_compare().
	$version = str_replace( '-src', '', $wp_version );
	
	// Check for minimum WordPress version.
	if ( version_compare( $version, QUILLBOOKING_MIN_WP_VERSION, '<' ) ) {
		add_action( 'admin_notices', 'quillbooking_wordpress_version_notice' );
		return;
	}
	
	// Check for minimum PHP version.
	if ( version_compare( phpversion(), QUILLBOOKING_MIN_PHP_VERSION, '<' ) ) {
		add_action( 'admin_notices', 'quillbooking_php_version_notice' );
		return;
	}
}

/**
 * Suppress WordPress 6.7+ translation timing notice
 */
function quillbooking_suppress_translation_notice( $trigger, $function ) {
	if ( '_load_textdomain_just_in_time' === $function ) {
		return false;
	}
	return $trigger;
}

/**
 * Load textdomain early (before QuillBooking initializes)
 */
function quillbooking_load_textdomain_early() {
	load_plugin_textdomain(
		'quillbooking',
		false,
		dirname( plugin_basename( __FILE__ ) ) . '/languages'
	);
}

/**
 * Initialize QuillBooking after textdomain is ready
 */
function quillbooking_initialize_main() {
	// Require autoload.
	require_once QUILLBOOKING_PLUGIN_DIR . 'includes/autoload.php';
	
	// QuillBooking initialization
	QuillBooking\QuillBooking::instance();
	
	register_activation_hook( QUILLBOOKING_PLUGIN_FILE, array( QuillBooking\Database\Install::class, 'install' ) );
	
	do_action( 'quillbooking_loaded' );
}

/**
 * Display a WordPress version notice and deactivate QuillBooking plugin.
 *
 * @since 1.0.0
 */
function quillbooking_wordpress_version_notice() {
	echo '<div class="error"><p>';
	echo 'QuillBooking requires WordPress ' . QUILLBOOKING_MIN_WP_VERSION . ' or later to function properly. Please upgrade WordPress before activating QuillBooking.';
	echo '</p></div>';
	deactivate_plugins( plugin_basename( QUILLBOOKING_PLUGIN_FILE ) );
}

/**
 * Display a PHP version notice and deactivate QuillBooking plugin.
 *
 * @since 1.0.0
 */
function quillbooking_php_version_notice() {
	echo '<div class="error"><p>';
	echo 'QuillBooking requires PHP ' . QUILLBOOKING_MIN_PHP_VERSION . ' or later to function properly. Please upgrade your PHP version before activating QuillBooking.';
	echo '</p></div>';
	deactivate_plugins( plugin_basename( QUILLBOOKING_PLUGIN_FILE ) );
}