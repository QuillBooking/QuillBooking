<?php
/**
 * QuillBooking Test Database Setup
 *
 * This file ensures QuillBooking tables are created in the test database.
 *
 * @package QuillBooking\Tests
 */

namespace QuillBooking\Tests;

/**
 * Initialize QuillBooking tables in the test database
 */
function initialize_test_database() {
    // Ensure that we're in a testing environment.
    if (!defined('WP_TESTS_TABLE_PREFIX') || empty(WP_TESTS_TABLE_PREFIX)) {
        return;
    }

    // Include QuillBooking database installation class.
    require_once QUILLBOOKING_PLUGIN_DIR . 'includes/database/class-install.php';

    // Run the installation.
    \QuillBooking\Database\Install::install();
}

/**
 * Force reinstall tables for a fresh test state
 */
function reset_test_database() {
    // Ensure that we're in a testing environment.
    if (!defined('WP_TESTS_TABLE_PREFIX') || empty(WP_TESTS_TABLE_PREFIX)) {
        return;
    }

    // Include QuillBooking database installation class.
    require_once QUILLBOOKING_PLUGIN_DIR . 'includes/database/class-install.php';

    // Delete transient if it exists to ensure installation runs
    delete_transient('quillbooking_installing');
    
    // Run the installation.
    \QuillBooking\Database\Install::install();
} 