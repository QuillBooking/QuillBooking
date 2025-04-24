<?php

use QuillBooking\Event_Locations\Online;

/**
 * @group event-locations
 */
class OnlineTest extends QuillBooking_Base_Test_Case
{

    // Test Singleton Instance
    public function test_singleton_instance()
    {
        $location1 = Online::instance();
        $location2 = Online::instance();

        $this->assertSame($location1, $location2);
    }

    public function test_properties_are_set_correctly()
    {
        $location = Online::instance();

        $this->assertSame('Online', $location->title);
        $this->assertSame('online', $location->slug);
    }

    public function test_get_admin_fields_returns_expected_fields()
    {
        $location = Online::instance();

        $fields = $location->get_admin_fields();

        $this->assertArrayHasKey('meeting_url', $fields);
        $this->assertArrayHasKey('display_on_booking', $fields);

        $this->assertSame('url', $fields['meeting_url']['type']);
        $this->assertSame('checkbox', $fields['display_on_booking']['type']);
    }
}
