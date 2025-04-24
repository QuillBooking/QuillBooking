<?php

use QuillBooking\Event_Locations\Google_Meet;

/**
 * @group event-locations
 */
class GoogleMeetTest extends QuillBooking_Base_Test_Case
{
    /** @var Google_Meet */
    private $location;

    public function setUp(): void
    {
        parent::setUp();
        $this->location = Google_Meet::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Google_Meet::instance();
        $instance2 = Google_Meet::instance();

        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Google Meet', $this->location->title);
        $this->assertSame('google-meet', $this->location->slug);
        $this->assertTrue($this->location->is_integration);
    }
}
