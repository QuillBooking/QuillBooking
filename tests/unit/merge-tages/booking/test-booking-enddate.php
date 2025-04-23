<?php

use QuillBooking\Merge_Tags\Booking\Booking_EndDate;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingEndDateTest extends WP_UnitTestCase
{
    /** @var Booking_EndDate */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_EndDate::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_EndDate::instance();
        $instance2 = Booking_EndDate::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking End Date', $this->tag->name);
        $this->assertSame($this->tag->group . '_end_time', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_end_date_with_default_format()
    {
        $booking = $this->createBooking();
        $booking->end_time = '2025-04-22 14:00:00';
        $booking->timezone = 'America/New_York';
        $this->assertSame('April 22, 2025', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_end_date_with_custom_format()
    {
        $booking = $this->createBooking();
        $booking->end_time = '2025-04-22 14:00:00';
        $booking->timezone = 'America/New_York';
        $options = ['format' => 'Y-m-d'];
        $this->assertSame('2025-04-22', $this->tag->get_value($booking, $options));
    }

    public function test_get_value_returns_end_date_in_utc_timezone()
    {
        $booking = $this->createBooking();
        $booking->end_time = '2025-04-22 14:00:00';
        $booking->timezone = 'America/New_York';
        $options = ['timezone' => 'utc', 'format' => 'Y-m-d'];  // تعيين التنسيق 'Y-m-d'
        $this->assertSame('2025-04-22', $this->tag->get_value($booking, $options));
    }


    public function test_get_value_returns_empty_string_when_no_end_time()
    {
        $booking = $this->createBooking();
        $booking->end_time = null;
        $this->assertSame('', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_when_invalid_booking()
    {
        $this->assertSame('', $this->tag->get_value(null));
    }

    /**
     * Helper to create a booking mock
     */
    private function createBooking()
    {
        $booking = new stdClass();
        $booking->timezone = 'America/New_York';
        $booking->end_time = '2025-04-22 14:00:00';
        return $booking;
    }
}
