<?php

use QuillBooking\Merge_Tags\Guest\Guest_Timezone;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class GuestTimezoneTest extends WP_UnitTestCase
{

    /** @var Guest_Timezone */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Guest_Timezone::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Guest_Timezone::instance(), Guest_Timezone::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Guest Timezone', $this->tag->name);
        $this->assertSame($this->tag->group . '_timezone', $this->tag->slug);
        $this->assertSame('guest', $this->tag->group);
    }

    public function test_get_value_returns_timezone()
    {
        $booking = new stdClass();
        $booking->timezone = 'Asia/Riyadh';

        $this->assertSame('Asia/Riyadh', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_timezone_missing()
    {
        $booking = new stdClass(); // no timezone set

        $this->assertSame('', $this->tag->get_value($booking));
    }
}
