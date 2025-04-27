<?php

use QuillBooking\Merge_Tags\Guest\Guest_Email;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class GuestEmailTest extends WP_UnitTestCase
{

    /** @var Guest_Email */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Guest_Email::instance(); // الحصول على كائن merge tag
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Guest_Email::instance(), Guest_Email::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Guest Email', $this->tag->name);
        $this->assertSame($this->tag->group . '_email', $this->tag->slug);
        $this->assertSame('guest', $this->tag->group);
    }

    public function test_get_value_returns_guest_email()
    {
        $booking = $this->createBookingWithGuestEmail('test@example.com');
        $this->assertSame('test@example.com', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_guest_or_email_missing()
    {
    
        $booking = new stdClass();
        $this->assertSame('', $this->tag->get_value($booking));

     
        $booking->guest = new stdClass();
        $this->assertSame('', $this->tag->get_value($booking));
    }

    /**
     * Helper method to create a mock booking with a guest email.
     */
    private function createBookingWithGuestEmail($email)
    {
        $guest = new stdClass();
        $guest->email = $email;

        $booking = new stdClass();
        $booking->guest = $guest;

        return $booking;
    }
}
