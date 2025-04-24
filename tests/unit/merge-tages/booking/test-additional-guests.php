<?php

use QuillBooking\Merge_Tags\Booking\Additional_Guests;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class AdditionalGuestsTest extends QuillBooking_Base_Test_Case
{
    /** @var Additional_Guests */
    private $tag;

    public function setUp(): void
    {
        parent::setUp();
        $this->tag = Additional_Guests::instance();
    }

    public function test_singleton_instance()
    {
        $instance1 = Additional_Guests::instance();
        $instance2 = Additional_Guests::instance();
        $this->assertSame($instance1, $instance2);
    }

    public function test_properties_are_set_correctly()
    {
        $this->assertSame('Additional Guests', $this->tag->name);
        $this->assertSame($this->tag->group . '_additional_guests', $this->tag->slug);
        $this->assertSame('booking', $this->tag->group);
    }

    public function test_get_value_returns_empty_if_fields_is_null()
    {
        $booking = $this->createBooking(null);
        $this->assertSame('', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_key_missing()
    {
        $booking = $this->createBooking(['other_data' => 'value']);
        $this->assertSame('', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_if_additional_guests_is_empty_array()
    {
        $booking = $this->createBooking(['additional_guests' => []]);
        $this->assertSame('', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_empty_string_if_additional_guests_is_not_array()
    {
        $booking = $this->createBooking(['additional_guests' => 'not an array']);
        $this->assertSame('', $this->tag->get_value($booking));
    }


    public function test_get_value_returns_single_guest_correctly()
    {
        $booking = $this->createBooking(['additional_guests' => ['John Doe']]);
        $this->assertSame('John Doe', $this->tag->get_value($booking));
    }

    public function test_get_value_returns_multiple_guests_correctly()
    {
        $guests = ['John Doe', 'Jane Smith', 'Bob Johnson'];
        $booking = $this->createBooking(['additional_guests' => $guests]);
        $this->assertSame(implode(', ', $guests), $this->tag->get_value($booking));
    }

    public function test_get_value_handles_empty_and_null_values_in_guest_list()
    {
        $guests = ['John Doe', '', 'Jane Smith', null, 'Bob Johnson'];
        $booking = $this->createBooking(['additional_guests' => $guests]);
        $this->assertSame('John Doe, , Jane Smith, , Bob Johnson', $this->tag->get_value($booking));
    }

    public function test_get_value_handles_non_string_values()
    {
        $guests = ['John Doe', 123, true];
        $booking = $this->createBooking(['additional_guests' => $guests]);
        $this->assertSame('John Doe, 123, 1', $this->tag->get_value($booking));
    }

    /**
     * Helper to create a booking mock with fields
     */
    private function createBooking($fields)
    {
        $booking = new stdClass();
        $booking->fields = $fields;
        return $booking;
    }
}
