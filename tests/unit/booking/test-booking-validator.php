<?php

use QuillBooking\Booking\Booking_Validator;
use phpmock\phpunit\PHPMock;
class Test_Booking_Validator extends WP_UnitTestCase {

	use PHPMock;

	private $time_mock;
	private $translate_mock; // For __()

	public function setUp(): void {
		parent::setUp();

		$this->time_mock      = $this->getFunctionMock( 'QuillBooking\Booking', 'time' );
		$this->translate_mock = $this->getFunctionMock( 'QuillBooking\Booking', '__' );
		$this->translate_mock->expects( $this->any() )->willReturnArgument( 0 );
		$this->time_mock->expects( $this->any() )->willReturn( strtotime( '2024-01-15 12:00:00 UTC' ) );
	}

	public function tearDown(): void {
		parent::tearDown();
	}


	public function test_validate_booking_success() {
		// --- Arrange ---
		$valid_hash_id = 'validhash123';
		$fake_booking  = new FakeBookingModel(
			array(
				'id'      => $valid_hash_id,
				'hash_id' => $valid_hash_id,
				'status'  => 'pending',
			)
		);

		// --- Act ---
		$result = Booking_Validator::validate_booking( $valid_hash_id, FakeBookingModel::class );

		// --- Assert ---
		$this->assertSame( $fake_booking->hash_id, $result->hash_id );
		$this->assertSame( $fake_booking->status, $result->status );
	}

	public function test_validate_booking_invalid_null_id() {
		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid booking' );

		// --- Act ---
		Booking_Validator::validate_booking( null );
	}

	public function test_validate_booking_invalid_empty_id() {
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid booking' );
		Booking_Validator::validate_booking( '' );
	}

	public function test_validate_booking_not_found() {

		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid booking' );

		// --- Act ---
		Booking_Validator::validate_booking( 'nonexistenthash' );
	}

	public function test_validate_booking_already_completed() {
		// --- Arrange ---
		$completed_hash_id = 'completedhash';
		$fake_booking      = new FakeBookingModel(
			array(
				'id'      => $completed_hash_id,
				'hash_id' => $completed_hash_id,
				'status'  => 'completed',
			)
		);

		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Booking is already completed' );

		// --- Act ---
		Booking_Validator::validate_booking( $completed_hash_id, FakeBookingModel::class );
	}

	public function test_validate_booking_already_cancelled() {
		// --- Arrange ---
		$cancelled_hash_id = 'cancelledhash';
		$fake_booking      = new FakeBookingModel(
			array(
				'id'      => $cancelled_hash_id,
				'hash_id' => $cancelled_hash_id,
				'status'  => 'cancelled',
			)
		);

		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Booking is already cancelled' );

		// --- Act ---
		Booking_Validator::validate_booking( $cancelled_hash_id, FakeBookingModel::class );
	}


	// =============================================
	// Tests for validate_event()
	// =============================================

	public function test_validate_event_success() {
		// --- Arrange ---
		$valid_event_id = 987;
		$fake_event     = new FakeEventModel(
			array(
				'id'   => $valid_event_id,
				'slug' => 'Test Event',
			)
		);

		// --- Act ---
		$result = Booking_Validator::validate_event( $valid_event_id, FakeEventModel::class );

		// --- Assert ---
		$this->assertSame( $fake_event->id, $result->id );
	}

	public function test_validate_event_invalid_null_id() {
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid event' );
		Booking_Validator::validate_event( null );
	}

	public function test_validate_event_invalid_zero_id() {
		// Assuming 0 is invalid
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid event' );
		Booking_Validator::validate_event( 0, FakeEventModel::class );
	}

	public function test_validate_event_not_found() {
		// --- Arrange ---

		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid event' );

		// --- Act ---
		Booking_Validator::validate_event( 12345, FakeEventModel::class );
	}


	// =============================================
	// Tests for validate_start_date()
	// =============================================

	public function test_validate_start_date_success_future_date() {
		// --- Arrange ---
		$fixed_now = strtotime( '2024-01-15 12:00:00 UTC' );
		$this->time_mock->expects( $this->any() )->willReturn( $fixed_now );

		$future_date_str = '2025-05-15 13:00:00'; // One hour in the future
		$timezone_str    = 'UTC';

		// --- Act ---
		// We are not mocking Utils::create_date_time, so we expect a real DateTime back
		$result = Booking_Validator::validate_start_date( $future_date_str, $timezone_str );

		// --- Assert ---
		$this->assertInstanceOf( \DateTime::class, $result );
		// Check if the returned DateTime represents the correct point in time
		$expected_timestamp = strtotime( $future_date_str . ' ' . $timezone_str );
		$this->assertEquals( $expected_timestamp, $result->getTimestamp() );
	}

	public function test_validate_start_date_fail_past_date() {
		// --- Arrange ---
		$fixed_now = strtotime( '2024-01-15 12:00:00 UTC' );
		$this->time_mock->expects( $this->any() )->willReturn( $fixed_now );

		$past_date_str = '2024-01-15 11:00:00'; // One hour in the past
		$timezone_str  = 'UTC';

		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid start date' );

		// --- Act ---
		Booking_Validator::validate_start_date( $past_date_str, $timezone_str );
	}

	public function test_validate_start_date_fail_same_time() {
		// --- Arrange ---
		// Set time() to return the exact timestamp we will test
		$fixed_now = strtotime( '2024-01-15 12:00:00 UTC' );
		$this->time_mock->expects( $this->any() )->willReturn( $fixed_now );

		$same_date_str = '2024-01-15 12:00:00';
		$timezone_str  = 'UTC';

		// --- Assert Exception ---
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid start date' ); // Timestamp check is < not <=

		// --- Act ---
		Booking_Validator::validate_start_date( $same_date_str, $timezone_str );
	}

	// Note: Testing invalid date strings or timezones would require the underlying
	// `new DateTime()` call to throw an exception, which the current validator
	// doesn't catch. You might add tests if you modify the validator to handle those.


	// =============================================
	// Tests for validate_duration()
	// =============================================

	/**
	 * @dataProvider durationValidDataProvider
	 */
	public function test_validate_duration_valid_inputs( $input_duration, $default_duration, $expected_output ) {
		$result = Booking_Validator::validate_duration( $input_duration, $default_duration );
		$this->assertSame( $expected_output, $result ); // Use assertSame for integers
	}

	public function durationValidDataProvider(): array {
		return array(
			'Positive Integer'              => array( 60, null, 60 ),
			'String Integer'                => array( '30', null, 30 ),
			'Null Duration, Has Default'    => array( null, 45, 45 ),
			'Zero Duration, Has Default'    => array( 0, 90, 90 ),
			'Empty String, Has Default'     => array( '', 15, 15 ),
			'Float String (gets truncated)' => array( '15.7', null, 15 ),
		);
	}

	/**
	 * @dataProvider durationInvalidDataProvider
	 */
	public function test_validate_duration_invalid_inputs( $input_duration, $default_duration ) {
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid duration' );

		Booking_Validator::validate_duration( $input_duration, $default_duration );
	}

	public function durationInvalidDataProvider(): array {
		return array(
			'Null Duration, Null Default' => array( null, null ),
			'Empty String, Null Default'  => array( '', null ),
			// Note: intval(0) is 0, which passes the `if (!$duration)` check if there's no default.
			// The method currently doesn't throw if the result is 0.
			// Add this case if you expect 0 to be invalid:
			// 'Zero Duration, Null Default' => [0, null],
			'Non-numeric String'          => array( 'abc', null ),
			'Negative Integer'            => array( -30, null ), // intval(-30) is -30, passes if check, returns -30 (maybe should throw?)
		);
	}

	// Optional: Test case if zero duration should explicitly throw an exception
	public function test_validate_duration_throws_if_zero_and_no_default() {
		// This test assumes the logic SHOULD throw for 0 if no default is given.
		// If the current behavior (returning 0) is intended, remove this test.
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid duration' );
		Booking_Validator::validate_duration( 0, null );
	}

	// Optional: Test case if negative duration should throw
	public function test_validate_duration_throws_if_negative() {
		// This test assumes negative durations are invalid.
		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Invalid duration' );
		Booking_Validator::validate_duration( -60, null );
	}
}
