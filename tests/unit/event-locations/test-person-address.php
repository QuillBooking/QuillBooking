<?php

use QuillBooking\Event_Locations\Person_Address;

/**
 * @group event-locations
 */
class PersonAddressTest extends QuillBooking_Base_Test_Case
{

    // Test Singleton Instance
    public function test_singleton_instance()
    {
        $location1 = Person_Address::instance();
        $location2 = Person_Address::instance();

        $this->assertSame($location1, $location2);
    }

    public function test_properties_are_set_correctly()
    {
        $location = Person_Address::instance();

        $this->assertSame('Person Address', $location->title);
        $this->assertSame('person_address', $location->slug);
    }

    public function test_get_admin_fields_returns_expected_fields()
    {
        $location = Person_Address::instance();

        $fields = $location->get_admin_fields();

        $this->assertArrayHasKey('location', $fields);
        $this->assertArrayHasKey('display_on_booking', $fields);

        $this->assertSame('text', $fields['location']['type']);
        $this->assertSame('checkbox', $fields['display_on_booking']['type']);
    }
}
