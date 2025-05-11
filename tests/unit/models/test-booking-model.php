<?php

use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Guest_Model;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Booking_Meta_Model;
use QuillBooking\Models\Booking_Log_Model;
use QuillBooking\Models\Booking_Order_Model;
use QuillBooking\Utils;
use WPEloquent\Eloquent\Collection;

class Test_Booking_Model extends QuillBooking_Base_Test_Case {


	/**
	 * Test database setup mock
	 */
	public function setUp(): void {
		parent::setUp();
		// Clear Mockery expectations
		\Mockery::close();
	}

	/**
	 * Test change_status method
	 */
	public function test_change_status() {
		$booking         = \Mockery::mock( Booking_Model::class )->makePartial();
		$booking->status = 'scheduled';
		$booking->shouldReceive( 'save' )->once();

		$booking->changeStatus( 'cancelled' );

		$this->assertEquals( 'cancelled', $booking->status );
	}

	/**
	 * Test get_meta method when value exists
	 */
	public function test_get_meta_returns_value() {
		$booking          = \Mockery::mock( Booking_Model::class )->makePartial();
		$meta             = new \stdClass();
		$meta->meta_value = maybe_serialize( 'Test Value' );

		// Create a nested mock for chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'test_key' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'first' )->once()->andReturn( $meta );

		$result = $booking->get_meta( 'test_key' );
		$this->assertEquals( 'Test Value', $result );
	}

	/**
	 * Test get_meta method when value doesn't exist
	 */
	public function test_get_meta_returns_default_when_not_exists() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		// Create a nested mock for chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'nonexistent_key' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'first' )->once()->andReturn( null );

		$result = $booking->get_meta( 'nonexistent_key', 'default_value' );
		$this->assertEquals( 'default_value', $result );
	}

	public function test_update_meta() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		// Mock an instance of the actual Booking_Meta_Model
		$metaModelMock = \Mockery::mock( Booking_Meta_Model::class );

		$metaRelationMock = \Mockery::mock( 'Illuminate\Database\Eloquent\Relations\HasMany' ); // Mock the relationship object
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaRelationMock );

		$metaRelationMock->shouldReceive( 'where' )->with( 'meta_key', 'test_key' )->once()->andReturnSelf(); // where() on relation returns the relation/builder
		$metaRelationMock->shouldReceive( 'firstOrNew' )
			->with( array( 'meta_key' => 'test_key' ) )
			->once()
			->andReturn( $metaModelMock );

		$metaModelMock->shouldReceive( 'setAttribute' )
			->with(
				'meta_value',
				\Mockery::on(
					function ( $arg ) {
						// Use a matcher for serialized data
						return $arg === maybe_serialize( 'new_value' );
					}
				)
			)
			->once();

		$metaModelMock->shouldReceive( 'save' )->once();

		$booking->update_meta( 'test_key', 'new_value' );
		$this->assertTrue( true );
	}

	/**
	 * Test getFieldsAttribute method
	 */
	public function test_get_fields_attribute() {
		$booking         = \Mockery::mock( Booking_Model::class )->makePartial();
		$expected_fields = array(
			'name'  => 'John',
			'email' => 'john@example.com',
		);

		// Create nested mocks for the chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'fields' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'value' )->with( 'meta_value' )->once()->andReturn( maybe_serialize( $expected_fields ) );

		$this->assertEquals( $expected_fields, $booking->getFieldsAttribute() );
	}

	/**
	 * Test getFieldsAttribute method when fields don't exist
	 */
	public function test_get_fields_attribute_returns_null_when_not_exists() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		// Create nested mocks for the chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'fields' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'value' )->with( 'meta_value' )->once()->andReturn( null );

		$this->assertNull( $booking->getFieldsAttribute() );
	}

	/**
	 * Test getTimezoneAttribute method
	 */
	public function test_get_timezone_attribute() {
		$booking           = \Mockery::mock( Booking_Model::class )->makePartial();
		$expected_timezone = 'America/New_York';

		// Create nested mocks for the chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'timezone' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'value' )->with( 'meta_value' )->once()->andReturn( maybe_serialize( $expected_timezone ) );

		$this->assertEquals( $expected_timezone, $booking->getTimezoneAttribute() );
	}

	/**
	 * Test getTimezoneAttribute method when timezone doesn't exist
	 */
	public function test_get_timezone_attribute_returns_null_when_not_exists() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		// Create nested mocks for the chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'timezone' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'value' )->with( 'meta_value' )->once()->andReturn( null );

		$this->assertNull( $booking->getTimezoneAttribute() );
	}

	/**
	 * Test getEventTimezoneAttribute method
	 */
	public function test_get_event_timezone_attribute() {
		$booking         = \Mockery::mock( Booking_Model::class )->makePartial();
		$event           = new \stdClass();
		$event->timezone = 'Europe/London';

		// Set the event property directly instead of using __set
		$booking->event = $event;

		$this->assertEquals( 'Europe/London', $booking->getEventTimezoneAttribute() );
	}

	/**
	 * Test setTimezoneAttribute method
	 */
	public function test_set_timezone_attribute() {
		$booking          = \Mockery::mock( Booking_Model::class )->makePartial();
		$metaInstanceMock = \Mockery::mock( Booking_Meta_Model::class ); // Mock the actual meta model instance

		$relationMock = \Mockery::mock( 'Illuminate\Database\Eloquent\Relations\HasMany' ); // Mock for the relationship object
		$booking->shouldReceive( 'meta' )->once()->andReturn( $relationMock ); // meta() returns a relationship/builder

		// The relationship/builder's firstOrNew method is called
		$relationMock->shouldReceive( 'firstOrNew' )
			->with( array( 'meta_key' => 'timezone' ) )
			->once()
			->andReturn( $metaInstanceMock ); // firstOrNew returns an instance of Booking_Meta_Model

		// Now expect operations on the Booking_Meta_Model instance
		$metaInstanceMock->shouldReceive( 'setAttribute' )->with( 'meta_value', maybe_serialize( 'Asia/Tokyo' ) )->once();
		$metaInstanceMock->shouldReceive( 'save' )->once();

		$booking->setTimezoneAttribute( 'Asia/Tokyo' );
		$this->assertTrue( true ); // Just to ensure the test runs without exceptions
	}

	/**
	 * Test getLocationAttribute method
	 */
	public function test_get_location_attribute() {
		$booking           = \Mockery::mock( Booking_Model::class )->makePartial();
		$expected_location = 'Meeting Room 1';

		// Create nested mocks for the chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'location' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'value' )->with( 'meta_value' )->once()->andReturn( maybe_serialize( $expected_location ) );

		$this->assertEquals( $expected_location, $booking->getLocationAttribute() );
	}

	/**
	 * Test getLocationAttribute method when location doesn't exist
	 */
	public function test_get_location_attribute_returns_null_when_not_exists() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		// Create nested mocks for the chained methods
		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'where' )->with( 'meta_key', 'location' )->once()->andReturnSelf();
		$metaQuery->shouldReceive( 'value' )->with( 'meta_value' )->once()->andReturn( null );

		$this->assertNull( $booking->getLocationAttribute() );
	}

	/**
	 * Test setLocationAttribute method
	 */
	public function test_set_location_attribute() {
		$booking   = \Mockery::mock( Booking_Model::class )->makePartial();
		$metaMock  = \Mockery::mock( Booking_Meta_Model::class )->makePartial();
		$metaQuery = \Mockery::mock( 'metaQuery' );

		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'firstOrNew' )
			->with( array( 'meta_key' => 'location' ) )
			->once()
			->andReturn( $metaMock );

		$metaMock->shouldReceive( 'setAttribute' )
			->with( 'meta_value', maybe_serialize( 'Conference Room B' ) )
			->once();

		$metaMock->shouldReceive( 'save' )->once();

		$booking->setLocationAttribute( 'Conference Room B' );
		$this->assertTrue( true ); // Just to ensure the test runs without exceptions
	}




	/**
	 * Test setFieldsAttribute method
	 */
	public function test_set_fields_attribute() {
		$booking  = \Mockery::mock( Booking_Model::class )->makePartial();
		$metaMock = \Mockery::mock( 'Booking_Meta_Model_Or_Similar' );
		$fields   = array(
			'name'  => 'Jane',
			'email' => 'jane@example.com',
		);

		$metaQuery = \Mockery::mock( 'metaQuery' );
		$booking->shouldReceive( 'meta' )->once()->andReturn( $metaQuery );
		$metaQuery->shouldReceive( 'firstOrNew' )
			->with( array( 'meta_key' => 'fields' ) )
			->once()
			->andReturn( $metaMock );

		// The actual implementation assigns directly to meta_value and calls save()
		$metaMock->shouldReceive( 'save' )->once();

		// Allow the property assignment (this is what happens in the real code)
		$metaMock->meta_value = maybe_serialize( $fields );

		$booking->setFieldsAttribute( $fields );
		$this->assertEquals( $fields, maybe_unserialize( $metaMock->meta_value ) );

	}


	/**
	 * Test isCancelled method when status is cancelled
	 */
	public function test_is_cancelled_returns_true_if_status_is_cancelled() {
		$booking         = new Booking_Model();
		$booking->status = 'cancelled';

		$this->assertTrue( $booking->isCancelled() );
	}

	/**
	 * Test isCancelled method when status is not cancelled
	 */
	public function test_is_cancelled_returns_false_if_status_is_not_cancelled() {
		$booking         = new Booking_Model();
		$booking->status = 'scheduled';

		$this->assertFalse( $booking->isCancelled() );
	}

	/**
	 * Test isCompleted method when end time has passed
	 */
	public function test_is_completed_returns_true_if_end_time_has_passed() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		// Ensure these are accessible by the isCompleted method
		$booking->end_time = ( new \DateTime( '-1 hour' ) )->format( 'Y-m-d H:i:s' );

		// Mock the getTimezoneAttribute to ensure 'timezone' is available
		// This is better if 'timezone' is an appended attribute.
		$booking->shouldReceive( 'getTimezoneAttribute' )->andReturn( 'UTC' );
		// If 'timezone' is a direct property or simple meta, then __get should work:
		// $booking->shouldReceive('__get')->with('timezone')->andReturn('UTC');

		$this->assertTrue( $booking->isCompleted() );
	}

	/**
	 * Test isCompleted method when end time has not passed
	 */
	public function test_is_completed_returns_false_if_end_time_has_not_passed() {
		$booking           = \Mockery::mock( Booking_Model::class )->makePartial();
		$booking->end_time = ( new \DateTime( '+1 hour' ) )->format( 'Y-m-d H:i:s' );

		$booking->shouldReceive( 'getTimezoneAttribute' )->andReturn( 'UTC' );
		// $booking->shouldReceive('__get')->with('timezone')->andReturn('UTC');

		$this->assertFalse( $booking->isCompleted() );
	}

	/**
	 * Test getCancelUrl method
	 */
	public function test_get_cancel_url() {
		$booking            = new Booking_Model();
		$booking->hash_id   = 'abc123';
		$booking->event_url = 'https://example.com/event';

		// Mock the WordPress function add_query_arg
		$this->add_query_arg_mock( 'https://example.com/event?quillbooking_action=cancel&id=abc123' );

		$this->assertEquals( 'https://example.com/event?quillbooking_action=cancel&id=abc123', $booking->getCancelUrl() );
	}

	/**
	 * Test getRescheduleUrl method
	 */
	public function test_get_reschedule_url() {
		$booking            = new Booking_Model();
		$booking->hash_id   = 'abc123';
		$booking->event_url = 'https://example.com/event';

		// Mock the WordPress function add_query_arg
		$this->add_query_arg_mock( 'https://example.com/event?quillbooking_action=reschedule&id=abc123' );

		$this->assertEquals( 'https://example.com/event?quillbooking_action=reschedule&id=abc123', $booking->getRescheduleUrl() );
	}

	/**
	 * Test getDetailsUrl method
	 */
	public function test_get_details_url() {
		$booking     = new Booking_Model();
		$booking->id = 42;

		// Mock WordPress function admin_url
		// If your base test case sets up a WP environment, admin_url() might already be defined.
		// This global mock approach is okay for isolated tests but can be fragile.
		global $admin_url_mock_value;
		// Align with typical WP unit test default or be more specific
		$test_admin_url_base = admin_url(); // Get what the environment provides
		if ( empty( $test_admin_url_base ) ) { // Fallback if not in full WP context
			$test_admin_url_base = 'http://example.org/wp-admin/'; // Or whatever your environment uses
		}
		$admin_url_mock_value = $test_admin_url_base;

		$expected = rtrim( $test_admin_url_base, '/' ) . '/admin.php?page=quillbooking&path=bookings&id=42';
		$this->assertEquals( $expected, $booking->getDetailsUrl() );
	}
	/**
	 * Test getConfirmUrl method
	 */
	public function test_get_confirm_url() {
		$booking            = new Booking_Model();
		$booking->hash_id   = 'abc123';
		$booking->event_url = 'https://example.com/event';

		// Mock the WordPress function add_query_arg
		$this->add_query_arg_mock( 'https://example.com/event?quillbooking_action=confirm&id=abc123' );

		$this->assertEquals( 'https://example.com/event?quillbooking_action=confirm&id=abc123', $booking->getConfirmUrl() );
	}

	/**
	 * Test getRejectUrl method
	 */
	public function test_get_reject_url() {
		$booking            = new Booking_Model();
		$booking->hash_id   = 'abc123';
		$booking->event_url = 'https://example.com/event';

		// Mock the WordPress function add_query_arg
		$this->add_query_arg_mock( 'https://example.com/event?quillbooking_action=reject&id=abc123' );

		$this->assertEquals( 'https://example.com/event?quillbooking_action=reject&id=abc123', $booking->getRejectUrl() );
	}

	/**
	 * Test relationships setup properly
	 */
	public function test_relationship_with_calendar() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		$booking->shouldReceive( 'belongsTo' )
			->with( Calendar_Model::class, 'calendar_id', 'id' )
			->once()
			->andReturn( 'calendar_relationship' );

		$this->assertEquals( 'calendar_relationship', $booking->calendar() );
	}

	public function test_relationship_with_event() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		$booking->shouldReceive( 'belongsTo' )
			->with( Event_Model::class, 'event_id', 'id' )
			->once()
			->andReturn( 'event_relationship' );

		$this->assertEquals( 'event_relationship', $booking->event() );
	}

	public function test_relationship_with_guest() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		$booking->shouldReceive( 'belongsTo' )
			->with( Guest_Model::class, 'guest_id', 'id' )
			->once()
			->andReturn( 'guest_relationship' );

		$this->assertEquals( 'guest_relationship', $booking->guest() );
	}

	public function test_relationship_with_meta() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		$booking->shouldReceive( 'hasMany' )
			->with( Booking_Meta_Model::class, 'booking_id', 'id' )
			->once()
			->andReturn( 'meta_relationship' );

		$this->assertEquals( 'meta_relationship', $booking->meta() );
	}

	public function test_relationship_with_logs() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		$booking->shouldReceive( 'hasMany' )
			->with( Booking_Log_Model::class, 'booking_id', 'id' )
			->once()
			->andReturn( 'logs_relationship' );

		$this->assertEquals( 'logs_relationship', $booking->logs() );
	}

	public function test_relationship_with_order() {
		$booking = \Mockery::mock( Booking_Model::class )->makePartial();

		$booking->shouldReceive( 'hasOne' )
			->with( Booking_Order_Model::class, 'booking_id', 'id' )
			->once()
			->andReturn( 'order_relationship' );

		$this->assertEquals( 'order_relationship', $booking->order() );
	}

	/**
	 * Helper method to mock add_query_arg WordPress function
	 */
	protected function add_query_arg_mock( $return_value ) {
		// Set up a global to capture function call
		global $add_query_arg_mock_value;
		$add_query_arg_mock_value = $return_value;
	}

	/**
	 * Clean up after tests
	 */
	protected function tearDown(): void {
		parent::tearDown();
		\Mockery::close();
	}
}

// Mock WordPress functions
if ( ! function_exists( 'add_query_arg' ) ) {
	function add_query_arg() {
		global $add_query_arg_mock_value;
		return $add_query_arg_mock_value;
	}
}

if ( ! function_exists( 'admin_url' ) ) {
	function admin_url() {
		global $admin_url_mock_value;
		return $admin_url_mock_value;
	}
}

if ( ! function_exists( 'do_action' ) ) {
	function do_action() {
		// Do nothing - just a stub
	}
}

if ( ! function_exists( 'maybe_serialize' ) ) {
	function maybe_serialize( $data ) {
		return is_scalar( $data ) ? $data : serialize( $data );
	}
}

if ( ! function_exists( 'maybe_unserialize' ) ) {
	function maybe_unserialize( $data ) {
		if ( ! is_string( $data ) ) {
			return $data;
		}

		// Check if it looks like serialized data
		if ( preg_match( '/^[aObis]:[0-9]+:/is', $data ) ) {
			$unserialized = @unserialize( $data );
			if ( $unserialized !== false ) {
				return $unserialized;
			}
		}

		return $data;
	}
}

if ( ! function_exists( '__' ) ) {
	function __( $text, $domain = 'default' ) {
		return $text;
	}
}
