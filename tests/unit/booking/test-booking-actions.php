<?php


use QuillBooking\Booking\Booking_Actions;



class BookingActionsTest extends WP_UnitTestCase
{

    protected $booking_actions;
    protected $calendar;
    protected $event;
    protected $booking;

    public function setUp(): void
    {
        parent::setUp();

        $this->booking = new FakeBookingModel([
            'id' => 1,
            'status' => 'pending',
            'hash_id' => 'valid_booking_hash'
        ]);

        if (!class_exists('QuillBooking\Booking\Booking_Validator', false)) {
            class_alias(FakeBooking_Validator::class, 'QuillBooking\Booking\Booking_Validator');
        }
        if (!class_exists('QuillBooking\Models\Booking_Model', false)) {
            class_alias(FakeBookingModel::class, 'QuillBooking\Models\Booking_Model');
        }
        if (!class_exists('QuillBooking\Models\Calendar_Model', false)) {
            class_alias(FakeCalendarModel::class, 'QuillBooking\Models\Calendar_Model');
        }
        if (!class_exists('QuillBooking\Models\Event_Model', false)) {
            class_alias(FakeEventModel::class, 'QuillBooking\Models\Event_Model');
        }

        $this->booking_actions = $this->getMockBuilder(Booking_Actions::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['get_head', 'get_footer'])
            ->getMock();
    }

    public function tearDown(): void
    {
        parent::tearDown();
    }

    public function test_enqueue_scripts()
    {
        $this->booking_actions->enqueue_scripts();

        // Verify scripts are registered
        $this->assertTrue(wp_script_is('quillbooking-renderer', 'registered'));
        $this->assertTrue(wp_style_is('quillbooking-renderer', 'registered'));
    }

    public function test_render_booking_page_with_calendar()
    {

        $_GET['quillbooking_calendar'] = 'test-calendar';
        $_GET['event'] = 'test-event';


        $bookingActions = $this->getMockBuilder(Booking_Actions::class)
            ->onlyMethods(['get_head', 'get_footer'])
            ->getMock();

        $bookingActions->method('get_head')->willReturn('<head></head>');
        $bookingActions->method('get_footer')->willReturn('<footer></footer>');


        ob_start();
        $bookingActions->render_booking_page();
        $output = ob_get_clean();


        $this->assertStringContainsString('<div id="quillbooking-booking-page">', $output);
        $this->assertStringContainsString('<footer></footer>', $output);
    }


    public function test_render_booking_page_with_event()
    {

        $_GET = [
            'quillbooking_calendar' => 'test-calendar',
            'event' => 'test-event'
        ];

        ob_start();
        $this->booking_actions->render_booking_page();
        $output = ob_get_clean();

        $this->assertStringContainsString('quillbooking-booking-page', $output);
    }

    public function test_render_booking_page_no_calendar()
    {
        $_GET = [];

        ob_start();
        $this->booking_actions->render_booking_page();
        $output = ob_get_clean();

        $this->assertEmpty($output);
    }

    public function test_render_booking_page_invalid_calendar()
    {
        $_GET = ['quillbooking_calendar' => 'invalid-calendar'];

        ob_start();
        $this->booking_actions->render_booking_page();
        $output = ob_get_clean();

        $this->assertEquals('', $output);
    }

    public function test_process_booking_action_confirm()
    {
        $this->booking = new FakeBookingModel([
            'id' => 1,
            'status' => 'pending',
            'hash_id' => 'valid_booking_hash'
        ]);

        $_GET = [
            'quillbooking_action' => 'confirm',
            'id' => $this->booking->id
        ];

    

        ob_start();
        $this->booking_actions->process_booking_action(
            'confirm',
            'scheduled',
            __('Booking confirmed', 'quillbooking'),
            __('Booking confirmed by Organizer', 'quillbooking')
        );
        $output = ob_get_clean();

        $this->assertStringContainsString('Confirm Successful', $output);
        $this->assertStringContainsString('The booking has been successfully scheduled', $output);
    }

    public function test_process_booking_action_reject()
    {
        $this->booking = new FakeBookingModel([
            'id' => 1,
            'status' => 'pending',
            'hash_id' => 'valid_booking_hash'
        ]);

        $_GET = [
            'quillbooking_action' => 'reject',
            'id' => $this->booking->id
        ];


        ob_start();
        $this->booking_actions->process_booking_action(
            'reject',
            'rejected',
            __('Booking rejected', 'quillbooking'),
            __('Booking rejected by Organizer', 'quillbooking')
        );
        $output = ob_get_clean();

        $this->assertStringContainsString('Reject Successful', $output);
        $this->assertStringContainsString('The booking has been successfully rejected', $output);
    }

    public function test_process_booking_action_cancel()
    {
        $this->booking = new FakeBookingModel([
            'id' => 1,
            'status' => 'pending',
            'hash_id' => 'valid_booking_hash'
        ]);

        $_GET = [
            'quillbooking_action' => 'cancel',
            'id' => $this->booking->id
        ];

        ob_start();
        $this->booking_actions->process_booking_action(
            'cancel',
            'cancelled',
            __('Booking cancelled', 'quillbooking'),
            __('Booking cancelled by Attendee', 'quillbooking')
        );
        $output = ob_get_clean();

        $this->assertStringContainsString('Cancel Successful', $output);
        $this->assertStringContainsString('The booking has been successfully cancelled', $output);
    }
    public function test_process_booking_action_reschedule()
    {
        $this->booking = new FakeBookingModel([
            'id' => 1,
            'status' => 'pending',
            'hash_id' => 'valid_booking_hash'
        ]);

        $_GET = [
            'quillbooking_action' => 'reschedule',
            'id' => $this->booking->id
        ];

        ob_start();
        $this->booking_actions->process_booking_action(
            'reschedule',
            'rescheduled',
            __('Booking rescheduled', 'quillbooking'),
            __('Booking rescheduled by Attendee', 'quillbooking')
        );
        $output = ob_get_clean();

        $this->assertStringContainsString('Reschedule Successful', $output);
        $this->assertStringContainsString('The booking has been successfully rescheduled', $output);
    }

    public function test_process_booking_action_invalid_action()
    {
        $_GET = ['quillbooking_action' => 'invalid'];

        ob_start();
        $this->booking_actions->process_booking_action(
            'confirm',
            'scheduled',
            __('Booking confirmed', 'quillbooking'),
            __('Booking confirmed by Organizer', 'quillbooking')
        );
        $output = ob_get_clean();

        $this->assertEmpty($output);
    }

    public function test_process_booking_action_already_completed()
    {
        $this->booking->update(['status' => 'scheduled']);
        $_GET = [
            'quillbooking_action' => 'confirm',
            'id' => $this->booking->id
        ];

        ob_start();
        $this->booking_actions->process_booking_action(
            'confirm',
            'scheduled',
            __('Booking confirmed', 'quillbooking'),
            __('Booking confirmed by Organizer', 'quillbooking')
        );
        $output = ob_get_clean();

        $this->assertStringContainsString('already scheduled', $output);
    }

    public function test_generate_success_message()
    {
        $message = $this->booking_actions->generate_success_message('Confirm', 'confirmed');

        $this->assertStringContainsString('Confirm Successful', $message);
        $this->assertStringContainsString('successfully confirmed', $message);
    }

    public function test_generate_error_message()
    {
        $message = $this->booking_actions->generate_error_message('Confirm', 'Error occurred');

        $this->assertStringContainsString('Confirm Failed', $message);
        $this->assertStringContainsString('Error occurred', $message);
    }
}



/**
 * Base Model class that implements common functionality
 */
abstract class FakeBaseModel
{
    protected $attributes = [];
    protected $whereConditions = [];

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    public function __get($key)
    {
        return $this->attributes[$key] ?? null;
    }

    public function __set($key, $value)
    {
        $this->attributes[$key] = $value;
    }

    public function fill(array $attributes)
    {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }
        return $this;
    }

    public static function where($column, $value)
    {
        $instance = new static();
        $instance->whereConditions[$column] = $value;
        return $instance;
    }

    public function first()
    {
        // Check if this instance matches its own where conditions
        foreach ($this->whereConditions as $column => $value) {
            if ($this->$column != $value) {
                return null; // Simulate no match found
            }
        }
        return $this; // Return self if all conditions match
    }

    public function toArray()
    {
        return $this->attributes;
    }

    public function update(array $data)
    {
        return $this->fill($data);
    }

    public function save()
    {
        return true;
    }
}

/**
 * Booking Model
 */
/**
 * Booking Model
 */
class FakeBookingModel extends FakeBaseModel
{
    public $id;
    public $status;
    public $hash_id;
    public $event; 

    private static $instances = [];

    public function __construct(array $attributes = [])
    {
        $this->id = $attributes['id'] ?? null;
        $this->status = $attributes['status'] ?? 'pending';
        $this->hash_id = $attributes['hash_id'] ?? null;
        $this->event = $attributes['event'] ?? new FakeEventModel(); 

        parent::__construct($attributes);

        if ($this->id) {
            self::$instances[$this->id] = $this;
        }
    }

    public static function getByHashId($hash_id)
    {
        foreach (self::$instances as $instance) {
            if ($instance->id == $hash_id || $instance->hash_id == $hash_id) {
                return $instance;
            }
        }

        return new self([
            'id' => $hash_id,
            'status' => 'pending',
            'hash_id' => $hash_id,
            'start_date' => '2023-10-01 10:00:00',
            'start_time' => '10:00',
            'duration' => 60,
            'event' => new FakeEventModel(),
        ]);
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isCancelled()
    {
        return $this->status === 'cancelled';
    }

    public function update($data)
    {
        foreach ($data as $key => $value) {
            $this->$key = $value;
            $this->attributes[$key] = $value;
        }

        if ($this->id) {
            self::$instances[$this->id] = $this;
        }

        return true;
    }

    public function save()
    {
        if ($this->id) {
            self::$instances[$this->id] = $this;
        }
        return true;
    }

    public function logs()
    {
        return new class {
            public function create($data)
            {
                return true;
            }
        };
    }
}


/**
 * Calendar Model
 */
class FakeCalendarModel extends FakeBaseModel
{
    public function __construct(array $attributes = [])
    {
        parent::__construct(array_merge([
            'id' => 1,
            'slug' => 'test-calendar',
            'name' => 'Test Calendar'
        ], $attributes));
    }
}

/**
 * Event Model
 */
class FakeEventModel extends FakeBaseModel
{
    public static $mockAvailableSlots = 1;

    public $payments_settings = ['enabled' => true];

    public function __construct(array $attributes = [])
    {
        parent::__construct(array_merge([
            'id' => 1,
            'slug' => 'test-event',
            'calendar_id' => 1,
            'payments_settings' => ['enabled' => true],
        ], $attributes));
    }

    public function requirePayment()
    {
        return $this->payments_settings['enabled'] ?? false;
    }

    public function get_booking_available_slots($start_date, $duration, $timezone)
    {
        return self::$mockAvailableSlots;
    }

    public function get_available_slots($start_date, $timezone, $duration, $calendar_id)
    {
        return 1;
    }
}


/**
 * Booking Validator
 */
class FakeBooking_Validator
{
    public static function validate_booking($id)
    {
        return FakeBookingModel::getByHashId($id);
    }
    public static function validate_event($id)
    {
        return new FakeEventModel(['id' => $id]);
    }
    public static function validate_start_date($start_date, $timezone)
    {
        return new DateTime($start_date, new DateTimeZone($timezone));
    }
    public static function validate_duration($duration, $event_duration)
    {
        return $duration;
    }
}
