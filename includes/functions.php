<?php
/**
 * Functions
 * This file contains all the functions used in the plugin
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

/**
 * Check if plugin is active
 *
 * @since 1.0.0
 *
 * @param string $plugin_name
 *
 * @return bool
 */
function quillbooking_is_plugin_active( $plugin_name ) {
	$active_plugins = get_option( 'active_plugins' );

	return in_array( $plugin_name, $active_plugins, true );
}
