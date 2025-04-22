<?php

use QuillBooking\Merge_Tags\Booking\Booking_Timezone;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingTimezoneTest extends WP_UnitTestCase
{

    /** @var Booking_Timezone */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_Timezone::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_Timezone::instance();
        $instance2 = Booking_Timezone::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Timezone', $this->tag->name);
        $this->assertSame($this->tag->group . '_timezone', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_timezone()
    {
        $booking = $this->createBooking(['timezone' => 'Asia/Cairo']);
        $this->assertSame('Asia/Cairo', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_if_timezone_missing()
    {
        $booking = $this->createBooking(); // No timezone set
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
