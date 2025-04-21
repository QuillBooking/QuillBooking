<?php

use QuillBooking\Event_Locations\Attendee_Phone;

/**
 * @group event-locations
 */
class AttendeePhoneTest extends WP_UnitTestCase
{
    /** @var Attendee_Phone */
    private $location;

    public function setUp(): void
    {
        parent::setUp();
        $this->location = Attendee_Phone::instance();
    }

    public function test_singleton_instance()
    {
        $location1 = Attendee_Phone::instance();
        $location2 = Attendee_Phone::instance();

        $this->assertSame($location1, $location2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Attendee Phone', $this->location->title);
        $this->assertSame('attendee_phone', $this->location->slug);
    }

    public function test_get_fields_returns_phone_field()
    {
        $fields = $this->location->get_fields();

        $this->assertArrayHasKey('phone', $fields);
        $this->assertSame('Your Phone', $fields['phone']['label']);
        $this->assertSame('text', $fields['phone']['type']);
        $this->assertTrue($fields['phone']['required']);
        $this->assertSame('system', $fields['phone']['group']);
        $this->assertSame('Enter your phone', $fields['phone']['placeholder']);
        $this->assertSame(4, $fields['phone']['order']);
    }

    public function test_get_admin_fields_is_empty()
    {
        $this->assertEmpty($this->location->get_admin_fields());
    }
}
