<?php

use QuillBooking\Merge_Tags\Booking\Reschedule_URL;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class RescheduleUrlTest extends WP_UnitTestCase
{

    /** @var Reschedule_URL */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Reschedule_URL::instance(); 
    }

    public function test_singleton_instance()
    {
        $instance1 = Reschedule_URL::instance();
        $instance2 = Reschedule_URL::instance();
        $this->assertSame($instance1, $instance2); 
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Reschedule URL', $this->tag->name);  
        $this->assertSame($this->tag->group .  '_reschedule_url', $this->tag->slug); 
        $this->assertSame('booking', $this->tag->group);   
    }

    public function test_get_value_returns_reschedule_url()
    {
     
        $booking = $this->createBookingMock();


        $this->assertSame('http://example.com/reschedule', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_booking_is_invalid()
    {

        $booking = new stdClass();

   
        $this->assertSame('', $this->tag->get_value($booking));
    }

    /**
     * Helper to create a booking mock with or without getRescheduleUrl method
     */
    private function createBookingMock($hasRescheduleUrl = true)
    {
   
        $booking = $this->getMockBuilder(Booking_Model::class)
            ->disableOriginalConstructor()
            ->getMock();

        if ($hasRescheduleUrl) {
            $booking->method('getRescheduleUrl')->willReturn('http://example.com/reschedule');
        }

        return $booking;
    }
}
