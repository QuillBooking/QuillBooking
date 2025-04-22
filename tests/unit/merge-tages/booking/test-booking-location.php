<?php

use QuillBooking\Merge_Tags\Booking\Booking_Location;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingLocationTest extends WP_UnitTestCase
{

    /** @var Booking_Location */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_Location::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_Location::instance();
        $instance2 = Booking_Location::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Location', $this->tag->name);
        $this->assertSame($this->tag->group . '_event_location', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_location()
    {
        $booking = $this->createBooking(['location' => 'New York']);
        $this->assertSame('New York', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_when_no_location()
    {
        $booking = $this->createBooking([]);
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
