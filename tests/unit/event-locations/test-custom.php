<?php

use QuillBooking\Event_Locations\Custom;

/**
 * @group event-locations
 */
class CustomLocationTest extends QuillBooking_Base_Test_Case {

	/** @var Custom */
	private $location;

	public function setUp(): void {
		parent::setUp();
		$this->location = Custom::instance();
	}

	public function test_singleton_instance() {
		$location1 = Custom::instance();
		$location2 = Custom::instance();

		$this->assertSame( $location1, $location2 );
	}

	public function test_properties_are_set_correctly() {
		$this->assertSame( 'Custom Location', $this->location->title );
		$this->assertSame( 'custom', $this->location->slug );
	}

	public function test_get_admin_fields_returns_expected_fields() {
		$fields = $this->location->get_admin_fields();

		$this->assertArrayHasKey( 'location', $fields );
		$this->assertSame( 'Custom Location', $fields['location']['label'] );
		$this->assertSame( 'text', $fields['location']['type'] );
		$this->assertTrue( $fields['location']['required'] );

		$this->assertArrayHasKey( 'description', $fields );
		$this->assertSame( 'Description', $fields['description']['label'] );
		$this->assertSame( 'textarea', $fields['description']['type'] );
		$this->assertTrue( $fields['description']['required'] );

		$this->assertArrayHasKey( 'display_on_booking', $fields );
		$this->assertSame( 'Display on Booking', $fields['display_on_booking']['label'] );
		$this->assertSame( 'Display on booking page', $fields['display_on_booking']['desc'] );
		$this->assertSame( 'checkbox', $fields['display_on_booking']['type'] );
		$this->assertFalse( $fields['display_on_booking']['required'] );
	}
}
