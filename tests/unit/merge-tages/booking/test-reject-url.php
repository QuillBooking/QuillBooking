<?php

use QuillBooking\Merge_Tags\Booking\Reject_URL;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class RejectUrlTest extends QuillBooking_Base_Test_Case
{

    /** @var Reject_URL */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Reject_URL::instance(); 
    }

    public function test_singleton_instance()
    {
        $instance1 = Reject_URL::instance();
        $instance2 = Reject_URL::instance();
        $this->assertSame($instance1, $instance2); 
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Reject URL', $this->tag->name); 
        $this->assertSame($this->tag->group  . '_reject_url', $this->tag->slug); 
        $this->assertSame('booking', $this->tag->group);  
    }

    public function test_get_value_returns_reject_url()
    {
 
        $booking = $this->createBookingMock();


        $this->assertSame('http://example.com/reject', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_booking_is_invalid()
    {
     
        $booking = new stdClass();

        $this->assertSame('', $this->tag->get_value($booking));
    }

    /**
     * Helper to create a booking mock with or without getRejectUrl method
     */
    private function createBookingMock($hasRejectUrl = true)
    {
        $booking = $this->getMockBuilder(Booking_Model::class)
            ->disableOriginalConstructor()
            ->addMethods($hasRejectUrl ? ['getRejectUrl'] : [])
            ->getMock();

        if ($hasRejectUrl) {
            $booking->method('getRejectUrl')->willReturn('http://example.com/reject');
        }

        return $booking;
    }
}
