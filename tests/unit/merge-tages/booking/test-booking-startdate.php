<?php

use QuillBooking\Merge_Tags\Booking\Booking_StartDate;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingStartDateTest extends WP_UnitTestCase
{

    /** @var Booking_StartDate */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_StartDate::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_StartDate::instance();
        $instance2 = Booking_StartDate::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Start Date', $this->tag->name);
        $this->assertSame($this->tag->group . '_start_time', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_start_date()
    {
        $booking = $this->createBooking(['start_time' => '2025-04-22 14:00:00']);
        $this->assertSame('April 22, 2025', $this->tag->get_value($booking, ['format' => 'F j, Y']));
    }

    public function test_get_value_returns_empty_string_when_no_start_time()
    {
        $booking = $this->createBooking([]);
        $this->assertSame('', $this->tag->get_value($booking));
    }

    public function test_get_value_handles_invalid_date()
    {
        $booking = $this->createBooking(['start_time' => 'invalid-date']);
        $this->assertSame('', $this->tag->get_value($booking));
    }

    /**
     * Helper to create a booking mock with fields
     */
    private function createBooking($fields = [])
    {
        $booking = new stdClass();
        foreach ($fields as $key => $value) {
            $booking->{$key} = $value;
        }

        return $booking;
    }
}
