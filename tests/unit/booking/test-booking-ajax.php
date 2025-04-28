<?php


use phpmock\phpunit\PHPMock;
use QuillBooking\Booking\Booking_Ajax;




class BookingAjaxTest extends WP_UnitTestCase {



	use PHPMock;
	protected $booking_actions;
	protected $booking_ajax;
	protected $booking_service;
	protected $booking_validator;
	protected $calendar;
	protected $event;
	protected $booking;

	public function setUp(): void {
		parent::setUp();

		// Create mock dependencies
		if ( ! class_exists( 'QuillBooking\Models\Event_Model', false ) ) {
			class_alias( FakeEventModel::class, 'QuillBooking\Models\Event_Model' );
		}
		if ( ! class_exists( 'QuillBooking\Booking\Booking_Validator', false ) ) {
			class_alias( FakeBooking_Validator::class, 'QuillBooking\Booking\Booking_Validator' );
		}
		if ( ! class_exists( 'QuillBooking\Models\Booking_Model', false ) ) {
			class_alias( FakeBookingModel::class, 'QuillBooking\Models\Booking_Model' );
		}
		if ( ! class_exists( 'QuillBooking\Models\Calendar_Model', false ) ) {
			class_alias( FakeCalendarModel::class, 'QuillBooking\Models\Calendar_Model' );
		}
		if ( ! class_exists( 'QuillBooking\Booking_Service', false ) ) {
			class_alias( FakeBookingService::class, 'QuillBooking\Booking_Service' );
		}

		// Mock wp_send_json_error once for all cases
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

		$this->event   = new FakeEventModel();
		$this->booking = new FakeBookingModel();

		// Instantiate the class to test
		$this->booking_ajax = new Booking_Ajax();
	}

	public function tearDown(): void {
		parent::tearDown();
	}

	/**
	 * Test booking method with valid data
	 */
	public function test_booking_with_valid_data() {
		remove_all_actions( 'quillbooking_after_booking_created' );

		// Set up action tracking variables
		$action_called = false;
		$action_args   = null;

		// Set up the action
		add_action(
			'quillbooking_after_booking_created',
			function ( $booking, $args ) use ( &$action_called, &$action_args ) {
				$action_called = true;
				$action_args   = array( $booking, $args );
			},
			10,
			2
		);

		// Mock POST data
		$_POST = array(
			'id'             => $this->event->id,
			'payment_method' => 'stripe',
			'start_date'     => '2023-01-01 10:00',
			'timezone'       => 'UTC',
			'duration'       => 60,
			'location'       => 'Test Location',
			'invitee'        => array(
				array(
					'name'  => 'John Doe',
					'email' => 'john@example.com',
				),
			),
		);

		$wpSendJsonSuccessMock = $this->getFunctionMock( 'QuillBooking\Booking', 'wp_send_json_success' );
		$wpSendJsonSuccessMock->expects( $this->once() )
			->with( array( 'message' => 'Booking successful' ) )
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

		// Start output buffering
		ob_start();

		$this->booking_ajax->booking();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );

		// Verify action was called
		$this->assertTrue( $action_called, 'Action was not called' );

		// Verify action arguments
		$this->assertInstanceOf( 'QuillBooking\Models\Booking_Model', $action_args[0] );
		$this->assertEquals( array( 'payment_method' => 'stripe' ), $action_args[1] );

		// Verify response
		$this->assertTrue( $response['success'] );
		$this->assertEquals( 'Booking successful', $response['data']['message'] );
	}

	/**
	 * Test booking method with missing required fields
	 */
	public function test_booking_with_missing_payment_method() {
		// Test missing payment method when required
		$_POST = array( 'id' => $this->event->id );
		ob_start();
		$this->booking_ajax->booking();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );

		$this->assertFalse( $response['success'] );
		$this->assertEquals( 'Invalid payment method', $response['data']['message'] );
	}


	/**
	 * Test booking_details method
	 */
	public function test_booking_details() {
		$newEvent = new FakeEventModel(
			array(
				'id'       => 1,
				'duration' => 60,
			)
		);

		$_POST = array(
			'id'         => $newEvent->id,
			'start_date' => '2023-01-01 10:00',
			'timezone'   => 'UTC',
			'duration'   => 60,
		);

		$wpSendJsonSuccessMock = $this->getFunctionMock( 'QuillBooking\Booking', 'wp_send_json_success' );
		$wpSendJsonSuccessMock->expects( $this->once() )
			->with( $this->arrayHasKey( 'slots' ) )  // Expect the aatch exactly this structure
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

		$this->event->duration = 60;

		ob_start();
		$this->booking_ajax->booking_details();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );

		$this->assertTrue( $response['success'] );
		$this->assertArrayHasKey( 'slots', $response['data'] );
	}

	/**
	 * Test ajax_cancel_booking method
	 */
	public function test_ajax_cancel_booking() {
		remove_all_actions( 'quillbooking_booking_attendee_cancelled' );
		remove_all_actions( 'quillbooking_booking_cancelled' );

		$newBooking = new FakeBookingModel(
			array(
				'id' => 1,
			)
		);

		$_POST = array( 'id' => $newBooking->id );

		$wpSendJsonSuccessMock = $this->getFunctionMock( 'QuillBooking\Booking', 'wp_send_json_success' );
		$wpSendJsonSuccessMock->expects( $this->once() )
			->with( array( 'message' => __( 'Booking cancelled', 'quillbooking' ) ) )  // Match translated message
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

		ob_start();
		$this->booking_ajax->ajax_cancel_booking();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );

		$this->assertTrue( $response['success'] );
		$this->assertEquals( 'cancelled', $newBooking->status );
		$this->assertEquals( 'Booking cancelled', $response['data']['message'] );
	}

	/**
	 * Test ajax_cancel_booking method with completed booking
	 */
	public function test_ajax_cancel_booking_completed() {
		// throw exception if booking is completed
		$booking = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'completed',
			)
		);
		$_POST   = array( 'id' => $booking->id );
		ob_start();
		$this->booking_ajax->ajax_cancel_booking();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );
		$this->assertFalse( $response['success'] );
		$this->assertEquals( 'Booking is already completed', $response['data']['message'] );
	}
	/**
	 * Test ajax_reschedule_booking method
	 */
	public function test_ajax_reschedule_booking() {
		remove_all_actions( 'quillbooking_booking_attendee_rescheduled' );
		remove_all_actions( 'quillbooking_booking_rescheduled' );

		$original_date = new DateTime( '2023-01-01 10:00', new DateTimeZone( 'UTC' ) );

		$newBooking = new FakeBookingModel(
			array(
				'id'         => 4432,
				'event'      => new FakeEventModel(),
				'status'     => 'pending',
				'start_time' => $original_date->format( 'Y-m-d H:i:s' ),
				'slot_time'  => 30,
			)
		);

		$_POST = array(
			'id'         => $newBooking->id,
			'start_date' => '2023-01-01 10:00:00',
			'timezone'   => 'UTC',
			'duration'   => 60,
		);

		FakeEventModel::$mockAvailableSlots = true;

		$end_date = clone $original_date;
		$end_date->modify( "+{$_POST['duration']} minutes" );

		$wpSendJsonSuccessMock = $this->getFunctionMock( 'QuillBooking\Booking', 'wp_send_json_success' );
		$wpSendJsonSuccessMock->expects( $this->once() )
			->with( array( 'message' => __( 'Booking rescheduled', 'quillbooking' ) ) )  // Match translated message
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

		ob_start();
		$this->booking_ajax->ajax_reschedule_booking();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );

		$this->assertTrue( $response['success'] );
		$this->assertEquals( $_POST['start_date'], $newBooking->start_time );
		$this->assertEquals( $newBooking->end_time, $end_date->format( 'Y-m-d H:i:s' ) );
		$this->assertEquals( 'Booking rescheduled', $response['data']['message'] );
	}

	/**
	 * Test ajax_reschedule_booking method with completed booking
	 */
	public function test_ajax_reschedule_booking_completed() {
		remove_all_actions( 'quillbooking_booking_attendee_rescheduled' );
		remove_all_actions( 'quillbooking_booking_rescheduled' );

		// throw exception if booking is completed
		$booking = new FakeBookingModel(
			array(
				'id'     => 1,
				'status' => 'completed',
			)
		);

		$_POST = array(
			'id'         => $booking->id,
			'start_date' => '2023-01-02 10:00',
			'timezone'   => 'UTC',
			'duration'   => 60,
		);

		ob_start();
		$this->booking_ajax->ajax_reschedule_booking();
		$output   = ob_get_clean();
		$response = json_decode( $output, true );
		$this->assertFalse( $response['success'] );
		$this->assertEquals( 'Booking is already completed', $response['data']['message'] );
	}
}
