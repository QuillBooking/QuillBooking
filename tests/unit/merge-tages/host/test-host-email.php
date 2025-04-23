<?php

use QuillBooking\Merge_Tags\Host\Host_Email;

/**
 * @group merge-tags
 */
class HostEmailTest extends WP_UnitTestCase
{

    /** @var Host_Email */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Host_Email::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame(Host_Email::instance(), Host_Email::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Host Email', $this->tag->name);
        $this->assertSame($this->tag->group . '_email', $this->tag->slug);
        $this->assertSame('host', $this->tag->group);
    }

    public function test_get_value_returns_email()
    {
        $booking = (object) [
            'calendar' => (object) [
                'user' => (object) [
                    'user_email' => 'host@example.com',
                ],
            ],
        ];

        $this->assertSame('host@example.com', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_data_missing()
    {
        $booking = (object) [];

        $this->assertSame('', $this->tag->get_value($booking));

        $booking->calendar = (object) [];
        $this->assertSame('', $this->tag->get_value($booking));

        $booking->calendar->user = (object) [];
        $this->assertSame('', $this->tag->get_value($booking));
    }
}
