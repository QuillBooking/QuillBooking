<?php

use QuillBooking\Merge_Tags\Booking\Booking_Details_URL;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingDetailsUrlTest extends WP_UnitTestCase
{
    /** @var Booking_Details_URL */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Booking_Details_URL::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_Details_URL::instance();
        $instance2 = Booking_Details_URL::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Details URL (Admin)', $this->tag->name);
        $this->assertSame($this->tag->group . '_details_url', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_details_url()
    {
        $booking = $this->createBooking();
        $booking->method('getDetailsUrl')->willReturn('https://example.com/details');

        $this->assertSame('https://example.com/details', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_when_no_booking()
    {
        $this->assertSame('', $this->tag->get_value(null));
    }

    /**
     * Helper to create a booking mock
     */
    private function createBooking()
    {
        $booking = $this->getMockBuilder(Booking_Model::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getDetailsUrl'])
            ->getMock();

        return $booking;
    }
}
