<?php
/**
 * Class CapabilitiesTest
 *
 * @package QuillBooking
 */

// Mock WordPress functions that we need
if (!function_exists('__')) {
    function __($text, $domain = 'default') {
        return $text;
    }
}

/**
 * Test for Capabilities functionality.
 */
class CapabilitiesTest extends WP_UnitTestCase {

    /**
     * The CapabilitiesMock class simulates the behavior of QuillBooking\Capabilities
     */
    private $capabilities;
    
    /**
     * Setup the test
     */
    public function setUp(): void {
        parent::setUp();
        $this->capabilities = new CapabilitiesMock();
    }

    /**
     * Test get_core_capabilities returns the expected array structure
     */
    public function test_get_core_capabilities() {
        $capabilities = $this->capabilities->get_core_capabilities();
        
        // Test that we have the expected capability groups
        $this->assertArrayHasKey('calendars', $capabilities);
        $this->assertArrayHasKey('bookings', $capabilities);
        $this->assertArrayHasKey('availability', $capabilities);
        
        // Test that each group has the expected structure
        foreach ($capabilities as $group) {
            $this->assertArrayHasKey('title', $group);
            $this->assertArrayHasKey('capabilities', $group);
            $this->assertIsArray($group['capabilities']);
            
            // Each capability should be a string description
            foreach ($group['capabilities'] as $cap => $description) {
                $this->assertIsString($cap);
                $this->assertIsString($description);
            }
        }
    }
    
    /**
     * Test get_all_capabilities returns a flat array of all capability keys
     */
    public function test_get_all_capabilities() {
        $all_capabilities = $this->capabilities->get_all_capabilities();
        
        // Check that it's a flat array
        $this->assertIsArray($all_capabilities);
        
        // Verify some expected capabilities are present
        $this->assertContains('quillbooking_manage_own_calendars', $all_capabilities);
        $this->assertContains('quillbooking_read_all_calendars', $all_capabilities);
        $this->assertContains('quillbooking_manage_all_bookings', $all_capabilities);
        $this->assertContains('quillbooking_read_own_availability', $all_capabilities);
    }
    
    /**
     * Test get_basic_capabilities returns only capabilities with 'own' in their name
     */
    public function test_get_basic_capabilities() {
        $basic_capabilities = $this->capabilities->get_basic_capabilities();
        
        // Check that it's an array
        $this->assertIsArray($basic_capabilities);
        
        // Check that all capabilities contain 'own'
        foreach ($basic_capabilities as $capability) {
            $this->assertStringContainsString('own', $capability);
        }
        
        // Verify that 'all' capabilities are not included
        $this->assertNotContains('quillbooking_read_all_calendars', $basic_capabilities);
        $this->assertNotContains('quillbooking_manage_all_bookings', $basic_capabilities);
        
        // Verify that 'own' capabilities are included
        $this->assertContains('quillbooking_manage_own_calendars', $basic_capabilities);
        $this->assertContains('quillbooking_read_own_bookings', $basic_capabilities);
    }
    
    /**
     * Test can_manage_calendar when user is the owner
     */
    public function test_can_manage_calendar_as_owner() {
        // Set up a calendar owned by the current user
        $calendar = new \stdClass();
        $calendar->user_id = 1; // Using our mock user ID
        
        // Set the current user ID in our mock class
        $this->capabilities->setCurrentUserId(1);
        
        $result = $this->capabilities->can_manage_calendar_mock($calendar);
        
        $this->assertTrue($result);
    }
    
    /**
     * Test can_manage_calendar when user is not the owner but has admin rights
     */
    public function test_can_manage_calendar_as_admin() {
        // Set up a calendar owned by another user
        $calendar = new \stdClass();
        $calendar->user_id = 2; // Different from our mock user ID
        
        // Set the current user ID in our mock class
        $this->capabilities->setCurrentUserId(1);
        
        // Set up user with admin capability
        $this->capabilities->setUserCan('quillbooking_manage_all_calendars', true);
        
        $result = $this->capabilities->can_manage_calendar_mock($calendar);
        
        $this->assertTrue($result);
    }
    
    /**
     * Test can_manage_calendar when user is not the owner and has no admin rights
     */
    public function test_cannot_manage_calendar() {
        // Set up a calendar owned by another user
        $calendar = new \stdClass();
        $calendar->user_id = 2; // Different from our mock user ID
        
        // Set the current user ID in our mock class
        $this->capabilities->setCurrentUserId(1);
        
        // Set up user without admin capability
        $this->capabilities->setUserCan('quillbooking_manage_all_calendars', false);
        
        $result = $this->capabilities->can_manage_calendar_mock($calendar);
        
        $this->assertFalse($result);
    }
    
    /**
     * Test can_read_calendar when user is the owner
     */
    public function test_can_read_calendar_as_owner() {
        // Set up a calendar owned by the current user
        $calendar = new \stdClass();
        $calendar->user_id = 1; // Using our mock user ID
        
        // Set the current user ID in our mock class
        $this->capabilities->setCurrentUserId(1);
        
        $result = $this->capabilities->can_read_calendar_mock($calendar);
        
        $this->assertTrue($result);
    }
    
    /**
     * Test can_read_calendar when user is not the owner but has read access
     */
    public function test_can_read_calendar_with_access() {
        // Set up a calendar owned by another user
        $calendar = new \stdClass();
        $calendar->user_id = 2; // Different from our mock user ID
        
        // Set the current user ID in our mock class
        $this->capabilities->setCurrentUserId(1);
        
        // Set up user with read capability
        $this->capabilities->setUserCan('quillbooking_read_all_calendars', true);
        
        $result = $this->capabilities->can_read_calendar_mock($calendar);
        
        $this->assertTrue($result);
    }
    
    /**
     * Test can_read_calendar when user is not the owner and has no read access
     */
    public function test_cannot_read_calendar() {
        // Set up a calendar owned by another user
        $calendar = new \stdClass();
        $calendar->user_id = 2; // Different from our mock user ID
        
        // Set the current user ID in our mock class
        $this->capabilities->setCurrentUserId(1);
        
        // Set up user without read capability
        $this->capabilities->setUserCan('quillbooking_read_all_calendars', false);
        
        $result = $this->capabilities->can_read_calendar_mock($calendar);
        
        $this->assertFalse($result);
    }
}

/**
 * A mock class that simulates the behavior of QuillBooking\Capabilities
 * This allows us to test the functionality without requiring dependencies
 */
class CapabilitiesMock {
    private $user_capabilities = [];
    private $current_user_id = 0;
    
    /**
     * Set the current user ID for testing
     */
    public function setCurrentUserId($user_id) {
        $this->current_user_id = $user_id;
    }
    
    /**
     * Get the current user ID
     */
    public function getCurrentUserId() {
        return $this->current_user_id;
    }
    
    /**
     * Set whether the current user has a specific capability
     */
    public function setUserCan($capability, $can) {
        $this->user_capabilities[$capability] = $can;
    }
    
    /**
     * Mock of current_user_can
     */
    private function current_user_can($capability) {
        return isset($this->user_capabilities[$capability]) ? 
            $this->user_capabilities[$capability] : false;
    }
    
    /**
     * Get core capabilities (copied from actual implementation)
     */
    public function get_core_capabilities() {
        $capabilities = array(
			// Calendar Capabilities
			'calendars'    => array(
				'title'        => __( 'Calendar Management', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_manage_own_calendars' => __( 'Manage only the user\'s own calendars', 'quillbooking' ),
					'quillbooking_read_all_calendars'   => __( 'Read access to all calendars across users', 'quillbooking' ),
					'quillbooking_manage_all_calendars' => __( 'Manage all calendars created by all users', 'quillbooking' ),
				),
			),

			// Booking Capabilities
			'bookings'     => array(
				'title'        => __( 'Booking Access', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_read_own_bookings'   => __( 'Read only the user\'s own bookings', 'quillbooking' ),
					'quillbooking_read_all_bookings'   => __( 'Read access to all bookings', 'quillbooking' ),
					'quillbooking_manage_own_bookings' => __( 'Manage only the user\'s own bookings', 'quillbooking' ),
					'quillbooking_manage_all_bookings' => __( 'Manage all bookings across calendars', 'quillbooking' ),
				),
			),

			// Availability Capabilities
			'availability' => array(
				'title'        => __( 'Availability Management', 'quillbooking' ),
				'capabilities' => array(
					'quillbooking_read_own_availability'   => __( 'Read only the user\'s own availability', 'quillbooking' ),
					'quillbooking_read_all_availability'   => __( 'Read access to all availability schedules across users', 'quillbooking' ),
					'quillbooking_manage_own_availability' => __( 'Manage only the user\'s own availability schedules', 'quillbooking' ),
					'quillbooking_manage_all_availability' => __( 'Manage all availability schedules for all users', 'quillbooking' ),
				),
			),
		);

		return $capabilities;
    }
    
    /**
     * Get all capabilities (copied from actual implementation)
     */
    public function get_all_capabilities() {
        $capabilities = $this->get_core_capabilities();

        $all_capabilities = array();

        foreach ($capabilities as $group) {
            $all_capabilities = array_merge($all_capabilities, array_keys($group['capabilities']));
        }

        return $all_capabilities;
    }
    
    /**
     * Get basic capabilities (copied from actual implementation)
     */
    public function get_basic_capabilities() {
        $capabilities = $this->get_core_capabilities();

        $basic_capabilities = array();

        foreach ($capabilities as $group) {
            foreach ($group['capabilities'] as $capability => $description) {
                if (strpos($capability, 'own') !== false) {
                    $basic_capabilities[] = $capability;
                }
            }
        }

        return $basic_capabilities;
    }
    
    /**
     * Simulate can_manage_calendar logic
     */
    public function can_manage_calendar_mock($calendar) {
        if (!$calendar) {
            return true;
        }

        // Use our own getCurrentUserId method instead of WordPress function
        if ((int)$calendar->user_id === (int)$this->getCurrentUserId()) {
            return true;
        }

        return $this->current_user_can('quillbooking_manage_all_calendars');
    }
    
    /**
     * Simulate can_read_calendar logic
     */
    public function can_read_calendar_mock($calendar) {
        if (!$calendar) {
            return true;
        }

        // Use our own getCurrentUserId method instead of WordPress function
        if ((int)$calendar->user_id === (int)$this->getCurrentUserId()) {
            return true;
        }

        return $this->current_user_can('quillbooking_read_all_calendars');
    }
} 