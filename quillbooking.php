<?php

/**
 * Plugin Name:       Quill Booking
 * Plugin URI:        https://quillbooking.com/
 * Description:       Quill Booking is a booking plugin for WordPress.
 * Version:           1.0.3
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
	define( 'QUILLBOOKING_VERSION', '1.0.3' );
}

// Plugin Folder Path.
if ( ! defined( 'QUILLBOOKING_PLUGIN_DIR' ) ) {
	define( 'QUILLBOOKING_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

// Plugin Folder URL.
if ( ! defined( 'QUILLBOOKING_PLUGIN_URL' ) ) {
	define( 'QUILLBOOKING_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}

// Require dependencies.
require_once QUILLBOOKING_PLUGIN_DIR . 'dependencies/libraries/load.php';
require_once QUILLBOOKING_PLUGIN_DIR . 'dependencies/vendor/autoload.php';

// Require autoload.
require_once QUILLBOOKING_PLUGIN_DIR . 'includes/autoload.php';

quillbooking_pre_init();


/**
 * Verify that we can initialize QuillBooking , then load it.
 *
 * @since 1.0.0
 */
function quillbooking_pre_init() {

	QuillBooking\QuillBooking::instance();
	register_activation_hook( __FILE__, array( QuillBooking\Database\Install::class, 'install' ) );

	add_action(
		'plugins_loaded',
		function () {
			do_action( 'quillbooking_loaded' );
		}
	);
}
