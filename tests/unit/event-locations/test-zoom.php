<?php

use QuillBooking\Event_Locations\Zoom;

/**
 * @group event-locations
 */
class ZoomTest extends WP_UnitTestCase
{

    // Test Singleton Instance
    public function test_singleton_instance()
    {
        $location1 = Zoom::instance();
        $location2 = Zoom::instance();

        $this->assertSame($location1, $location2);
    }

    public function test_properties_are_set_correctly()
    {
        $location = Zoom::instance();

        $this->assertSame('Zoom', $location->title);
        $this->assertSame('zoom', $location->slug);
    }

    public function test_is_integration_is_set_to_true()
    {
        $location = Zoom::instance();

        $this->assertTrue($location->is_integration);
    }
}
