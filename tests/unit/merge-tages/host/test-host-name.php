<?php

use QuillBooking\Merge_Tags\Host\Host_Name;

/**
 * @group merge-tags
 */
class HostNameTest extends WP_UnitTestCase
{

    /** @var Host_Name */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Host_Name::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Host_Name::instance(), Host_Name::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Host Name', $this->tag->name);
        $this->assertSame($this->tag->group . '_name', $this->tag->slug);
        $this->assertSame('host', $this->tag->group);
    }

    public function test_get_value_returns_calendar_name()
    {
        $booking = (object) [
            'calendar' => (object) [
                'name' => 'Ahmed Khaled',
            ],
        ];

        $this->assertSame('Ahmed Khaled', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_calendar_missing()
    {
        $booking = (object) [];

        $this->assertSame('', $this->tag->get_value($booking));

        $booking->calendar = (object) [];
        $this->assertSame('', $this->tag->get_value($booking));
    }
}
