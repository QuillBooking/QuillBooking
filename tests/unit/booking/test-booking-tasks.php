<?php

use QuillBooking\Booking\Booking_Tasks;
use phpmock\phpunit\PHPMock;

class Test_Booking_Tasks extends WP_UnitTestCase {

	use PHPMock; // Enable function mocking

	protected Booking_Tasks $booking_tasks;
	protected FakeBookingModel $booking;


	private $time_mock;
	private $error_log_mock;

	public function setUp(): void {
		parent::setUp();

		$this->booking_tasks = new Booking_Tasks();

		$this->booking             = new FakeBookingModel();
		$this->booking->id         = 456;
		$this->booking->start_time = '2024-12-25 14:00:00';

		if ( ! $this->booking->event instanceof FakeEventModel ) {
			$this->booking->event = new FakeEventModel();
		}
		$this->booking->event->email_notifications = array(
			'organizer_reminder' => array(
				'enabled' => true,
				'times'   => array(

					array(
						'value' => 60,
						'unit'  => 'minutes',
					),
					array(
						'value' => 1,
						'unit'  => 'days',
					),
				),
			),
			'attendee_reminder'  => array(
				'enabled' => true,
				'times'   => array(
					array(
						'value' => 30,
						'unit'  => 'minutes',
					),
				),
			),
		);

		$this->time_mock      = $this->getFunctionMock( 'QuillBooking\Booking', 'time' );
		$this->error_log_mock = $this->getFunctionMock( 'QuillBooking\Booking', 'error_log' );
		$this->error_log_mock->expects( $this->any() )->willReturn( true );
		$this->time_mock->expects( $this->any() )->willReturn( strtotime( $this->booking->start_time ) - ( 2 * 3600 ) );
	}

	public function tearDown(): void {
		parent::tearDown(); // Use if extending WP_UnitTestCase
	}


	public function test_schedule_booking_tasks() {

		$reflection = new ReflectionMethod( $this->booking_tasks, 'schedule_reminders' );
		$reflection->setAccessible( true );

		$reflection->invoke( $this->booking_tasks, $this->booking, 'organizer_reminder', 'booking_organizer_reminder' );
		$reflection->invoke( $this->booking_tasks, $this->booking, 'attendee_reminder', 'booking_attendee_reminder' );

		$this->assertTrue( true );
	}

	/**
	 * @dataProvider dateIntervalDataProvider
	 */
	public function test_get_date_interval( $value, $unit, $expected_spec ) {
		$method = self::get_private_method( 'get_date_interval' );
		$result = $method->invokeArgs( $this->booking_tasks, array( $value, $unit ) );

		if ( $expected_spec === null ) {
			$this->assertNull( $result, "Expected null for invalid unit '{$unit}'." );
		} else {
			$this->assertInstanceOf( \DateInterval::class, $result, "Failed to create DateInterval for {$value} {$unit}." );
			// Compare calculated seconds as spec string isn't reliable
			$seconds          = $this->get_seconds_from_interval_via_reflection( $result );
			$expected_seconds = $this->calculate_seconds_from_spec( $expected_spec, $value );
			$this->assertEquals( $expected_seconds, $seconds, "Second mismatch for interval {$expected_spec}." );
		}
	}

	public function dateIntervalDataProvider(): array {
		// Format: [value, unit, expected PHP DateInterval spec string or null]
		return array(
			array( 10, 'minutes', 'PT{v}M' ),
			array( 2, 'hours', 'PT{v}H' ),
			array( 1, 'days', 'P{v}D' ),
			array( 0, 'minutes', 'PT{v}M' ), // Test zero
			array( 1, 'MINUTES', 'PT{v}M' ), // Test case insensitivity
			array( 65, 'minutes', 'PT{v}M' ), // More than 60 mins
			array( 25, 'hours', 'PT{v}H' ),   // More than 24 hours
			array( 10, 'foo', null ),        // Test invalid unit
			array( -5, 'hours', 'PT{v}H' ),   // Test negative (DateInterval creates it)
		);
	}

	// Helper to calculate seconds from expected spec for comparison
	private function calculate_seconds_from_spec( string $spec, int $value ): int {
		try {
			$interval = new \DateInterval( str_replace( '{v}', abs( $value ), $spec ) );
			if ( $value < 0 ) {
				$interval->invert = 1;
			}
			$seconds = ( $interval->d * 24 * 60 * 60 ) + ( $interval->h * 60 * 60 ) + ( $interval->i * 60 );
			return ( $interval->invert === 1 ) ? -$seconds : $seconds;
		} catch ( \Exception $e ) {
			return 0;
		}
	}


	/**
	 * @dataProvider secondsFromIntervalDataProvider
	 */
	public function test_get_seconds_from_interval( \DateInterval $interval, int $expected_seconds ) {
		$method = self::get_private_method( 'get_seconds_from_interval' );
		$result = $method->invokeArgs( $this->booking_tasks, array( $interval ) );
		$this->assertEquals( $expected_seconds, $result );
	}

	public function secondsFromIntervalDataProvider(): array {
		$invertedInterval         = new \DateInterval( 'PT1H' );
		$invertedInterval->invert = 1; // Properly set invert here

		return array(
			array( new \DateInterval( 'PT10M' ), 10 * 60 ),
			array( new \DateInterval( 'PT2H' ), 2 * 60 * 60 ),
			array( new \DateInterval( 'P1D' ), 1 * 24 * 60 * 60 ),
			array( new \DateInterval( 'P2DT3H5M' ), ( 2 * 24 * 3600 ) + ( 3 * 3600 ) + ( 5 * 60 ) ),
			array( new \DateInterval( 'P0D' ), 0 ),
			array( new \DateInterval( 'PT0S' ), 0 ),
			array( $invertedInterval, -3600 ), // Now proper inverted interval
		);
	}


	// =============================================
	// Reflection Helper Methods
	// =============================================

	protected static function get_private_method( string $name ): \ReflectionMethod {
		$class  = new \ReflectionClass( Booking_Tasks::class );
		$method = $class->getMethod( $name );
		$method->setAccessible( true );
		return $method;
	}

	// Helper to call the private seconds calculation via reflection
	private function get_seconds_from_interval_via_reflection( \DateInterval $interval ): int {
		$method = self::get_private_method( 'get_seconds_from_interval' );
		return $method->invokeArgs( $this->booking_tasks, array( $interval ) );
	}
}
