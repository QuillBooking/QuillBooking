<?php

use phpmock\phpunit\PHPMock;
use QuillBooking\Booking\Booking_Actions;

class Test_Booking_Actions extends WP_UnitTestCase {

	use PHPMock;
	protected $booking_actions;
	protected $calendar;
	protected $event;
	protected $booking;

	public function setUp(): void {
		parent::setUp();

		$wpSendJsonSuccessMock = $this->getFunctionMock( 'QuillBooking\Booking', 'wp_send_json_success' );
		$wpSendJsonSuccessMock->expects( $this->any() )
			->willReturnCallback(
				function ( $response ) {
					echo json_encode(
						array(
							'success' => true,
							'data'    => $response,
						)
					);
					return null;
				}
			);

		$wpSendJsonErrorMock = $this->getFunctionMock( 'QuillBooking\Booking', 'wp_send_json_error' );
		$wpSendJsonErrorMock->expects( $this->any() )
			->willReturnCallback(
				function ( $response ) {
					echo json_encode(
						array(
							'success' => false,
							'data'    => $response,
						)
					);
					return null;
				}
			);

		$this->booking = new FakeBookingModel(
			array(
				'id'      => 1,
				'status'  => 'pending',
				'hash_id' => 'valid_booking_hash',
			)
		);

		$this->booking_actions = new Booking_Actions(
			FakeCalendarModel::class,
			FakeEventModel::class,
			FakeBooking_Validator::class,
		);
	}

	public function tearDown(): void {
		parent::tearDown();
	}

	public function test_enqueue_scripts() {
		$this->booking_actions->enqueue_scripts();

		// Verify scripts are registered
		$this->assertTrue( wp_script_is( 'quillbooking-renderer', 'registered' ) );
		$this->assertTrue( wp_style_is( 'quillbooking-renderer', 'registered' ) );
	}

	public function test_render_booking_page_with_calendar() {
		$_GET['quillbooking_calendar'] = 'test-calendar';
		$_GET['event']                 = 'test-event';

		ob_start();
		$this->booking_actions->render_booking_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<div id="quillbooking-booking-page">', $output );
	}


	public function test_render_booking_page_with_event() {
		$_GET = array(
			'quillbooking_calendar' => 'test-calendar',
			'event'                 => 'test-event',
		);

		ob_start();
		$this->booking_actions->render_booking_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'quillbooking-booking-page', $output );
	}

	public function test_render_booking_page_no_calendar() {
		$_GET = array();

		ob_start();
		$this->booking_actions->render_booking_page();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	public function test_render_booking_page_invalid_calendar() {
		$_GET = array( 'quillbooking_calendar' => 'invalid-calendar' );

		ob_start();
		$this->booking_actions->render_booking_page();
		$output = ob_get_clean();

		$this->assertEquals( '', $output );
	}

	public function test_process_booking_action_confirm() {
		$this->booking = new FakeBookingModel(
			array(
				'id'      => 1,
				'status'  => 'pending',
				'hash_id' => 'valid_booking_hash',
			)
		);

		$_GET = array(
			'quillbooking_action' => 'confirm',
			'id'                  => $this->booking->id,
		);

		ob_start();
		$this->booking_actions->process_booking_action(
			'confirm',
			'scheduled',
			__( 'Booking confirmed', 'quillbooking' ),
			__( 'Booking confirmed by Organizer', 'quillbooking' )
		);
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Confirm Successful', $output );
		$this->assertStringContainsString( 'The booking has been successfully scheduled', $output );
	}

	public function test_process_booking_action_reject() {
		$this->booking = new FakeBookingModel(
			array(
				'id'      => 1,
				'status'  => 'pending',
				'hash_id' => 'valid_booking_hash',
			)
		);

		$_GET = array(
			'quillbooking_action' => 'reject',
			'id'                  => $this->booking->id,
		);

		ob_start();
		$this->booking_actions->process_booking_action(
			'reject',
			'rejected',
			__( 'Booking rejected', 'quillbooking' ),
			__( 'Booking rejected by Organizer', 'quillbooking' )
		);
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Reject Successful', $output );
		$this->assertStringContainsString( 'The booking has been successfully rejected', $output );
	}

	public function test_process_booking_action_cancel() {
		$this->booking = new FakeBookingModel(
			array(
				'id'      => 1,
				'status'  => 'pending',
				'hash_id' => 'valid_booking_hash',
			)
		);

		$_GET = array(
			'quillbooking_action' => 'cancel',
			'id'                  => $this->booking->id,
		);

		ob_start();
		$this->booking_actions->process_booking_action(
			'cancel',
			'cancelled',
			__( 'Booking cancelled', 'quillbooking' ),
			__( 'Booking cancelled by Attendee', 'quillbooking' )
		);
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Cancel Successful', $output );
		$this->assertStringContainsString( 'The booking has been successfully cancelled', $output );
	}
	public function test_process_booking_action_reschedule() {
		$this->booking = new FakeBookingModel(
			array(
				'id'      => 1,
				'status'  => 'pending',
				'hash_id' => 'valid_booking_hash',
			)
		);

		$_GET = array(
			'quillbooking_action' => 'reschedule',
			'id'                  => $this->booking->id,
		);

		ob_start();
		$this->booking_actions->process_booking_action(
			'reschedule',
			'rescheduled',
			__( 'Booking rescheduled', 'quillbooking' ),
			__( 'Booking rescheduled by Attendee', 'quillbooking' )
		);
		$output = ob_get_clean();

		$this->assertStringContainsString( 'Reschedule Successful', $output );
		$this->assertStringContainsString( 'The booking has been successfully rescheduled', $output );
	}

	public function test_process_booking_action_invalid_action() {
		$_GET = array( 'quillbooking_action' => 'invalid' );

		ob_start();
		$this->booking_actions->process_booking_action(
			'confirm',
			'scheduled',
			__( 'Booking confirmed', 'quillbooking' ),
			__( 'Booking confirmed by Organizer', 'quillbooking' )
		);
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}

	public function test_process_booking_action_already_completed() {
		$this->booking->update( array( 'status' => 'scheduled' ) );
		$_GET = array(
			'quillbooking_action' => 'confirm',
			'id'                  => $this->booking->id,
		);

		ob_start();
		$this->booking_actions->process_booking_action(
			'confirm',
			'scheduled',
			__( 'Booking confirmed', 'quillbooking' ),
			__( 'Booking confirmed by Organizer', 'quillbooking' )
		);
		$output = ob_get_clean();

		$this->assertStringContainsString( 'already scheduled', $output );
	}
}
