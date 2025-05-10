<?php

use QuillBooking\Merge_Tags\Booking\Booking_Name;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingNameTest extends QuillBooking_Base_Test_Case
{

    /** @var Booking_Name */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_Name::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_Name::instance();
        $instance2 = Booking_Name::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Name', $this->tag->name);
        $this->assertSame($this->tag->group . '_name', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_name()
    {
        $booking = $this->createBooking(['name' => 'John Doe']);
        $this->assertSame('John Doe', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_when_no_name()
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
