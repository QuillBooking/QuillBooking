<?php

use QuillBooking\Merge_Tags\Guest\Guest_Note;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class GuestNoteTest extends WP_UnitTestCase
{

    /** @var Guest_Note */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Guest_Note::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Guest_Note::instance(), Guest_Note::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Guest Note', $this->tag->name);
        $this->assertSame($this->tag->group . '_note', $this->tag->slug);
        $this->assertSame('guest', $this->tag->group);
    }

    public function test_get_value_returns_guest_note_if_present()
    {
        $booking = $this->createBookingWithMessage('Looking forward to the meeting!');
        $this->assertSame('Looking forward to the meeting!', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_message_missing()
    {
        $booking = $this->createBookingWithMessage(null);
        $this->assertSame('', $this->tag->get_value($booking));

        $booking = $this->createBookingWithMessage('');
        $this->assertSame('', $this->tag->get_value($booking));
    }

    /**
     * Helper to create a booking mock with a 'message' field in 'fields'.
     */
    private function createBookingWithMessage($message)
    {
        $booking = new stdClass();
        $booking->fields = [];

        if ($message !== null) {
            $booking->fields['message'] = $message;
        }

        return $booking;
    }
}
