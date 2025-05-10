<?php

use QuillBooking\Merge_Tags\Host\Host_Timezone;

/**
 * @group merge-tags
 */
class HostTimezoneTest extends WP_UnitTestCase
{

    /** @var Host_Timezone */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Host_Timezone::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Host_Timezone::instance(), Host_Timezone::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Host Timezone', $this->tag->name);
        $this->assertSame($this->tag->group . '_timezone', $this->tag->slug);
        $this->assertSame('host', $this->tag->group);
    }

    public function test_get_value_returns_calendar_timezone()
    {
        $booking = (object) [
            'calendar' => (object) [
                'timezone' => 'Asia/Cairo',
            ],
        ];

        $this->assertSame('Asia/Cairo', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_calendar_or_timezone_missing()
    {
        $this->assertSame('', $this->tag->get_value((object) []));

        $booking = (object) ['calendar' => (object) []];
        $this->assertSame('', $this->tag->get_value($booking));
    }
}
