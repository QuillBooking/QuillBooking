<?php

use QuillBooking\Admin\Admin;
use QuillBooking\Admin\Admin_Loader;

/**
 * @group admin
 */
class AdminTest extends WP_UnitTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Set up an admin user with the required capability
        wp_set_current_user(1);
        $user = wp_get_current_user();
        $user->add_cap('manage_quillbooking');
    }

    protected function tearDown(): void
    {
        wp_set_current_user(0);
        parent::tearDown();
    }

    public function test_admin_class_exists()
    {
        $this->assertTrue(
            class_exists(Admin::class),
            'Admin class should exist'
        );
    }

    public function test_singleton_returns_same_instance()
    {
        $firstInstance = Admin::instance();
        $secondInstance = Admin::instance();

        $this->assertInstanceOf(Admin::class, $firstInstance);
        $this->assertSame(
            $firstInstance,
            $secondInstance,
            'Admin::instance() should return the same instance (singleton)'
        );
    }

    public function test_admin_hooks_are_registered()
    {
        $admin = Admin::instance();

        $this->invokePrivateMethod($admin, 'admin_hooks');

        $this->assertNotFalse(
            has_action('admin_menu', [$admin, 'create_admin_menu_pages']),
            'Expected admin_menu hook for create_admin_menu_pages not registered'
        );
    }

    public function test_menu_pages_are_registered_correctly()
    {
        global $menu, $submenu;
        $menu = [];
        $submenu = [];

        Admin::instance(); // Load instance and hooks
        do_action('admin_menu');

        // Main menu checks
        $this->assertNotEmpty($menu, 'Main menu should not be empty');
        $this->assertNotNull($this->findMenuItem('QuillBooking'), 'QuillBooking main menu not found');

        // Submenu checks
        $this->assertArrayHasKey('quillbooking', $submenu, 'Submenu "quillbooking" should be registered');
        $this->assertCount(2, $submenu['quillbooking'], 'Expected 2 submenu items');

        [$homeLabel,,] = $submenu['quillbooking'][0];
        [$calendarsLabel,,] = $submenu['quillbooking'][1];

        $this->assertEquals('Home', $homeLabel);
        $this->assertEquals('Calendars', $calendarsLabel);
    }

    public function test_menu_capabilities_are_correct()
    {
        global $menu, $submenu;

        Admin::instance();
        do_action('admin_menu');

        $menuItem = $this->findMenuItem('QuillBooking');
        $this->assertNotNull($menuItem, 'Main menu item "QuillBooking" not found');
        $this->assertEquals('manage_quillbooking', $menuItem[1], 'Main menu capability is incorrect');

        $this->assertArrayHasKey('quillbooking', $submenu, 'Submenu "quillbooking" is not registered');

        foreach ($submenu['quillbooking'] as $submenuItem) {
            $this->assertEquals('manage_quillbooking', $submenuItem[1], 'Submenu capability mismatch');
        }
    }

    public function test_menu_icon_is_valid_svg_data_uri()
    {
        global $menu;

        Admin::instance();
        do_action('admin_menu');

        $menuItem = $this->findMenuItem('QuillBooking');

        $this->assertNotNull($menuItem, 'QuillBooking menu not found');
        $this->assertArrayHasKey(6, $menuItem, 'Menu icon index is missing');
        $this->assertStringStartsWith(
            'data:image/svg+xml;base64,',
            $menuItem[6],
            'Expected menu icon to be base64-encoded SVG'
        );
    }

    public function test_submenus_have_correct_structure()
    {
        global $submenu;
        $submenu = [];

        $admin = Admin::instance();
        $admin->create_admin_menu_pages();

        $this->assertArrayHasKey('quillbooking', $submenu);
        $this->assertIsArray($submenu['quillbooking']);

        $homeItem = $submenu['quillbooking'][0];
        $calendarsItem = $submenu['quillbooking'][1];

        // Home submenu
        $this->assertSame(['Home', 'manage_quillbooking', 'quillbooking'], array_slice($homeItem, 0, 3));

        // Calendars submenu
        $this->assertSame(['Calendars', 'manage_quillbooking', 'quillbooking&path=calendars'], array_slice($calendarsItem, 0, 3));
    }

    public function test_page_wrapper_callback_exists()
    {
        $this->assertTrue(
            is_callable([Admin_Loader::class, 'page_wrapper']),
            'Admin_Loader::page_wrapper should be callable'
        );
    }

    /**
     * Call a private or protected method using reflection.
     */
    private function invokePrivateMethod(object $object, string $methodName, array $args = [])
    {
        $reflection = new ReflectionClass($object);
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);

        return $method->invokeArgs($object, $args);
    }

    /**
     * Find a WordPress admin menu item by its label.
     */
    private function findMenuItem(string $label): ?array
    {
        global $menu;

        foreach ($menu as $item) {
            if (isset($item[0]) && $item[0] === $label) {
                return $item;
            }
        }

        return null;
    }
}
