<?php

use QuillBooking\Admin\Admin_Loader;

/**
 * @group admin
 */
class AdminLoaderTest extends QuillBooking_Base_Test_Case {


	public function setUp(): void {
		parent::setUp();

		// Load the Admin_Loader class if not already loaded
		if ( ! class_exists( Admin_Loader::class ) ) {
			require_once WP_PLUGIN_DIR . '/QuillBooking/includes/admin/class-admin-loader.php'; // Adjust path if necessary
		}
	}

	/**
	 * Test that is_admin_page returns true when current screen is the QuillBooking admin screen.
	 */
	public function test_is_admin_page_returns_true_for_quillbooking_screen() {
		set_current_screen( 'toplevel_page_quillbooking' );
		$this->assertTrue( Admin_Loader::is_admin_page(), 'Expected true for QuillBooking admin screen' );
	}

	/**
	 * Test that is_admin_page returns false for non-QuillBooking admin screens.
	 */
	public function test_is_admin_page_returns_false_for_other_screens() {
		set_current_screen( 'dashboard' );
		$this->assertFalse( Admin_Loader::is_admin_page(), 'Expected false for dashboard screen' );
	}

	/**
	 * Test that inject_before_notices outputs specific HTML used before admin notices.
	 */
	public function test_inject_before_notices_outputs_expected_html() {
		set_current_screen( 'toplevel_page_quillbooking' );

		ob_start();
		Admin_Loader::inject_before_notices();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<div class="quillbooking-layout__notice-list-hide"', $output );
		$this->assertStringContainsString( '<div class="wp-header-end"', $output );
	}

	/**
	 * Test that inject_after_notices outputs a closing div tag.
	 */
	public function test_inject_after_notices_outputs_closing_div() {
		set_current_screen( 'toplevel_page_quillbooking' );

		ob_start();
		Admin_Loader::inject_after_notices();
		$output = ob_get_clean();

		$this->assertSame( '</div>', $output, 'Expected closing div after notices' );
	}

	/**
	 * Test that remove_notices removes custom hooks from admin_notices.
	 */
	public function test_remove_notices_removes_custom_notice_hooks() {
		set_current_screen( 'toplevel_page_quillbooking' );

		add_action( 'admin_notices', 'hello_dolly' );
		function hello_dolly() {}

		$admin_loader = Admin_Loader::instance();
		$admin_loader->remove_notices();

		$this->assertFalse( has_action( 'admin_notices', 'hello_dolly' ), 'Expected hello_dolly hook to be removed' );
	}

	/**
	 * Test that enqueue_scripts registers required JS and CSS assets for the admin UI.
	 */
	public function test_enqueue_scripts_registers_admin_assets() {
		if ( ! defined( 'QUILLBOOKING_PLUGIN_DIR' ) ) {
			define( 'QUILLBOOKING_PLUGIN_DIR', dirname( __DIR__, 2 ) . '/' );
		}
		if ( ! defined( 'QUILLBOOKING_PLUGIN_URL' ) ) {
			define( 'QUILLBOOKING_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
		}
		if ( ! defined( 'QUILLBOOKING_VERSION' ) ) {
			define( 'QUILLBOOKING_VERSION', '1.0.0' );
		}

		$asset_file  = QUILLBOOKING_PLUGIN_DIR . 'build/client/index.asset.php';
		$config_file = QUILLBOOKING_PLUGIN_DIR . 'build/config/index.asset.php';

		// Ensure directories exist
		@mkdir( dirname( $asset_file ), 0777, true );
		@mkdir( dirname( $config_file ), 0777, true );

		// Create mock asset files
		file_put_contents( $asset_file, '<?php return ["dependencies" => ["wp-element"], "version" => "1.0.0"];' );
		file_put_contents( $config_file, '<?php return ["dependencies" => ["wp-api-fetch"], "version" => "1.0.0"];' );

		// Run the script enqueuer
		$admin_loader = Admin_Loader::instance();
		$admin_loader->enqueue_scripts();

		$this->assertTrue( wp_script_is( 'quillbooking-config', 'registered' ), 'Config script not registered' );
		$this->assertTrue( wp_script_is( 'quillbooking-admin', 'registered' ), 'Admin script not registered' );
		$this->assertTrue( wp_style_is( 'quillbooking-admin', 'registered' ), 'Admin style not registered' );

		// Clean up
		unlink( $asset_file );
		unlink( $config_file );
	}

	/**
	 * Test that page_wrapper outputs the required HTML structure for mounting the React app.
	 */
	public function test_page_wrapper_outputs_required_html_structure() {
		ob_start();
		Admin_Loader::page_wrapper();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<div class="quillbooking-wrap">', $output );
		$this->assertStringContainsString( '<div id="quillbooking-admin-root">', $output );
		$this->assertStringContainsString( '<svg xmlns="http://www.w3.org/2000/svg"', $output );
	}

	/**
	 * Test that Admin_Loader follows the singleton pattern (returns the same instance).
	 */
	public function test_singleton_returns_same_instance() {
		$instance1 = Admin_Loader::instance();
		$instance2 = Admin_Loader::instance();

		$this->assertInstanceOf( Admin_Loader::class, $instance1 );
		$this->assertSame( $instance1, $instance2, 'Expected singleton instance to match' );
	}
}
