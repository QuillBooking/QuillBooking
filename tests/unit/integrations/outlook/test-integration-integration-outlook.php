<?php

namespace QuillBooking\Tests\Integrations\Outlook; // <<< CHANGED Namespace


use phpmock\phpunit\PHPMock;
use phpmock\MockBuilder;
// --- CHANGED Use Statements ---
use QuillBooking\Integrations\Outlook\Integration; // Target class
use QuillBooking\Integrations\Outlook\API;         // Outlook API class
// --- End Changes ---
use WP_Error;
use DateTime;
use DateTimeZone;
use QuillBooking\Utils;
use QuillBooking_Base_Test_Case; // Using your base class

// --- Test Class Name Changed ---
class Test_Integration_Integration_Outlook extends QuillBooking_Base_Test_Case {

	use PHPMock;

	// --- CHANGED Namespaces ---
	private const INTEGRATION_NAMESPACE = 'QuillBooking\Integrations\Outlook';
	private const UTILS_NAMESPACE       = 'QuillBooking\Utils'; // Namespace where Utils is defined
	// --- End Changes ---

	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock;
	/** @var API|\PHPUnit\Framework\MockObject\MockObject */ // <<< CHANGE Type hint
	private $apiMock; // Mock for the Outlook API class instance
	/** @var Utils|\PHPUnit\Framework\MockObject\MockObject */ // <<< ADDED for Utils DI
	private $utilsMock;

	// Mocks for Models
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $bookingMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $eventMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $calendarMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $logMock;

	public function setUp(): void {
		parent::setUp();

		// Mock Core Dependencies
		$this->accountsMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_account', 'get_cache_data' ) )
			->getMock();

		$this->apiMock = $this->createMock( API::class ); // <<< MOCK Outlook API

		$this->utilsMock = $this->createMock( Utils::class ); // <<< CREATE Utils Mock

		// Mock Models
		$this->bookingMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_meta', 'update_meta', 'logs' ) )
			->getMock();
		$this->logMock     = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'create' ) )
			->getMock();
		$this->bookingMock->method( 'logs' )->willReturn( $this->logMock );

		$this->eventMock              = $this->createMock( \stdClass::class );
		$this->eventMock->name        = 'Test Event';
		$this->eventMock->description = 'Test Description';

		$this->calendarMock            = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_meta', 'update_meta' ) )
			->getMock();
		$this->calendarMock->id        = 123;
		$this->calendarMock->name      = 'Test Calendar';
		$this->calendarMock->timezone  = 'UTC';
		$this->calendarMock->user      = (object) array(
			'user_email'   => 'host@test.com',
			'display_name' => 'Host User',
		);
		$this->eventMock->calendar     = $this->calendarMock;
		$this->bookingMock->event      = $this->eventMock;
		$this->bookingMock->guest      = (object) array(
			'email' => 'guest@test.com',
			'name'  => 'Guest User',
		);
		$this->bookingMock->start_time = '2023-10-27 10:00:00';
		$this->bookingMock->end_time   = '2023-10-27 11:00:00';
		$this->bookingMock->event_url  = 'https://example.com/event/123';
		$this->bookingMock->id         = 456;
		$this->bookingMock->calendar   = $this->calendarMock;
		$this->bookingMock->hash_id    = 'booking-hash'; // Used in transactionId

		// Mock global functions
		// get_option needed for get_site_uid
		// Use stored mock instance pattern if needed by multiple tests
		$this->getOptionMockInstance = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'get_option' );
		$this->getOptionMockInstance->expects( $this->any() )
			->with( 'quillbooking_site_uid', '' )
			->willReturn( 'test-site-uid' ); // Default UID

		$l10nMock = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, '__' );
		$l10nMock->expects( $this->any() )->willReturnArgument( 0 );

		// Mock array_filter used in add_event_to_calendars (basic mock)
		// Note: This mocks the *global* array_filter. Be cautious if other code relies on it differently.
		// If the Integration class uses Illuminate\Support\Arr::where or similar, mock that instead if possible.
		$arrayFilterMock = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'array_filter' );
		$arrayFilterMock->expects( $this->any() )
			->willReturnCallback(
				function ( $array, $callback = null ) {
					if ( $callback ) {
						return array_filter( $array, $callback, ARRAY_FILTER_USE_BOTH ); // Use real filter usually
					}
					return array_filter( $array ); // Use real filter for basic empty removal
				}
			);
	}

	public function tearDown(): void {
		parent::tearDown();
	}

	/**
	 * Helper to create the Integration instance.
	 */
	private function createIntegrationInstance( $setApiMock = true ): Integration {
		// --- Mock the target Outlook Integration ---
		$integration = $this->getMockBuilder( Integration::class )
			->onlyMethods( array( 'connect', 'set_host' ) ) // Mock methods that interact externally or have complex setup
			// --- Pass MOCKED Utils dependency to constructor ---
			->setConstructorArgs( array( $this->utilsMock ) )
			// ->disableOriginalConstructor() // Allow constructor to run to set up $app, $utils etc.
			->getMock();

		// Manually set the 'accounts' dependency
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		// Inject App mock if needed (assuming App has simple constructor)
		$appMock = $this->createMock( \QuillBooking\Integrations\Outlook\App::class );
		$appProp = $reflection->getProperty( 'app' );
		$appProp->setAccessible( true );
		$appProp->setValue( $integration, $appMock );

		// Configure the mocked 'connect' method
		if ( $setApiMock ) {
			$integration->method( 'connect' )->willReturn( $this->apiMock );
		} else {
			// Return null, false, or WP_Error based on what connect() failure means
			$integration->method( 'connect' )->willReturn( null ); // Simulate connection failure (e.g., no tokens)
		}

		return $integration;
	}


	// --- Test Cases ---

	// Test add_event_to_calendars() - Happy Path
	public function test_add_event_to_calendars_success() {
		$integration = $this->createIntegrationInstance( true ); // connect returns apiMock

		$host_id              = $this->calendarMock->id;
		$account_id           = 'outlook-acc-1';
		$calendar_ids_to_sync = array( 'primary_cal_id', 'secondary_cal_id' );
		$integration_meta     = array(
			$account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ),
		);
		$outlook_event_id_1   = 'outlookevent1';
		$outlook_event_id_2   = 'outlookevent2';
		$outlook_event_data_1 = array(
			'id'      => $outlook_event_id_1,
			'subject' => 'Event 1',
		);
		$outlook_event_data_2 = array(
			'id'      => $outlook_event_id_2,
			'subject' => 'Event 2',
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->with( $integration->meta_key )->willReturn( $integration_meta );

		// Configure API mock for Outlook's create_event
		$this->apiMock->expects( $this->exactly( 2 ) )
			->method( 'create_event' ) // <<< CHANGED method name
			->withConsecutive(
				array( $this->equalTo( $calendar_ids_to_sync[0] ), $this->isType( 'array' ) ),
				array( $this->equalTo( $calendar_ids_to_sync[1] ), $this->isType( 'array' ) )
			)
			->willReturnOnConsecutiveCalls(
				array(
					'success' => true,
					'data'    => $outlook_event_data_1,
				),
				array(
					'success' => true,
					'data'    => $outlook_event_data_2,
				)
			);

		// Mock booking meta operations (using outlook key)
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'outlook_events_details', array() ) // <<< CHANGED meta key
			->willReturnOnConsecutiveCalls( array(), array( $outlook_event_id_1 => array( 'event' => $outlook_event_data_1 /*...*/ ) ) );
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'update_meta' )
			->with(
				$this->equalTo( 'outlook_events_details' ), // <<< CHANGED meta key
				$this->callback(
					function ( $meta_value ) use ( $outlook_event_id_1, $outlook_event_id_2 ) {
						return ( isset( $meta_value[ $outlook_event_id_1 ] ) || isset( $meta_value[ $outlook_event_id_2 ] ) );
					}
				)
			);

		// Mock logs
		$this->logMock->expects( $this->exactly( 2 ) )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Outlook Calendar' ) ) ); // <<< CHANGED message check

		$this->bookingMock->location = 'Test Location'; // Mock location for event data
		// Execute
		$integration->add_event_to_calendars( $this->bookingMock );
	}

	// Test add_event_to_calendars() - API Failure
	public function test_add_event_to_calendars_api_fail() {
		$integration = $this->createIntegrationInstance( true );

		$host_id              = $this->calendarMock->id;
		$account_id           = 'outlook-acc-1';
		$calendar_ids_to_sync = array( 'primary_cal_id' );
		$integration_meta     = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$api_error_response   = array(
			'success' => false,
			'data'    => array( 'error' => array( 'message' => 'API Error' ) ),
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );

		// Configure API mock for create_event to fail
		$this->apiMock->expects( $this->once() )
			->method( 'create_event' ) // <<< CHANGED method name
			->with( $calendar_ids_to_sync[0], $this->isType( 'array' ) )
			->willReturn( $api_error_response );

		// Expect error log
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Outlook Calendar' ) ) ); // <<< CHANGED message check

		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$this->bookingMock->location = 'Test Location'; // Mock location for event data

		// Execute
		$integration->add_event_to_calendars( $this->bookingMock );
	}

	// Test remove_event_from_calendars()
	public function test_remove_event_from_calendars_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id              = $this->calendarMock->id;
		$account_id           = 'outlook-acc-1';
		$outlook_event_id     = 'outlookevent1';
		$outlook_events_meta  = array(
			$outlook_event_id => array( 'account_id' => $account_id ), // Simplified meta
		);
		$api_success_response = array( 'success' => true );

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )
			->with( 'outlook_events_details', array() ) // <<< CHANGED meta key
			->willReturn( $outlook_events_meta );

		// Configure API mock for delete_event (Outlook version takes only event_id)
		$this->apiMock->expects( $this->once() )
			->method( 'delete_event' ) // <<< CHECK API method signature
			->with( $outlook_event_id ) // <<< CHANGED arguments
			->willReturn( $api_success_response );

		// Mock booking meta update
		$this->bookingMock->expects( $this->once() )->method( 'update_meta' )
			->with( 'outlook_events_details', array() ); // <<< CHANGED meta key, expect empty

		// Mock logs
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Outlook Calendar' ) ) ); // <<< CHANGED message check

		// Need to mock get_meta again because Arr::forget calls it internally before update_meta
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'outlook_events_details', array() )
			->willReturnOnConsecutiveCalls( $outlook_events_meta, $outlook_events_meta );

		// Execute
		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	// Test remove_event_from_calendars() - API Failure
	public function test_remove_event_from_calendars_api_fail() {
		$integration = $this->createIntegrationInstance( true );

		$host_id             = $this->calendarMock->id;
		$account_id          = 'outlook-acc-1';
		$outlook_event_id    = 'outlookevent1';
		$outlook_events_meta = array( $outlook_event_id => array( 'account_id' => $account_id ) );
		$api_error_response  = array(
			'success' => false,
			'data'    => array( 'error' => array( 'message' => 'Deletion Failed' ) ),
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'outlook_events_details', array() )->willReturn( $outlook_events_meta );

		$this->apiMock->expects( $this->once() )
			->method( 'delete_event' )
			->with( $outlook_event_id )
			->willReturn( $api_error_response );

		// Assertions
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Error removing event from Outlook' ) ) );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// Execute
		$integration->remove_event_from_calendars( $this->bookingMock );
	}


	// Test reschedule_event()
	public function test_reschedule_event_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id                    = $this->calendarMock->id;
		$account_id                 = 'outlook-acc-1';
		$calendar_id                = 'primary_cal_id'; // Used only in meta value?
		$outlook_event_id           = 'outlookevent1';
		$outlook_events_meta        = array(
			$outlook_event_id => array(
				'event'       => array( 'id' => $outlook_event_id ), // Old event data
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id, // Not used by Outlook update?
			),
		);
		$updated_outlook_event_data = array(
			'id'      => $outlook_event_id,
			'subject' => 'Updated Subject',
		);
		$api_success_response       = array(
			'success' => true,
			'data'    => $updated_outlook_event_data,
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		// Mock get_meta for outlook_events_details
		$this->bookingMock->method( 'get_meta' )
			->with( 'outlook_events_details', array() ) // <<< CHANGED meta key
			->willReturn( $outlook_events_meta );

		// Configure API mock for update_event
		$this->apiMock->expects( $this->once() )
			->method( 'update_event' )
			// Outlook API might take calendar_id, event_id, data - CHECK signature
			->with( $calendar_id, $outlook_event_id, $this->isType( 'array' ) ) // <<< Assuming same signature as Google for now
			->willReturn( $api_success_response );

		// Mock booking update_meta
		$this->bookingMock->expects( $this->once() )->method( 'update_meta' )
			->with(
				'outlook_events_details', // <<< CHANGED meta key
				$this->callback(
					function ( $meta ) use ( $outlook_event_id, $updated_outlook_event_data ) {
						// Check the event part was updated
						return isset( $meta[ $outlook_event_id ]['event'] ) && $meta[ $outlook_event_id ]['event'] === $updated_outlook_event_data;
					}
				)
			);

		// Mock logs
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Outlook Calendar' ) ) );

		// Need get_meta called twice - once at start, once before update
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'outlook_events_details', array() )
			->willReturnOnConsecutiveCalls( $outlook_events_meta, $outlook_events_meta ); // Return meta twice

		// Execute
		$integration->reschedule_event( $this->bookingMock );
	}


	public function test_get_available_slots_filters_busy_times() {
		$integration = $this->createIntegrationInstance( true );

		$host_id                      = $this->calendarMock->id;
		$account_id                   = 'google-acc-1';
		$calendar_ids_to_sync         = array( 'primary' );
		$integration_meta             = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$start_date_ts                = strtotime( '2023-11-01 00:00:00' );
		$end_date_ts                  = strtotime( '2023-11-01 23:59:59' );
		$timezone                     = 'America/New_York';
		$this->calendarMock->timezone = $timezone; // Set timezone on mock

		// Example busy slot from Google API (FreeBusy response format)
		$google_busy_slots     = array(
			'calendars' => array(
				'primary' => array(
					'busy' => array(
						array(
							'start' => '2023-11-01T16:00:00Z',
							'end'   => '2023-11-01T17:00:00Z',
						), // 11am-12pm in New York (ET is UTC-5 usually, but DST complicates) - let's assume 12pm-1pm ET for simplicity
					),
				),
			),
		);
		$api_freebusy_response = array(
			'success' => true,
			'data'    => $google_busy_slots,
		);

		$tz          = new DateTimeZone( 'America/New_York' );
		$input_slots = array(
			'2023-11-01' => array(
				array(
					'start' => ( new DateTime( '2023-11-01 09:00:00', $tz ) )->getTimestamp(),
					'end'   => ( new DateTime( '2023-11-01 10:00:00', $tz ) )->getTimestamp(),
				),
				array(
					'start' => ( new DateTime( '2023-11-01 12:00:00', $tz ) )->getTimestamp(),
					'end'   => ( new DateTime( '2023-11-01 13:00:00', $tz ) )->getTimestamp(),
				),
				array(
					'start' => ( new DateTime( '2023-11-01 14:00:00', $tz ) )->getTimestamp(),
					'end'   => ( new DateTime( '2023-11-01 15:00:00', $tz ) )->getTimestamp(),
				),
			),
		);

		// Expected output slots (12pm slot removed)
		$expected_slots = array(
			'2023-11-01' => array(
				array(
					'start' => ( new DateTime( '2023-11-01 09:00:00', $tz ) )->getTimestamp(),
					'end'   => ( new DateTime( '2023-11-01 10:00:00', $tz ) )->getTimestamp(),
				),
				array(
					'start' => ( new DateTime( '2023-11-01 14:00:00', $tz ) )->getTimestamp(),
					'end'   => ( new DateTime( '2023-11-01 15:00:00', $tz ) )->getTimestamp(),
				),
			),
		);

		// --- Mock Dependencies ---
		$integration->method( 'connect' )->willReturn( $this->apiMock );
		$integration->expects( $this->once() )->method( 'set_host' )->with( $this->calendarMock );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );
		$this->accountsMock->method( 'get_cache_data' )
			->willReturn(
				array(
					'primary' => array(
						array(
							'start' => array( 'dateTime' => '2023-11-01T12:00:00-04:00' ),
							'end'   => array( 'dateTime' => '2023-11-01T13:00:00-04:00' ),
						),
					),
				)
			);

		// --- Execute ---
		// Note: Event object passed here is simplified for the test
		$result_slots = $integration->get_available_slots( $input_slots, $this->eventMock, $start_date_ts, $end_date_ts, $timezone );

		// --- Assertions ---
		// Need careful comparison, potentially comparing timestamps
		$this->assertCount( 1, $result_slots ); // Only one date key should remain
		$this->assertArrayHasKey( '2023-11-01', $result_slots );
		$this->assertCount( 2, $result_slots['2023-11-01'] ); // Two slots should remain for the date
		// Optionally compare exact timestamps
		$this->assertEquals( $expected_slots['2023-11-01'][0]['start'], $result_slots['2023-11-01'][0]['start'] );
		$this->assertEquals( $expected_slots['2023-11-01'][1]['start'], $result_slots['2023-11-01'][1]['start'] );
	}

	// --- ADD Tests for get_account_data ---
	public function test_get_account_data_success() {
		// Cannot test protected methods directly without reflection or making it public temporarily
		// Alternatively, test its effects via get_available_slots (as done above)

		// If testing directly using reflection:
		$integration = $this->createIntegrationInstance( true ); // connect returns apiMock

		$host_id              = 123;
		$account_id           = 'outlook-acc-1';
		$start_date_ts        = strtotime( '2023-11-01 00:00:00' );
		$end_date_ts          = strtotime( '2023-11-01 23:59:59' );
		$timezone             = 'UTC';
		$calendar_ids_to_sync = array( 'cal1' );
		$integration_meta     = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$outlook_api_events   = array( 'value' => array( array( 'id' => 'event1' ) ) ); // Simplified event data
		$api_events_response  = array(
			'success' => true,
			'data'    => $outlook_api_events,
		);
		$expected_result      = array( 'cal1' => array( array( 'id' => 'event1' ) ) ); // Expect calendar_id as key, value as events

		// Mock dependencies needed by get_account_data
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock ); // Set host
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );
		$integration->method( 'connect' )->with( $host_id, $account_id )->willReturn( $this->apiMock ); // Mock connect
		// $this->utilsMock->expects( $this->exactly( 2 ) )->method( 'create_date_time' )->willReturn( new DateTime() ); // Mock date time creation
		$this->apiMock->expects( $this->once() )->method( 'get_events' )->with( 'cal1', $this->isType( 'array' ) )->willReturn( $api_events_response ); // Mock API call

		// Use reflection to call the protected method
		$method = $reflection->getMethod( 'get_account_data' );
		$method->setAccessible( true );
		$result = $method->invoke( $integration, $host_id, $account_id, $start_date_ts, $end_date_ts, $timezone );

		$this->assertEquals( $expected_result, $result );
	}

} // End Test Class
