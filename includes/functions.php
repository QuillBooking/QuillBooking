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


/**
 * Find object in objects has specific key and value
 *
 * @since 1.0.0
 *
 * @param object[] $objects Array of objects.
 * @param string   $key    Key.
 * @param mixed    $value  Value.
 * @return object|null
 */
function quillbooking_objects_find( $objects, $key, $value ) {
	foreach ( $objects as $object ) {
		if ( $object->{$key} === $value ) {
			return $object;
		}
	}
	return null;
}