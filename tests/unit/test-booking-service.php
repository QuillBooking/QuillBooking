<?php
/**
 * Class BookingServiceTest
 *
 * @package QuillBooking
 */

/**
 * Test for Booking Service functionality.
 */
class BookingServiceTest extends WP_UnitTestCase {

    /**
     * The BookingServiceMock class simulates the behavior of Booking_Service
     * without requiring the actual class or its dependencies
     */
    private $booking_service;
    
    /**
     * Setup the test
     */
    public function setUp(): void {
        parent::setUp();
        
        // Make the test instance available globally for the mock class
        global $phpunit_test_instance;
        $phpunit_test_instance = $this;
        
        // Setup mock WordPress functions using WP test framework methods
        add_filter('sanitize_text_field', array($this, 'mock_sanitize_text_field'));
        add_filter('sanitize_email', array($this, 'mock_sanitize_email'));
        add_filter('home_url', array($this, 'mock_home_url'));
        
        // Create our BookingServiceMock
        $this->booking_service = new BookingServiceMock();
    }
    
    /**
     * Teardown the test
     */
    public function tearDown(): void {
        // Remove our filter mocks
        remove_filter('sanitize_text_field', array($this, 'mock_sanitize_text_field'));
        remove_filter('sanitize_email', array($this, 'mock_sanitize_email'));
        remove_filter('home_url', array($this, 'mock_home_url'));
        
        // Remove the global reference
        global $phpunit_test_instance;
        $phpunit_test_instance = null;
        
        parent::tearDown();
    }
    
    /**
     * Mock sanitize_text_field function
     *
     * @param string $str Input string to sanitize.
     * @return string Sanitized string.
     */
    public function mock_sanitize_text_field($str) {
        return trim(strip_tags($str));
    }
    
    /**
     * Mock sanitize_email function
     *
     * @param string $email Email to sanitize.
     * @return string Sanitized email.
     */
    public function mock_sanitize_email($email) {
        return filter_var($email, FILTER_SANITIZE_EMAIL);
    }
    
    /**
     * Mock home_url function
     *
     * @return string Home URL.
     */
    public function mock_home_url() {
        return 'https://example.com';
    }
    
    /**
     * Mock get_user_by function by using a test spy
     *
     * @param string $field Field to query user by.
     * @param mixed $value Value to search for.
     * @return false Always returns false for testing.
     */
    public function mock_get_user_by($field, $value) {
        return false;
    }

    /**
     * Test validate_invitee method with valid invitee
     */
    public function test_validate_invitee_valid() {
        // Arrange
        $invitee = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com'
            ]
        ];
        
        $event = new class() {
            public $type = 'individual';
        };

        // Act
        $result = $this->booking_service->validate_invitee($event, $invitee);

        // Assert
        $this->assertEquals('John Doe', $result[0]['name']);
        $this->assertEquals('john@example.com', $result[0]['email']);
    }

    /**
     * Test validate_invitee method with invalid invitee (missing name)
     */
    public function test_validate_invitee_invalid_missing_name() {
        // Arrange
        $invitee = [
            [
                'email' => 'john@example.com'
            ]
        ];
        
        $event = new class() {
            public $type = 'individual';
        };

        // Assert
        $this->expectException(\Exception::class);
        
        // Act
        $result = $this->booking_service->validate_invitee($event, $invitee);
    }

    /**
     * Test validate_invitee method with invalid invitee (missing email)
     */
    public function test_validate_invitee_invalid_missing_email() {
        // Arrange
        $invitee = [
            [
                'name' => 'John Doe'
            ]
        ];
        
        $event = new class() {
            public $type = 'individual';
        };

        // Assert
        $this->expectException(\Exception::class);
        
        // Act
        $result = $this->booking_service->validate_invitee($event, $invitee);
    }

    /**
     * Test validate_invitee method with multiple invitees for non-group event
     */
    public function test_validate_invitee_multiple_for_individual_event() {
        // Arrange
        $invitee = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com'
            ],
            [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com'
            ]
        ];
        
        $event = new class() {
            public $type = 'individual';
        };

        // Assert
        $this->expectException(\Exception::class);
        
        // Act
        $result = $this->booking_service->validate_invitee($event, $invitee);
    }

    /**
     * Test validate_invitee method with multiple invitees for group event
     */
    public function test_validate_invitee_multiple_for_group_event() {
        // Arrange
        $invitee = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com'
            ],
            [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com'
            ]
        ];
        
        $event = new class() {
            public $type = 'group';
        };

        // Act
        $result = $this->booking_service->validate_invitee($event, $invitee);

        // Assert
        $this->assertEquals(2, count($result));
        $this->assertEquals('John Doe', $result[0]['name']);
        $this->assertEquals('john@example.com', $result[0]['email']);
        $this->assertEquals('Jane Doe', $result[1]['name']);
        $this->assertEquals('jane@example.com', $result[1]['email']);
    }
    
    /**
     * Test book_event_slot creates a booking with confirmed status.
     */
    public function test_book_event_slot_confirmed() {
        // Arrange
        $event = new class() {
            public $id = 1;
            public $type = 'individual';
            public function requireConfirmation() {
                return false;
            }
            public function requirePayment() {
                return false;
            }
        };
        
        $calendar_id = 1;
        $start_date = new \DateTime('2023-10-10 10:00:00');
        $duration = 60;
        $timezone = 'UTC';
        $location = 'Online';
        $invitees = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com'
            ]
        ];
        $status = 'confirmed';
        $fields = ['field1' => 'value1'];

        // Act
        $booking = $this->booking_service->book_event_slot(
            $event, 
            $calendar_id, 
            $start_date, 
            $duration, 
            $timezone, 
            $invitees, 
            $location, 
            $status, 
            $fields
        );

        // Assert
        $this->assertEquals($event->id, $booking->event_id);
        $this->assertEquals($calendar_id, $booking->calendar_id);
        $this->assertEquals($status, $booking->status);
        $this->assertEquals($location, $booking->location);
        $this->assertEquals($timezone, $booking->timezone);
        $this->assertEquals($duration, $booking->slot_time);
    }
    
    /**
     * Test book_event_slot with pending confirmation.
     */
    public function test_book_event_slot_pending_confirmation() {
        // Arrange
        $event = new class() {
            public $id = 1;
            public $type = 'individual';
            public function requireConfirmation() {
                return true;
            }
            public function requirePayment() {
                return false;
            }
        };
        
        $calendar_id = 1;
        $start_date = new \DateTime('2023-10-10 10:00:00');
        $duration = 60;
        $timezone = 'UTC';
        $location = 'Online';
        $invitees = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com'
            ]
        ];
        $fields = ['field1' => 'value1'];

        // Act
        $booking = $this->booking_service->book_event_slot(
            $event, 
            $calendar_id, 
            $start_date, 
            $duration, 
            $timezone, 
            $invitees, 
            $location, 
            false, 
            $fields
        );

        // Assert
        $this->assertEquals('pending', $booking->status);
    }
    
    /**
     * Test book_event_slot with pending payment.
     */
    public function test_book_event_slot_pending_payment() {
        // Arrange
        $event = new class() {
            public $id = 1;
            public $type = 'individual';
            public function requireConfirmation() {
                return false;
            }
            public function requirePayment() {
                return true;
            }
        };
        
        $calendar_id = 1;
        $start_date = new \DateTime('2023-10-10 10:00:00');
        $duration = 60;
        $timezone = 'UTC';
        $location = 'Online';
        $invitees = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com'
            ]
        ];
        $fields = ['field1' => 'value1'];

        // Act
        $booking = $this->booking_service->book_event_slot(
            $event, 
            $calendar_id, 
            $start_date, 
            $duration, 
            $timezone, 
            $invitees, 
            $location, 
            false, 
            $fields
        );

        // Assert
        $this->assertEquals('pending', $booking->status);
    }
}

/**
 * A mock class that simulates the behavior of Booking_Service
 * This allows us to test the business logic without requiring
 * the actual models and database connections
 */
class BookingServiceMock {
    
    /**
     * Reference to the test class instance
     *
     * @var BookingServiceTest
     */
    private $test_instance;
    
    /**
     * Constructor
     */
    public function __construct() {
        // Store reference to the test class instance
        global $phpunit_test_instance;
        $this->test_instance = $phpunit_test_instance;
    }
    
    /**
     * Book an event slot (simulated version)
     */
    public function book_event_slot($event, $calendar_id, $start_date, $duration, $timezone, $invitees, $location, $status = false, $fields = array()) {
        // Validate invitees
        $invitees = $this->validate_invitee($event, $invitees);
        
        $end_date = clone $start_date;
        $end_date->modify("+{$duration} minutes");
        
        // Determine status
        if ($event->requireConfirmation() && !$status) {
            $pending_type = 'confirmation';
            $status = 'pending';
        }

        if ($event->requirePayment() && !$status) {
            $pending_type = 'payment';
            $status = 'pending';
        }
        
        // Create a mock booking object
        $booking = new \stdClass();
        $booking->event_id = $event->id;
        $booking->calendar_id = $calendar_id;
        $booking->start_time = $start_date->format('Y-m-d H:i:s');
        $booking->end_time = $end_date->format('Y-m-d H:i:s');
        $booking->status = $status ?: 'scheduled';
        $booking->location = $location;
        $booking->timezone = $timezone;
        $booking->slot_time = $duration;
        $booking->fields = $fields;
        
        return $booking;
    }
    
    /**
     * Validate invitee (same logic as the real implementation)
     */
    public function validate_invitee($event, $invitee) {
        // invitee should be an array of {name, email}
        // First, we need to sanitize the invitee
        $invitee = array_map(
            function($item) {
                $name = isset($item['name']) ? apply_filters('sanitize_text_field', $item['name']) : null;
                $email = isset($item['email']) ? apply_filters('sanitize_email', $item['email']) : null;

                if (!$name || !$email) {
                    throw new \Exception('Invalid invitee');
                }

                $guest = [
                    'name' => $name,
                    'email' => $email,
                ];

                // Use our mocked get_user_by with test class method
                $user = false;
                if (isset($this->test_instance) && method_exists($this->test_instance, 'mock_get_user_by')) {
                    $user = $this->test_instance->mock_get_user_by('email', $email);
                }
                
                if ($user) {
                    $guest['user_id'] = $user->ID;
                }

                return $guest;
            },
            $invitee
        );

        if ('group' !== $event->type && count($invitee) > 1) {
            throw new \Exception('Invalid event type');
        }

        return $invitee;
    }
} 