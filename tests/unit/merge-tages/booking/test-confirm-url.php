<?php

use QuillBooking\Merge_Tags\Booking\Confirm_URL;
use QuillBooking\Models\Booking_Model;

/**
 * @group merge-tags
 */
class ConfirmURLTest extends QuillBooking_Base_Test_Case {


	/** @var Confirm_URL */
	private $tag;

	public function setUp(): void {
		parent::setUp();
		$this->tag = Confirm_URL::instance();
	}

	public function test_singleton_instance() {
		$instance1 = Confirm_URL::instance();
		$instance2 = Confirm_URL::instance();
		$this->assertSame( $instance1, $instance2 );
	}

	public function test_properties_are_set_correctly() {
		$this->assertSame( 'Confirmation URL', $this->tag->name );
		$this->assertSame( $this->tag->group . '_confirm_url', $this->tag->slug );
		$this->assertSame( 'booking', $this->tag->group );
	}

	public function test_get_value_returns_confirm_url() {
		$booking = $this->createBookingWithConfirmUrl( 'https://example.com/confirm?hash=12345' );
		$this->assertSame( 'https://example.com/confirm?hash=12345', $this->tag->get_value( $booking ) );
	}

	public function test_get_value_returns_empty_string_if_method_missing() {
		$booking = $this->getMockBuilder( stdClass::class )->getMock(); // not a Booking_Model
		$this->assertSame( '', $this->tag->get_value( $booking ) );
	}

	/**
	 * Helper to create a booking mock with getConfirmUrl()
	 */
	private function createBookingWithConfirmUrl( $url ) {
		$booking = $this->getMockBuilder( Booking_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'getConfirmUrl' ) )
			->getMock();

		$booking->method( 'getConfirmUrl' )->willReturn( $url );
		return $booking;
	}
}
