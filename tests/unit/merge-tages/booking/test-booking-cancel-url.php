<?php

use QuillBooking\Merge_Tags\Booking\Booking_Cancel_URL;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class BookingCancelUrlTest extends QuillBooking_Base_Test_Case
{
    /** @var Booking_Cancel_URL */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag =  Booking_Cancel_URL::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Booking_Cancel_URL::instance();
        $instance2 = Booking_Cancel_URL::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Booking Cancel URL', $this->tag->name);
        $this->assertSame($this->tag->group . '_cancel_url', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }


    public function test_get_value_returns_cancel_url()
    {
        $booking = $this->createBooking();
        $booking->method('getCancelUrl')->willReturn('https://example.com/cancel');

        $this->assertSame('https://example.com/cancel', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_when_no_booking()
    {
        $this->assertSame('', $this->tag->get_value(null));
    }

    /**
     * Helper to create a booking mock with fields
     */
    private function createBooking()
    {
        $booking = $this->getMockBuilder(Booking_Model::class)
            ->disableOriginalConstructor()
            ->addMethods(['getCancelUrl'])
            ->getMock();

        return $booking;
    }
}
