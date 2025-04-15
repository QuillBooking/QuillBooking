<?php
/**
 * Class QuillBookingBaseTest
 *
 * @package QuillBooking
 */

/**
 * Basic test case.
 */
class QuillBookingBaseTest extends WP_UnitTestCase {

	/**
	 * Test if plugin constants are defined correctly.
	 */
	public function test_plugin_constants() {
		$this->assertTrue(defined('QUILLBOOKING_VERSION'));
		$this->assertTrue(defined('QUILLBOOKING_PLUGIN_DIR'));
		$this->assertTrue(defined('QUILLBOOKING_PLUGIN_URL'));
		$this->assertEquals('1.0.0', QUILLBOOKING_VERSION);
	}

	/**
	 * Test if required files exist.
	 */
	public function test_required_files_exist() {
		$this->assertFileExists(QUILLBOOKING_PLUGIN_DIR . 'includes/autoload.php');
		$this->assertFileExists(QUILLBOOKING_PLUGIN_DIR . 'class-quillbooking.php');
	}
	
	/**
	 * Test if ABSPATH constant is defined.
	 */
	public function test_abspath_defined() {
		$this->assertTrue(defined('ABSPATH'));
		$this->assertNotEmpty(ABSPATH);
	}
} 