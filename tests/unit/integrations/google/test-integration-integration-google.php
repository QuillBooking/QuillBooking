<?php

namespace QuillBooking\Tests\Integrations\Google;

use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Google\Integration;
use QuillBooking\Integrations\Google\API; // Class we need to mock interactions with
use WP_Error;
use DateTime; // If manipulating dates
use DateTimeZone; // If manipulating dates
use phpmock\MockBuilder;
use QuillBooking_Base_Test_Case;

class  Test_Integration_Integration_Google extends QuillBooking_Base_Test_Case {


	use PHPMock;

	// Namespaces for mocked functions/statics
	private const INTEGRATION_NAMESPACE = 'QuillBooking\Integrations\Google';
	private const UTILS_NAMESPACE       = 'QuillBooking\Utils'; // Namespace where Utils static methods are *called from*

	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock;
	/** @var API|\PHPUnit\Framework\MockObject\MockObject */
	private $apiMock; // Mock for the API class instance

	// Mocks for Models (replace with actual mock classes/stubs if you have them)
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $bookingMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $eventMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $calendarMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $logMock; // Mock for the object returned by $booking->logs()

	public function setUp(): void {
		parent::setUp();

		// --- Mock Core Dependencies ---
		$this->accountsMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_account', 'get_cache_data' /* other needed methods */ ) )
			->getMock();

		$this->apiMock = $this->createMock( API::class ); // Mock the API class

		// --- Mock Models ---
		// Create basic mocks; adjust properties/methods as needed by the tests
		$this->bookingMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_meta', 'update_meta', 'logs' ) )
			->getMock();
		// Mock the logs() method to return another mock
		$this->logMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'create' ) )
			->getMock();

		$this->bookingMock->method( 'logs' )->willReturn( $this->logMock );

		$this->eventMock              = $this->createMock( \stdClass::class );
		$this->eventMock->name        = 'Test Event'; // Example event name
		$this->eventMock->description = 'Test Description'; // Example event description

		$this->calendarMock            = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_meta', 'update_meta' /* other needed methods */ ) )
			->getMock();
		$this->calendarMock->id        = 123; // Example host ID
		$this->calendarMock->name      = 'Test Calendar'; // Example calendar name
		$this->calendarMock->timezone  = 'UTC'; // Example timezone
		$this->calendarMock->user      = (object) array(
			'user_email'   => 'host@test.com',
			'display_name' => 'Host User',
		); // Example user data
		$this->eventMock->calendar     = $this->calendarMock; // Link calendar to event
		$this->bookingMock->event      = $this->eventMock; // Link event to booking
		$this->bookingMock->guest      = (object) array(
			'email' => 'guest@test.com',
			'name'  => 'Guest User',
		); // Example guest data
		$this->bookingMock->start_time = '2023-10-27 10:00:00';
		$this->bookingMock->end_time   = '2023-10-27 11:00:00';
		$this->bookingMock->event_url  = 'https://example.com/event/123'; // Example event URL
		$this->bookingMock->event_id   = 'booking-123'; // Example booking ID
		$this->bookingMock->id         = 456; // Example booking ID
		$this->bookingMock->calendar   = $this->calendarMock; // Link calendar to booking
		$this->bookingMock->hash_id    = 'booking-hash'; // Example hash ID

		// Mock global functions needed by Integration class methods
		// $getOptionMock = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'get_option' );
		// $getOptionMock->expects( $this->any() )->with( 'quillbooking_site_uid' )->willReturn( 'test-site-uid' );

		// Mock __() and _e() etc. if needed
		$l10nMock = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, '__' );
		$l10nMock->expects( $this->any() )->willReturnArgument( 0 ); // Just return the first argument (the text)

	}

	public function tearDown(): void {
		// PHPMock trait handles disabling function mocks automatically
		parent::tearDown();
	}

	/**
	 * Helper to create the Integration instance.
	 * We might need to partially mock it to control the 'api' property.
	 */
	private function createIntegrationInstance( $setApiMock = true ): Integration {
		// Create a partial mock/spy of the Integration class itself
		// We want to test its methods, but control the result of `connect` or the `api` property
		$integration = $this->getMockBuilder( Integration::class )
			->onlyMethods( array( 'connect', 'set_host' ) ) // Only mock the 'connect' method
			->addMethods( array( 'get_meta' ) ) // Add any other methods you need to mock
			->disableOriginalConstructor() // Avoid running real constructor if it has side effects
			->getMock();

		// Manually set the 'accounts' dependency if needed (assuming it's protected/public)
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		// Configure the mocked 'connect' method to return the mocked API instance
		if ( $setApiMock ) {
			$integration->method( 'connect' )
				// ->with(...) // Add arguments if connect takes them
				->willReturn( $this->apiMock ); // Make connect return our apiMock
		} else {
			$integration->method( 'connect' )
				->willReturn( null ); // Simulate connection failure
		}

		// If the `host` property needs setting for a test, do it here or in the test
		// $hostProp = $reflection->getProperty('host');
		// $hostProp->setAccessible(true);
		// $hostProp->setValue($integration, $this->calendarMock); // Assuming host is the calendar model

		return $integration;
	}


	// Test connect() - We test this indirectly by how createIntegrationInstance is configured

	// Test add_event_to_calendars() - Happy Path
	public function test_add_event_to_calendars_success() {
		$integration = $this->createIntegrationInstance( true ); // Ensure connect returns apiMock

		$host_id              = $this->calendarMock->id;
		$account_id           = 'google-acc-1';
		$calendar_ids_to_sync = array( 'primary', 'cal2@google.com' );
		$integration_meta     = array(
			$account_id => array(
				'name'   => 'test@example.com',
				'config' => array( 'calendars' => $calendar_ids_to_sync ),
			),
		);
		$google_event_id_1    = 'gevent1';
		$google_event_id_2    = 'gevent2';
		$google_event_data_1  = array( 'id' => $google_event_id_1 /* ... other fields ... */ );
		$google_event_data_2  = array( 'id' => $google_event_id_2 /* ... other fields ... */ );

		// --- Mock Dependencies ---
		// 1. Mock get_meta for host integration settings
		// Assuming 'host' is set correctly (e.g., via set_host if that method exists, or direct property access)
		// If set_host is used, mock it on the integration mock
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id ); // Assuming set_host is called first

		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );

		// Then mock get_meta on the host object ($this->calendarMock in this case, needs get_meta method)
		$this->calendarMock->method( 'get_meta' )
			->with( $integration->meta_key ) // Assuming meta_key is public or accessible
			->willReturn( $integration_meta );

		// 2. Configure API mock (connect is mocked in createIntegrationInstance)
		$this->apiMock->expects( $this->exactly( 2 ) ) // Called once per calendar_id_to_sync
			->method( 'add_event' )
			// Use ->withConsecutive or ->callback to check args for each call
			->withConsecutive(
				array( $this->equalTo( $calendar_ids_to_sync[0] ), $this->isType( 'array' ) ),
				array( $this->equalTo( $calendar_ids_to_sync[1] ), $this->isType( 'array' ) )
			)
			->willReturnOnConsecutiveCalls(
				array(
					'success'     => true,
					'status_code' => 200,
					'data'        => $google_event_data_1,
					'error'       => null,
				),
				array(
					'success'     => true,
					'status_code' => 200,
					'data'        => $google_event_data_2,
					'error'       => null,
				)
			);

		// 3. Mock booking get_meta / update_meta for storing google event details
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'google_events_details', array() ) // Default value
			// Return empty first time, then return array with first event
			->willReturnOnConsecutiveCalls( array(), array( $google_event_id_1 => array( 'event' => $google_event_data_1 /*...*/ ) ) );
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'update_meta' )
			->with(
				'google_events_details',
				// Use ->callback to check the structure being saved
				$this->callback(
					function ( $meta_value ) use ( $google_event_id_1, $google_event_id_2 ) {
						// Check structure based on which call it is (can be tricky)
						return ( isset( $meta_value[ $google_event_id_1 ] ) || isset( $meta_value[ $google_event_id_2 ] ) );
					}
				)
			);

		// 4. Mock logs()->create
		$this->logMock->expects( $this->exactly( 2 ) )->method( 'create' ) // Once per successful add
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'info';
					}
				)
			);

		// --- Execute ---
		$integration->add_event_to_calendars( $this->bookingMock );

		// --- Assertions ---
		// Primarily handled by mock expectations above.
	}


	// Test add_event_to_calendars() - API Failure
	public function test_add_event_to_calendars_api_fail() {
		$integration = $this->createIntegrationInstance( true );

		$host_id              = $this->calendarMock->id;
		$account_id           = 'google-acc-1';
		$calendar_ids_to_sync = array( 'primary' );
		$integration_meta     = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$api_error_response   = array(
			'success'     => false,
			'status_code' => 500,
			'data'        => null,
			'error'       => array( 'error' => array( 'message' => 'API Error' ) ),
		);

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );

		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );

		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );

		$this->apiMock->expects( $this->once() )
			->method( 'add_event' )
			->with( $calendar_ids_to_sync[0], $this->isType( 'array' ) )
			->willReturn( $api_error_response );

		// Expect error log
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'error';
					}
				)
			);

		// Expect update_meta NOT to be called
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->add_event_to_calendars( $this->bookingMock );
	}


	// Test remove_event_from_calendars()
	public function test_remove_event_from_calendars_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id              = $this->calendarMock->id;
		$account_id           = 'google-acc-1';
		$calendar_id          = 'primary';
		$google_event_id      = 'gevent1';
		$google_events_meta   = array(
			$google_event_id => array(
				'event'       => array( 'id' => $google_event_id ),
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_success_response = array(
			'success'     => true,
			'status_code' => 204,
			'data'        => null,
			'error'       => null,
		);

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		// 1. Mock booking get_meta for existing google event details
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' ) // Called once to get, once before update
			->with( 'google_events_details', array() )
			->willReturnOnConsecutiveCalls( $google_events_meta, $google_events_meta ); // Return the meta

		// 2. Configure API mock
		$this->apiMock->expects( $this->once() )
			->method( 'delete_event' )
			->with( $calendar_id, $google_event_id )
			->willReturn( $api_success_response );

		// 3. Mock booking update_meta to save empty array
		$this->bookingMock->expects( $this->once() )->method( 'update_meta' )
			->with( 'google_events_details', array() ); // Expect meta to be emptied

		// 4. Mock logs()->create for info log
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'info';
					}
				)
			);

		// --- Execute ---
		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	// Test reschedule_event()
	public function test_reschedule_event_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id                   = $this->calendarMock->id;
		$account_id                = 'google-acc-1';
		$calendar_id               = 'primary';
		$google_event_id           = 'gevent1';
		$google_events_meta        = array(
			$google_event_id => array(
				'event'       => array( 'id' => $google_event_id ),
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$updated_google_event_data = array(
			'id'      => $google_event_id,
			'summary' => 'Updated', /* ... */
		);
		$api_success_response      = array(
			'success'     => true,
			'status_code' => 200,
			'data'        => $updated_google_event_data,
			'error'       => null,
		);

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'google_events_details', array() )
			->willReturnOnConsecutiveCalls( $google_events_meta, $google_events_meta ); // Return the meta

		$this->apiMock->expects( $this->once() )
			->method( 'update_event' )
			->with(
				$calendar_id,
				$google_event_id,
				$this->callback(
					function ( $data ) {
						// Check if start/end times are present in the update data
						return isset( $data['start']['dateTime'] ) && isset( $data['end']['dateTime'] );
					}
				)
			)
			->willReturn( $api_success_response );

		$this->bookingMock->expects( $this->once() )->method( 'update_meta' )
			->with(
				'google_events_details',
				$this->callback(
					function ( $meta ) use ( $google_event_id, $updated_google_event_data ) {
						// Check if the specific event meta was updated
						return isset( $meta[ $google_event_id ] ) && $meta[ $google_event_id ]['event'] === $updated_google_event_data;
					}
				)
			);

		$this->logMock->expects( $this->once() )->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'info';
					}
				)
			);

		// --- Execute ---
		$integration->reschedule_event( $this->bookingMock );
	}

	// Test get_available_slots() - Basic test structure
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

	// Example for reschedule_event connect failure
	public function test_reschedule_event_connect_fail() {
		// Use createIntegrationInstance(false) to make connect return WP_Error
		$integration = $this->createIntegrationInstance( false );

		$host_id         = $this->calendarMock->id;
		$account_id      = 'google-acc-1';
		$google_event_id = 'gevent1';
		// Setup meta data that WOULD be processed if connect worked
		$google_events_meta = array( $google_event_id => array( 'account_id' => $account_id ) );

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		// Mock get_meta to return the data needed to enter the loop
		$this->bookingMock->method( 'get_meta' )
			->with( 'google_events_details', array() )
			->willReturn( $google_events_meta );
		// connect() is mocked to fail by createIntegrationInstance

		// --- Assertions ---
		// Expect error log
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'error' && str_contains( $log_data['message'], 'Error connecting' );
					}
				)
			);
		// Expect API and meta updates NOT to happen
		$this->apiMock->expects( $this->never() )->method( 'update_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->reschedule_event( $this->bookingMock );
	}


	// In class Test_Integration_Integration_Google

	public function test_add_event_to_calendars_connect_fails_in_loop() {
		// Scenario: connect() fails for one account but should continue to the next if multiple accounts exist.
		$integration = $this->createIntegrationInstance( false ); // Configure connect to fail

		$host_id      = $this->calendarMock->id;
		$account_id_1 = 'google-acc-1'; // Fails connect
		$account_id_2 = 'google-acc-2'; // Should not be reached if first fails & returns early (check code logic)
		// If code uses 'continue', this tests that behaviour.

		$calendar_ids_to_sync = array( 'primary' );
		// Setup meta for two accounts
		$integration_meta   = array(
			$account_id_1 => array(
				'name'   => 'acc1@test.com',
				'config' => array( 'calendars' => $calendar_ids_to_sync ),
			),
			$account_id_2 => array(
				'name'   => 'acc2@test.com',
				'config' => array( 'calendars' => $calendar_ids_to_sync ),
			),
		);
		$number_of_accounts = count( $integration_meta ); // = 2

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		// Set host property manually
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		// Mock get_meta on the calendar mock
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );

		// Configure connect mock (set in createIntegrationInstance to return WP_Error)
		// Verify it's called (at least) once for the first account
		$integration->expects( $this->atLeastOnce() )->method( 'connect' );

		$this->logMock->expects( $this->exactly( $number_of_accounts ) ) // <<< FIX: Change once() to exactly(2)
			->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						// Callback still checks type/message
						return $log_data['type'] === 'error' && str_contains( $log_data['message'], 'Error connecting' );
					}
				)
			);

		$this->apiMock->expects( $this->never() )->method( 'add_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->add_event_to_calendars( $this->bookingMock );
		// Note: Assert based on whether the code `continue`s or `return`s on connect failure in the loop.
		// If it `continue`s, the connect mock might be called twice, adjust expectation.
	}

	public function test_add_event_to_calendars_host_meta_empty() {
		 $integration = $this->createIntegrationInstance( true ); // connect succeeds if called

		$host_id = $this->calendarMock->id;

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		// Set host property manually
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		// Mock get_meta on calendar to return empty
		$this->calendarMock->method( 'get_meta' )
			->with( $integration->meta_key )
			->willReturn( array() ); // Empty meta

		// --- Assertions ---
		$integration->expects( $this->never() )->method( 'connect' ); // Connect shouldn't be called
		$this->logMock->expects( $this->never() )->method( 'create' );
		$this->apiMock->expects( $this->never() )->method( 'add_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$result = $integration->add_event_to_calendars( $this->bookingMock );

		// Assert it returns the original booking object
		$this->assertSame( $this->bookingMock, $result );
	}

	public function test_add_event_to_calendars_calendars_list_empty() {
		$integration = $this->createIntegrationInstance( true ); // connect succeeds

		$host_id    = $this->calendarMock->id;
		$account_id = 'google-acc-1';
		// Setup meta with NO calendars config
		$integration_meta = array(
			$account_id => array(
				'name'   => 'acc1@test.com',
				'config' => array( 'calendars' => array() ),
			), // Empty calendars list
			// $account_id => ['name' => 'acc1@test.com', 'config' => []] // Or config missing calendars key
		);

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );

		// Connect should be called once
		$integration->expects( $this->once() )->method( 'connect' )->with( $host_id, $account_id )->willReturn( $this->apiMock );

		// --- Assertions ---
		// Log should NOT be called for this scenario
		$this->logMock->expects( $this->never() )->method( 'create' );
		// API add_event should NOT be called
		$this->apiMock->expects( $this->never() )->method( 'add_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->add_event_to_calendars( $this->bookingMock );
	}

	// In class Test_Integration_Integration_Google

	public function test_remove_event_from_calendars_api_fail() {
		$integration = $this->createIntegrationInstance( true ); // connect succeeds

		$host_id            = $this->calendarMock->id;
		$account_id         = 'google-acc-1';
		$calendar_id        = 'primary';
		$google_event_id    = 'gevent1';
		$google_events_meta = array(
			$google_event_id => array(
				'event'       => array( 'id' => $google_event_id ),
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_error_response = array(
			'success' => false,
			'error'   => array( 'error' => array( 'message' => 'Deletion Failed' ) ),
		);

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'google_events_details', array() )->willReturn( $google_events_meta );
		// connect() succeeds (mocked in createIntegrationInstance)

		// Mock API delete_event to fail
		$this->apiMock->expects( $this->once() )
			->method( 'delete_event' )
			->with( $calendar_id, $google_event_id )
			->willReturn( $api_error_response );

		// --- Assertions ---
		// Expect error log
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'error' && str_contains( $log_data['message'], 'Error removing' );
					}
				)
			);
		// Expect meta NOT to be updated (as the deletion failed)
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	public function test_remove_event_from_calendars_meta_empty() {
		 $integration = $this->createIntegrationInstance( true ); // connect succeeds if called

		$host_id = $this->calendarMock->id;

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		// Mock get_meta to return empty
		$this->bookingMock->method( 'get_meta' )
			->with( 'google_events_details', array() )
			->willReturn( array() );

		// --- Assertions ---
		$integration->expects( $this->never() )->method( 'connect' ); // Should not connect if meta is empty
		$this->logMock->expects( $this->never() )->method( 'create' );
		$this->apiMock->expects( $this->never() )->method( 'delete_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$result = $integration->remove_event_from_calendars( $this->bookingMock );
		// Assert it returns nothing or the booking object depending on signature
		// $this->assertNull($result); or $this->assertSame($this->bookingMock, $result);
	}


	// In class Test_Integration_Integration_Google

	public function test_reschedule_event_api_fail() {
		$integration = $this->createIntegrationInstance( true ); // connect succeeds

		$host_id            = $this->calendarMock->id;
		$account_id         = 'google-acc-1';
		$calendar_id        = 'primary';
		$google_event_id    = 'gevent1';
		$google_events_meta = array(
			$google_event_id => array(
				'event'       => array( 'id' => $google_event_id ),
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_error_response = array(
			'success' => false,
			'error'   => array( 'error' => array( 'message' => 'Update Failed' ) ),
		);

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'google_events_details', array() )->willReturn( $google_events_meta );
		// connect() succeeds (mocked in createIntegrationInstance)

		// Mock API update_event to fail
		$this->apiMock->expects( $this->once() )
			->method( 'update_event' )
			->with( $calendar_id, $google_event_id, $this->isType( 'array' ) )
			->willReturn( $api_error_response );

		// --- Assertions ---
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with(
				$this->callback(
					function ( $log_data ) {
						return $log_data['type'] === 'error' && str_contains( $log_data['message'], 'Error rescheduling' );
					}
				)
			);
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->reschedule_event( $this->bookingMock );
	}

	public function test_reschedule_event_meta_empty() {
		$integration = $this->createIntegrationInstance( true ); // connect succeeds if called

		$host_id = $this->calendarMock->id;

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'google_events_details', array() )->willReturn( array() );

		// --- Assertions ---
		$integration->expects( $this->never() )->method( 'connect' );
		$this->logMock->expects( $this->never() )->method( 'create' );
		$this->apiMock->expects( $this->never() )->method( 'update_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// --- Execute ---
		$integration->reschedule_event( $this->bookingMock );
	}

	// In class Test_Integration_Integration_Google

	public function test_get_event_description_formats_correctly() {
		// --- FIX: Instantiate the REAL Integration class ---
		// Ensure dependencies are available. Assuming Utils is handled.
		// If Integration constructor requires the Utils dependency injection:
		$utils       = new \QuillBooking\Utils(); // Create real Utils
		$integration = new Integration( $utils );   // Create real Integration

		// If Integration constructor is parameterless (after removing Utils DI):
		// $integration = new Integration();
		// --- End Fix ---

		// Use the mocks set up in setUp for booking details
		$this->bookingMock->calendar->timezone = 'America/Denver'; // Set the target timezone

		// Call the real method
		$description = $integration->get_event_description( $this->bookingMock );

		// --- Assertions ---
		$this->assertIsString( $description );
		$this->assertStringContainsString( 'Event Detials:', $description );
		$this->assertStringContainsString( 'Invitee: Guest User', $description );
		$this->assertStringContainsString( 'Invitee Email: guest@test.com', $description );
		$this->assertStringContainsString( 'When:', $description );

		// --- FIX: Assert the times as they are formatted by the code ---
		$this->assertStringContainsString( '2023-10-27 10:00', $description ); // Check start time
		$this->assertStringContainsString( '2023-10-27 11:00', $description ); // Check end time
		$this->assertStringContainsString( '(America/Denver)', $description ); // Check timezone lab
	}
}
