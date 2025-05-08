<?php

namespace QuillBooking\Tests\Integrations\Apple;


use phpmock\phpunit\PHPMock;
use phpmock\MockBuilder;
use QuillBooking\Integrations\Apple\Integration;
use QuillBooking\Integrations\Apple\Client;
use QuillBooking\Utils;
use QuillBooking\Integration\Accounts;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Calendar_Model;
use WP_Error;
use DateTime;
use DateTimeZone;
use QuillBooking_Base_Test_Case;

// Replace with your actual base test case if different
// use QuillBooking_Base_Test_Case;

// Assuming QuillBooking_Base_Test_Case extends WP_UnitTestCase or TestCase
class Test_Integration_Integration_Apple extends QuillBooking_Base_Test_Case {

	use PHPMock;

	private const INTEGRATION_NAMESPACE = 'QuillBooking\Integrations\Apple';
	private const UTILS_NAMESPACE       = 'QuillBooking\Utils';

	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock;
	/** @var Client|\PHPUnit\Framework\MockObject\MockObject */
	private $clientMock;
	/** @var Utils|\PHPUnit\Framework\MockObject\MockObject */
	private $utilsMock;

	/** @var Booking_Model|\PHPUnit\Framework\MockObject\MockObject */
	private $bookingMock;
	/** @var Event_Model|\PHPUnit\Framework\MockObject\MockObject */
	private $eventMock;
	/** @var Calendar_Model|\PHPUnit\Framework\MockObject\MockObject */
	private $calendarMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $logMock;
	/** @var \phpmock\Mock */
	private $getOptionMockInstance;


	public function setUp(): void {
		parent::setUp();

		$this->accountsMock = $this->createMock( Accounts::class );
		$this->clientMock   = $this->createMock( Client::class );
		$this->utilsMock    = $this->createMock( Utils::class );

		$this->bookingMock = $this->getMockBuilder( Booking_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_meta', 'update_meta', 'logs' ) )
			->addMethods( array( 'delete_meta' ) )
			->getMock();
		$this->logMock     = $this->getMockBuilder( \stdClass::class )
			->disableOriginalConstructor()
			->addMethods( array( 'create' ) )
			->getMock();
		$this->bookingMock->method( 'logs' )->willReturn( $this->logMock );

		$this->eventMock              = $this->getMockBuilder( Event_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_meta' ) )
			->getMock();
		$this->eventMock->name        = 'Test Event';
		$this->eventMock->description = 'Test Description';

		$this->calendarMock            = $this->getMockBuilder( Calendar_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_meta' ) )
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
		$this->bookingMock->id         = 456;
		$this->bookingMock->calendar   = $this->calendarMock;
		$this->bookingMock->hash_id    = 'booking-hash';
		$this->bookingMock->location   = 'Test Location';

		$this->getOptionMockInstance = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'get_option' );
		$this->getOptionMockInstance->expects( $this->any() )
			->with( 'quillbooking_site_uid', '' )
			->willReturn( 'test-site-uid' );

		$this->getFunctionMock( self::INTEGRATION_NAMESPACE, '__' )
			->expects( $this->any() )->willReturnArgument( 0 );

		$this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'wp_generate_uuid4' )
			->expects( $this->any() )->willReturn( 'mocked-uuid-4' );
	}

	public function tearDown(): void {
		parent::tearDown();
	}

	private function createIntegrationInstance( $connectResult = null ): Integration {
		$integration = $this->getMockBuilder( Integration::class )
			->onlyMethods( array( 'connect', 'set_host' ) )
			->setConstructorArgs( array( $this->utilsMock ) ) // Pass Utils mock
			->getMock();

		$reflection = new \ReflectionClass( $integration );

		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		if ( $connectResult === null ) {
			$integration->method( 'connect' )->willReturn( $this->clientMock );
		} elseif ( $connectResult instanceof \WP_Error || is_null( $connectResult ) || $connectResult === false ) {
			$integration->method( 'connect' )->willReturn( null );
		} else {
			$integration->method( 'connect' )->willReturn( $this->clientMock );
		}

		return $integration;
	}

	public function test_add_event_to_calendars_success() {
		$integration = $this->createIntegrationInstance();

		$host_id                = $this->calendarMock->id;
		$account_id             = 'apple-acc-1';
		$calendar_ids_to_sync   = array( 'cal_id_1', 'cal_id_2' );
		$apple_integration_meta = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$apple_event_id_1       = 'apple-event-uid-1';
		$apple_event_id_2       = 'apple-event-uid-2';
		$apple_event_data_1     = array(
			'UID'     => $apple_event_id_1,
			'SUMMARY' => 'Event 1',
		);
		$apple_event_data_2     = array(
			'UID'     => $apple_event_id_2,
			'SUMMARY' => 'Event 2',
		);
		$account_data           = array( 'credentials' => array( 'apple_id' => 'host@test.com' ) );

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->with( $integration->meta_key )->willReturn( $apple_integration_meta );
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data );

		$this->clientMock->expects( $this->exactly( 2 ) )
			->method( 'create_event' )
			->withConsecutive(
				array( $this->equalTo( $account_id ), $this->equalTo( $calendar_ids_to_sync[0] ), $this->isType( 'array' ) ),
				array( $this->equalTo( $account_id ), $this->equalTo( $calendar_ids_to_sync[1] ), $this->isType( 'array' ) )
			)
			->willReturnOnConsecutiveCalls(
				array(
					'success' => true,
					'data'    => $apple_event_data_1,
				),
				array(
					'success' => true,
					'data'    => $apple_event_data_2,
				)
			);

		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'apple_events_details', array() )
			->willReturnOnConsecutiveCalls( array(), array( $apple_event_id_1 => array( 'event' => $apple_event_data_1 ) ) );
		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'update_meta' )
			->with(
				$this->equalTo( 'apple_events_details' ),
				$this->callback( fn( $meta) => isset( $meta[ $apple_event_id_1 ] ) || isset( $meta[ $apple_event_id_2 ] ) )
			);

		$this->logMock->expects( $this->exactly( 2 ) )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Apple Calendar' ) ) );

		$integration->add_event_to_calendars( $this->bookingMock );
	}

	public function test_add_event_to_calendars_api_fail() {
		$integration            = $this->createIntegrationInstance();
		$host_id                = $this->calendarMock->id;
		$account_id             = 'apple-acc-1';
		$calendar_ids_to_sync   = array( 'cal_id_1' );
		$apple_integration_meta = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$api_error_response     = array(
			'success' => false,
			'data'    => array( 'error' => array( 'message' => 'Create API Error' ) ),
		);
		$account_data           = array( 'credentials' => array( 'apple_id' => 'host@test.com' ) );

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $apple_integration_meta );
		$this->accountsMock->method( 'get_account' )->willReturn( $account_data );
		$this->clientMock->expects( $this->once() )->method( 'create_event' )->willReturn( $api_error_response );

		$this->logMock->expects( $this->once() )->method( 'create' )->with( $this->callback( fn( $log) => $log['type'] === 'error' ) );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$integration->add_event_to_calendars( $this->bookingMock );
	}

	public function test_add_event_to_calendars_connect_fail() {
		$connect_error = new WP_Error( 'conn_fail', 'Connect Failed' );
		$integration   = $this->createIntegrationInstance( $connect_error );

		$host_id                = $this->calendarMock->id;
		$account_id             = 'apple-acc-1';
		$apple_integration_meta = array( $account_id => array( 'config' => array( 'calendars' => array( 'cal_id_1' ) ) ) );

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $apple_integration_meta );

		$this->logMock->expects( $this->once() )->method( 'create' )->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Error connecting' ) ) );
		$this->clientMock->expects( $this->never() )->method( 'create_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$integration->add_event_to_calendars( $this->bookingMock );
	}

	public function test_add_event_to_calendars_host_meta_empty() {
		$integration = $this->createIntegrationInstance();
		$host_id     = $this->calendarMock->id;

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->with( $integration->meta_key )->willReturn( array() );

		$integration->expects( $this->never() )->method( 'connect' );
		$this->logMock->expects( $this->never() )->method( 'create' );
		$this->clientMock->expects( $this->never() )->method( 'create_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$result = $integration->add_event_to_calendars( $this->bookingMock );
		$this->assertSame( $this->bookingMock, $result );
	}

	public function test_add_event_to_calendars_calendars_list_empty() {
		$integration            = $this->createIntegrationInstance();
		$host_id                = $this->calendarMock->id;
		$account_id             = 'apple-acc-1';
		$apple_integration_meta = array( $account_id => array( 'config' => array( 'calendars' => array() ) ) );
		$account_data           = array( 'credentials' => array( 'apple_id' => 'host@test.com' ) );

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $apple_integration_meta );
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data );

		$integration->expects( $this->once() )->method( 'connect' )->with( $host_id, $account_id )->willReturn( $this->clientMock );

		$this->logMock->expects( $this->never() )->method( 'create' );
		$this->clientMock->expects( $this->never() )->method( 'create_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$integration->add_event_to_calendars( $this->bookingMock );
	}


	public function test_remove_event_from_calendars_success() {
		$integration = $this->createIntegrationInstance();

		$host_id              = $this->calendarMock->id;
		$account_id           = 'apple-acc-1';
		$calendar_id          = 'cal_id_1';
		$apple_event_uid      = 'apple-uid-1';
		$apple_events_meta    = array(
			$apple_event_uid => array(
				'event'       => array( 'UID' => $apple_event_uid ),
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_success_response = array( 'success' => true );

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'apple_events_details', array() )->willReturn( $apple_events_meta );
		$this->clientMock->expects( $this->once() )->method( 'delete_event' )->with( $account_id, $calendar_id, $apple_event_uid )->willReturn( $api_success_response );
		$this->bookingMock->expects( $this->once() )->method( 'update_meta' )->with( 'apple_events_details', array() );
		$this->logMock->expects( $this->once() )->method( 'create' )->with( $this->callback( fn( $log) => $log['type'] === 'info' ) );

		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	public function test_remove_event_from_calendars_api_fail() {
		$integration        = $this->createIntegrationInstance();
		$host_id            = $this->calendarMock->id;
		$account_id         = 'apple-acc-1';
		$calendar_id        = 'cal_id_1';
		$apple_event_uid    = 'apple-uid-1';
		$apple_events_meta  = array(
			$apple_event_uid => array(
				'event'       => array( 'UID' => $apple_event_uid ),
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_error_response = array(
			'success' => false,
			'data'    => array( 'error' => array( 'message' => 'Deletion Failed' ) ),
		);

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'apple_events_details', array() )->willReturn( $apple_events_meta );
		$this->clientMock->expects( $this->once() )->method( 'delete_event' )->with( $account_id, $calendar_id, $apple_event_uid )->willReturn( $api_error_response );

		$this->logMock->expects( $this->once() )->method( 'create' )->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Failed to remove event' ) ) );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	public function test_remove_event_from_calendars_meta_empty() {
		$integration = $this->createIntegrationInstance();
		$host_id     = $this->calendarMock->id;

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'apple_events_details', array() )->willReturn( array() );

		$integration->expects( $this->never() )->method( 'connect' );
		$this->logMock->expects( $this->never() )->method( 'create' );
		$this->clientMock->expects( $this->never() )->method( 'delete_event' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$integration->remove_event_from_calendars( $this->bookingMock );
	}


	public function test_reschedule_event_success() {
		$integration = $this->createIntegrationInstance();

		$host_id              = $this->calendarMock->id;
		$account_id           = 'apple-acc-1';
		$calendar_id          = 'cal_id_1';
		$apple_event_uid      = 'apple-uid-1';
		$original_event_data  = array(
			'UID'     => $apple_event_uid,
			'SUMMARY' => 'Original',
		);
		$apple_events_meta    = array(
			$apple_event_uid => array(
				'event'       => $original_event_data,
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_success_response = array(
			'success' => true,
			'data'    => $original_event_data,
		); // Apple update_event returns parsed data

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'apple_events_details', array() )->willReturn( $apple_events_meta );
		$this->clientMock->expects( $this->once() )->method( 'update_event' )
			->with( $account_id, $calendar_id, $this->callback( fn( $data) => $data['DTSTART'] instanceof \DateTimeInterface && $data['DTEND'] instanceof \DateTimeInterface && $data['UID'] === $apple_event_uid ) )
			->willReturn( $api_success_response );
		$this->bookingMock->expects( $this->once() )->method( 'update_meta' )
			->with( 'apple_events_details', $this->callback( fn( $meta) => $meta[ $apple_event_uid ]['event']['DTSTART'] instanceof \DateTimeInterface ) );
		$this->logMock->expects( $this->once() )->method( 'create' )->with( $this->callback( fn( $log) => $log['type'] === 'info' ) );

		$this->bookingMock->expects( $this->exactly( 2 ) )->method( 'get_meta' )
			->with( 'apple_events_details', array() )
			->willReturnOnConsecutiveCalls( $apple_events_meta, $apple_events_meta );

		$integration->reschedule_event( $this->bookingMock );
	}

	public function test_reschedule_event_api_fail() {
		$integration         = $this->createIntegrationInstance();
		$host_id             = $this->calendarMock->id;
		$account_id          = 'apple-acc-1';
		$calendar_id         = 'cal_id_1';
		$apple_event_uid     = 'apple-uid-1';
		$original_event_data = array( 'UID' => $apple_event_uid );
		$apple_events_meta   = array(
			$apple_event_uid => array(
				'event'       => $original_event_data,
				'account_id'  => $account_id,
				'calendar_id' => $calendar_id,
			),
		);
		$api_error_response  = array(
			'success' => false,
			'data'    => array( 'error' => array( 'message' => 'Update Failed' ) ),
		);

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'apple_events_details', array() )->willReturn( $apple_events_meta );
		$this->clientMock->expects( $this->once() )->method( 'update_event' )->willReturn( $api_error_response );

		$this->logMock->expects( $this->once() )->method( 'create' )->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Failed to reschedule' ) ) );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		$integration->reschedule_event( $this->bookingMock );
	}

	public function test_reschedule_event_meta_empty() {
		$integration = $this->createIntegrationInstance();
		$host_id     = $this->calendarMock->id;

		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'apple_events_details', array() )->willReturn( array() );

		$integration->expects( $this->never() )->method( 'connect' );
		$this->clientMock->expects( $this->never() )->method( 'update_event' );

		$integration->reschedule_event( $this->bookingMock );
	}


	public function test_get_available_slots_filters_busy_times() {
		$integration = $this->createIntegrationInstance();

		$host_id                      = $this->calendarMock->id;
		$account_id                   = 'apple-acc-1';
		$calendar_ids_to_sync         = array( 'cal_id_1' );
		$apple_integration_meta       = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$start_date_ts                = strtotime( '2023-11-01 00:00:00' );
		$end_date_ts                  = strtotime( '2023-11-01 23:59:59' );
		$timezone                     = 'America/New_York';
		$this->calendarMock->timezone = $timezone;

		$apple_api_events = array(
			array(
				'UID'     => 'busyEvent1',
				'DTSTART' => '20231101T160000Z',
				'DTEND'   => '20231101T170000Z',
				'TZID'    => 'UTC',
			),
		);
		$cached_data      = array( 'cal_id_1' => $apple_api_events );

		$tz             = new DateTimeZone( 'America/New_York' );
		$input_slots    = array(
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

		$integration->expects( $this->once() )->method( 'set_host' )->with( $this->calendarMock );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $apple_integration_meta );
		$this->accountsMock->method( 'get_cache_data' )->willReturn( $cached_data );

		$result_slots = $integration->get_available_slots( $input_slots, $this->eventMock, $start_date_ts, $end_date_ts, $timezone );

		$this->assertCount( 1, $result_slots );
		$this->assertArrayHasKey( '2023-11-01', $result_slots );
		$this->assertCount( 2, $result_slots['2023-11-01'] );
	}

	public function test_get_account_data_success() {
		$integration            = $this->createIntegrationInstance();
		$host_id                = 123;
		$account_id             = 'apple-acc-1';
		$start_date_ts          = strtotime( '2023-11-01 00:00:00' );
		$end_date_ts            = strtotime( '2023-11-01 23:59:59' );
		$timezone               = 'UTC';
		$calendar_ids_to_sync   = array( 'cal1' );
		$apple_integration_meta = array( $account_id => array( 'config' => array( 'calendars' => $calendar_ids_to_sync ) ) );
		$apple_api_events       = array( array( 'UID' => 'event1' ) );
		$expected_result        = array( 'cal1' => array( array( 'UID' => 'event1' ) ) );

		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		// Also set integration->client because get_account_data uses $this->client
		$clientProp = $reflection->getProperty( 'client' );
		$clientProp->setAccessible( true );
		$clientProp->setValue( $integration, $this->clientMock );

		$this->calendarMock->method( 'get_meta' )->willReturn( $apple_integration_meta );
		$integration->method( 'connect' )->with( $host_id, $account_id )->willReturn( $this->clientMock );
		$this->clientMock->expects( $this->once() )->method( 'get_events' )->with( $account_id, 'cal1', $this->isType( 'string' ), $this->isType( 'string' ) )->willReturn( $apple_api_events );

		$method = $reflection->getMethod( 'get_account_data' );
		$method->setAccessible( true );
		$result = $method->invoke( $integration, $host_id, $account_id, $start_date_ts, $end_date_ts, $timezone );
		$this->assertEquals( $expected_result, $result );
	}

	public function test_connect_success() {
		$integration  = $this->getMockBuilder( Integration::class )->setConstructorArgs( array( $this->utilsMock ) )->onlyMethods( array( 'set_host' ) )->getMock();
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		$host_id                 = 123;
		$account_id              = 'apple-acc-1';
		$account_data_with_creds = array(
			'credentials' => array(
				'apple_id'     => 'test@icloud.com',
				'app_password' => 'app-pass',
			),
		);

		$integration->expects( $this->once() )->method( 'set_host' );
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data_with_creds );

		$result = $integration->connect( $host_id, $account_id );
		$this->assertInstanceOf( Client::class, $result );
	}

	public function test_connect_fails_missing_credentials() {
		$integration  = $this->getMockBuilder( Integration::class )->setConstructorArgs( array( $this->utilsMock ) )->onlyMethods( array( 'set_host' ) )->getMock();
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		$host_id               = 123;
		$account_id            = 'apple-acc-1';
		$account_data_no_creds = array( 'credentials' => array( 'apple_id' => 'test@icloud.com' ) );

		$integration->expects( $this->once() )->method( 'set_host' );
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data_no_creds );

		$result = $integration->connect( $host_id, $account_id );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'missing_credentials', $result->get_error_code() );
	}

	public function test_get_fields_returns_correct_structure() {
		$integration = new Integration( $this->utilsMock );
		$fields      = $integration->get_fields();

		$this->assertIsArray( $fields );
		$this->assertArrayHasKey( 'apple_id', $fields );
		$this->assertArrayHasKey( 'app_password', $fields );
		$this->assertEquals( 'text', $fields['apple_id']['type'] );
		$this->assertEquals( 'password', $fields['app_password']['type'] );
	}

	public function test_get_event_description_formats_correctly() {
		$integration                           = new Integration( $this->utilsMock );
		$this->bookingMock->calendar->timezone = 'America/Denver';

		$description = $integration->get_event_description( $this->bookingMock );

		$this->assertIsString( $description );
		$this->assertStringContainsString( 'Event Detials:', $description );
		$this->assertStringContainsString( '2023-10-27 10:00', $description );
		$this->assertStringContainsString( '(America/Denver)', $description );
	}
}
