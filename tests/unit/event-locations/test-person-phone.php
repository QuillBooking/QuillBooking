<?php

use QuillBooking\Event_Locations\Person_Phone;

/**
 * @group event-locations
 */
class PersonPhoneTest extends WP_UnitTestCase
{

    // Test Singleton Instance
    public function test_singleton_instance()
    {
        $location1 = Person_Phone::instance();
        $location2 = Person_Phone::instance();

        $this->assertSame($location1, $location2);
    }

    public function test_properties_are_set_correctly()
    {
        $location = Person_Phone::instance();

        $this->assertSame('Person Phone', $location->title);
        $this->assertSame('person_phone', $location->slug);
    }

    public function test_get_admin_fields_returns_expected_fields()
    {
        $location = Person_Phone::instance();

        $fields = $location->get_admin_fields();

        $this->assertArrayHasKey('phone', $fields);
        $this->assertArrayHasKey('display_on_booking', $fields);

        $this->assertSame('text', $fields['phone']['type']);
        $this->assertSame('checkbox', $fields['display_on_booking']['type']);
    }
}
