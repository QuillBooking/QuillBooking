<?php

use QuillBooking\Merge_Tags\Booking\Event_Name;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class EventNameTest extends WP_UnitTestCase
{

    /** @var Event_Name */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Event_Name::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Event_Name::instance();
        $instance2 = Event_Name::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Event Name', $this->tag->name);
        $this->assertSame($this->tag->group . '_event_name', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_event_name()
    {
        $booking = new stdClass();
        $booking->event = (object) ['name' => 'Team Sync Call'];
        $this->assertSame('Team Sync Call', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_event_or_name_is_missing()
    {
        $booking = new stdClass();
        $this->assertSame('', $this->tag->get_value($booking));

        $booking->event = new stdClass(); // no name
        $this->assertSame('', $this->tag->get_value($booking));
    }

}
