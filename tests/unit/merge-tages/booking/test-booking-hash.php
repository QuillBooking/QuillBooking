<?php

use QuillBooking\Merge_Tags\Booking\Booking_Hash;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingHashTest extends WP_UnitTestCase
{

    /** @var Booking_Hash */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_Hash::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_Hash::instance();
        $instance2 = Booking_Hash::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Unique Hash', $this->tag->name);
        $this->assertSame($this->tag->group . '_hash', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_hash_id()
    {
        $booking = $this->createBooking(['hash_id' => 'abc123']);
        $this->assertSame('abc123', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_when_no_hash_id()
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
