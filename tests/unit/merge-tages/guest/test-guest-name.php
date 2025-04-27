<?php

use QuillBooking\Merge_Tags\Guest\Guest_Name;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class GuestNameTest extends WP_UnitTestCase
{

    /** @var Guest_Name */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Guest_Name::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Guest_Name::instance(), Guest_Name::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Guest Name', $this->tag->name);
        $this->assertSame($this->tag->group . '_name', $this->tag->slug);
        $this->assertSame('guest', $this->tag->group);
    }

    public function test_get_value_returns_guest_name()
    {
        $booking = $this->createBookingWithGuestName('Ahmed Ali');
        $this->assertSame('Ahmed Ali', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_guest_or_name_missing()
    {
        // بدون guest
        $booking = new stdClass();
        $this->assertSame('', $this->tag->get_value($booking));

        // بدون name
        $booking->guest = new stdClass();
        $this->assertSame('', $this->tag->get_value($booking));
    }

    /**
     * Helper to create booking with a guest name.
     */
    private function createBookingWithGuestName($name)
    {
        $guest = new stdClass();
        $guest->name = $name;

        $booking = new stdClass();
        $booking->guest = $guest;

        return $booking;
    }
}
