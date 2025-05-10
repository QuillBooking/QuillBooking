<?php

use QuillBooking\Event_Locations\MS_Teams;

/**
 * @group event-locations
 */
class MSTeamsTest extends QuillBooking_Base_Test_Case
{
    /** @var MS_Teams */
    private $location;

    public function setUp(): void
    {
        parent::setUp();
        $this->location = MS_Teams::instance();
    }

    public function test_singleton_instance()
    {
        $this->assertSame($this->location, MS_Teams::instance());
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Microsoft Teams', $this->location->title);
        $this->assertSame('ms-teams', $this->location->slug);
        $this->assertTrue($this->location->is_integration);
    }
}
