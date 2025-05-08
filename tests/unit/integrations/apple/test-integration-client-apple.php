<?php

namespace QuillBooking\Tests\Integrations\Apple;

use WP_UnitTestCase; // Or PHPUnit\Framework\TestCase
use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Apple\Client as AppleClient; // Alias the class under test
use QuillBooking_Base_Test_Case;
use Sabre\DAV\Client as SabreDAV_Client; // Class to mock

class Test_Integration_Client_Apple extends QuillBooking_Base_Test_Case {


	// Or extends TestCase

	use PHPMock;

	// Define realistic Apple ID and Password for tests (doesn't need to be real)
	private const TEST_APPLE_ID = 'tester@icloud.com';
	private const TEST_PASSWORD = 'abcd-efgh-ijkl-mnop';

	/**
	 * Mock for the Sabre\DAV\Client
	 *
	 * @var SabreDAV_Client|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $sabreClientMock;

	public function setUp(): void {
		parent::setUp();

		// Create the mock for the SabreDAV client
		$this->sabreClientMock = $this->createMock( SabreDAV_Client::class );

		// Mock global functions used by the Apple Client
		// Mock __() used for error messages
		$this->getFunctionMock( 'QuillBooking\Integrations\Apple', '__' )
			->expects( $this->any() )->willReturnArgument( 0 );

		// Mock base64_encode used for Authorization header (usually not needed, but good practice)
		// Ensure it returns the expected value for our test credentials
		$expectedAuth = base64_encode( self::TEST_APPLE_ID . ':' . self::TEST_PASSWORD );
		$this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'base64_encode' )
			->expects( $this->any() )
			->with( self::TEST_APPLE_ID . ':' . self::TEST_PASSWORD )
			->willReturn( $expectedAuth );

		// Mock simplexml_load_string used in get_events
		$this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'simplexml_load_string' )
			->expects( $this->any() ) // Needs to be configured per test or use willReturnCallback
			->willReturnCallback(
				function ( $string, $class = 'SimpleXMLElement', $options = 0, $ns = '', $is_prefix = false ) {
					// Prevent errors with empty strings, return false as real function would
					if ( empty( $string ) ) {
						return false;
					}
					// Use actual function for valid XML to allow tests to provide XML
					libxml_use_internal_errors( true ); // Suppress potential warnings in tests
					$xml = simplexml_load_string( $string, $class, $options, $ns, $is_prefix );
					libxml_clear_errors();
					libxml_use_internal_errors( false );
					return $xml;
				}
			);
	}

	/**
	 * Helper to create an instance and inject the SabreDAV mock.
	 *
	 * @return AppleClient
	 */
	private function createAndPrepareClientInstance(): AppleClient {
		// 1. Create the actual Client object
		$appleClient = new AppleClient( self::TEST_APPLE_ID, self::TEST_PASSWORD );

		// 2. Use Reflection to replace the internal SabreDAV client with our mock
		$reflection = new \ReflectionClass( AppleClient::class );
		$clientProp = $reflection->getProperty( 'client' );
		$clientProp->setAccessible( true );
		$clientProp->setValue( $appleClient, $this->sabreClientMock );

		return $appleClient;
	}

	// --- Test get_calendars() ---

	public function test_get_calendars_success() {
		$appleClient   = $this->createAndPrepareClientInstance();
		$principalUrl  = '/123456789/principal/';
		$calendarHome  = '/123456789/calendars/';
		$testAccountId = '123456789'; // Extracted from URL

		// Mock responses for the propFind calls
		$mockPrincipalResponse = array(
			'{DAV:}current-user-principal' => array( array( 'value' => $principalUrl ) ),
		);
		$mockHomeSetResponse   = array(
			'{urn:ietf:params:xml:ns:caldav}calendar-home-set' => array( array( 'value' => $calendarHome ) ),
		);
		$mockCalendarsResponse = array(
			// Base calendar path (skipped)
			$calendarHome                         => array(),
			// Actual calendars
			$calendarHome . 'calendar1/'          => array(
				'{DAV:}displayname' => 'Home',
				'{http://apple.com/ns/ical/}calendar-color' => '#FF0000',
			),
			$calendarHome . 'work-calendar-uuid/' => array(
				'{DAV:}displayname' => 'Work',
				// Missing color property
			),
			$calendarHome . 'another/'            => array( // Missing displayname
				'{http://apple.com/ns/ical/}calendar-color' => '#00FF00',
			),
		);

		// Configure SabreDAV mock expectations
		$this->sabreClientMock->expects( $this->exactly( 3 ) )
			->method( 'propFind' )
			->withConsecutive(
				array( $this->equalTo( '/' ), $this->equalTo( array( '{DAV:}current-user-principal' ) ), $this->equalTo( 0 ) ),
				array( $this->equalTo( $principalUrl ), $this->equalTo( array( '{urn:ietf:params:xml:ns:caldav}calendar-home-set' ) ), $this->equalTo( 0 ) ),
				array( $this->equalTo( $calendarHome ), $this->equalTo( array( '{DAV:}displayname', '{http://apple.com/ns/ical/}calendar-color' ) ), $this->equalTo( 1 ) )
			)
			->willReturnOnConsecutiveCalls(
				$mockPrincipalResponse,
				$mockHomeSetResponse,
				$mockCalendarsResponse
			);

		// Expected result structure
		$expectedResult = array(
			'account_id' => $testAccountId,
			'calendars'  => array(
				'calendar1'          => array(
					'name'  => 'Home',
					'color' => '#FF0000',
				),
				'work-calendar-uuid' => array(
					'name'  => 'Work',
					'color' => null,
				),
				'another'            => array(
					'name'  => 'Unnamed Calendar',
					'color' => '#00FF00',
				),
			),
		);

		// Execute
		$result = $appleClient->get_calendars();

		// Assert
		$this->assertEquals( $expectedResult, $result );
	}

	public function test_get_calendars_principal_not_found() {
		$appleClient           = $this->createAndPrepareClientInstance();
		$mockPrincipalResponse = array(); // Simulate principal not found

		$this->sabreClientMock->expects( $this->once() )
			->method( 'propFind' )
			->with( '/', array( '{DAV:}current-user-principal' ), 0 )
			->willReturn( $mockPrincipalResponse );

		$result = $appleClient->get_calendars();
		$this->assertEquals( array(), $result );
	}

	public function test_get_calendars_home_set_not_found() {
		$appleClient           = $this->createAndPrepareClientInstance();
		$principalUrl          = '/123456789/principal/';
		$mockPrincipalResponse = array( '{DAV:}current-user-principal' => array( array( 'value' => $principalUrl ) ) );
		$mockHomeSetResponse   = array(); // Simulate home set not found

		$this->sabreClientMock->expects( $this->exactly( 2 ) )
			->method( 'propFind' )
			->withConsecutive(
				array( $this->equalTo( '/' ), $this->anything(), $this->anything() ),
				array( $this->equalTo( $principalUrl ), $this->anything(), $this->anything() )
			)
			->willReturnOnConsecutiveCalls( $mockPrincipalResponse, $mockHomeSetResponse );

		$result = $appleClient->get_calendars();
		$this->assertEquals( array(), $result );
	}


	// --- Test get_events() ---

	public function test_get_events_success() {
		$appleClient = $this->createAndPrepareClientInstance();
		$accountId   = '123';
		$calendarId  = 'cal1';
		$start       = '20231027T000000Z';
		$end         = '20231028T000000Z';
		$calendarUrl = "/$accountId/calendars/$calendarId/";

		// Sample iCal data for two events
		$icalData1 = <<<ICAL
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sabre//Sabre VObject 4.1.6//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:event1-uid
DTSTAMP:20231027T100000Z
DTSTART:20231027T120000Z
DTEND:20231027T130000Z
SUMMARY:Event One
END:VEVENT
END:VCALENDAR
ICAL;
		$icalData2 = <<<ICAL
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sabre//Sabre VObject 4.1.6//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:event2-uid
DTSTAMP:20231027T150000Z
DTSTART:20231027T160000Z
DTEND:20231027T170000Z
SUMMARY:Event Two
DESCRIPTION:Notes here
END:VEVENT
END:VCALENDAR
ICAL;

		// Sample XML response body for the REPORT request
		$xmlResponseBody    = <<<XML
<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">
<response>
<propstat>
<prop>
<calendar-data xmlns="urn:ietf:params:xml:ns:caldav">$icalData1</calendar-data>
</prop>
</propstat>
</response>
<response>
<propstat>
<prop>
<calendar-data xmlns="urn:ietf:params:xml:ns:caldav">$icalData2</calendar-data>
</prop>
</propstat>
</response>
</multistatus>
XML;
		$mockReportResponse = array(
			'body'       => $xmlResponseBody,
			'statusCode' => 207,
		);
		// Configure SabreDAV mock for the REPORT request
		$this->sabreClientMock->expects( $this->once() )
			->method( 'request' )
			->with(
				$this->equalTo( 'REPORT' ),
				$this->equalTo( $calendarUrl ),
				$this->stringContains( '<C:calendar-query' ), // Check body contains expected XML root
				$this->equalTo( array( 'Depth' => 1 ) ) // Check headers
			)
			->willReturn( $mockReportResponse );

		// Expected result (parsed VEVENT properties)
		$expectedEvents = array(
			array(
				'UID'     => 'event1-uid',
				'DTSTAMP' => '20231027T100000Z',
				'DTSTART' => '20231027T120000Z',
				'DTEND'   => '20231027T130000Z',
				'SUMMARY' => 'Event One',
			),
			array(
				'UID'         => 'event2-uid',
				'DTSTAMP'     => '20231027T150000Z',
				'DTSTART'     => '20231027T160000Z',
				'DTEND'       => '20231027T170000Z',
				'SUMMARY'     => 'Event Two',
				'DESCRIPTION' => 'Notes here',
			),
		);

		// Execute
		$result = $appleClient->get_events( $accountId, $calendarId, $start, $end );

		// Assert
		// Need to convert DateTime objects in result back to strings for comparison if VObject returns them
		$result = array_map(
			function ( $event ) {
				foreach ( $event as $key => $value ) {
					if ( $value instanceof \DateTimeInterface ) {
						// Format based on how VObject outputs common date types (might need adjustment)
						$event[ $key ] = $value->format( \DateTime::RFC3339_EXTENDED ); // Or other consistent format
					}
				}
				return $event;
			},
			$result
		);

		// Compare relevant fields (VObject might add extra things like VERSION, PRODID)
		$this->assertCount( count( $expectedEvents ), $result );
		for ( $i = 0; $i < count( $expectedEvents ); $i++ ) {
			$this->assertArrayHasKey( 'SUMMARY', $result[ $i ] );
			$this->assertEquals( $expectedEvents[ $i ]['SUMMARY'], $result[ $i ]['SUMMARY'] );
			// Add more specific field checks as needed
		}
		// Or assert subset: $this->assertArraySubset($expectedEvents, $result); // Be careful with subset order/completeness
	}

	public function test_get_events_empty_response() {
		$appleClient = $this->createAndPrepareClientInstance();
		// ... define args ...
		$mockReportResponse = array(
			'body'       => '',
			'statusCode' => 207,
		); // Empty body

		$this->sabreClientMock->expects( $this->once() )
			->method( 'request' )
			->with( 'REPORT', $this->anything(), $this->anything(), $this->anything() )
			->willReturn( $mockReportResponse );

		$result = $appleClient->get_events( 'acc', 'cal', 'start', 'end' );
		$this->assertEquals( array(), $result );
	}

	public function test_get_events_invalid_xml() {
		$appleClient = $this->createAndPrepareClientInstance();
		// ... define args ...
		$mockReportResponse = array(
			'body'       => '<invalid xml',
			'statusCode' => 207,
		);

		$this->sabreClientMock->expects( $this->once() )
			->method( 'request' )
			->willReturn( $mockReportResponse );

		// simplexml_load_string mock in setUp handles returning false for invalid XML

		$result = $appleClient->get_events( 'acc', 'cal', 'start', 'end' );
		$this->assertEquals( array(), $result );
	}


	// --- Test create_event() ---

	public function test_create_event_success() {
		$appleClient        = $this->createAndPrepareClientInstance();
		$accountId          = 'acc1';
		$calendarId         = 'cal1';
		$eventData          = array( // Data structure expected by create_event VEVENT creation
			'UID'            => 'new-event-uid-123',
			'SUMMARY'        => 'New Test Event',
			'DTSTART'        => ( new \DateTime( '2023-11-10T10:00:00Z' ) )->format( 'Ymd\THis\Z' ), // Example format VObject might use internally
			'DTEND'          => ( new \DateTime( '2023-11-10T11:00:00Z' ) )->format( 'Ymd\THis\Z' ),
			'ATTENDEES'      => array( // Custom structure for attendees
				array(
					'MAIL' => 'attendee1@test.com',
					'CN'   => 'Attendee One',
				),
			),
			'ORGANIZER'      => 'mailto:org@test.com',
			'ORGANIZER_NAME' => 'Organizer Name',
		);
		$expectedUrl        = "https://caldav.icloud.com/$accountId/calendars/$calendarId/" . $eventData['UID'] . '.ics';
		$expectedAuthHeader = 'Basic ' . base64_encode( self::TEST_APPLE_ID . ':' . self::TEST_PASSWORD );

		// Mock wp_remote_request using PHPMock
		$wpRequestMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_request' );
		$wpRequestMock->expects( $this->once() )
			->with(
				$this->equalTo( $expectedUrl ), // Check URL
				$this->callback(
					function ( $args ) use ( $expectedAuthHeader, $eventData ) {
						$body = $args['body'] ?? '';

						$attendeeMail  = $eventData['ATTENDEES'][0]['MAIL'];
						$attendeeCN    = $eventData['ATTENDEES'][0]['CN'];
						$organizerMail = $eventData['ORGANIZER'];
						$organizerCN   = $eventData['ORGANIZER_NAME'];

						return is_array( $args ) &&
						( $args['method'] ?? null ) === 'PUT' &&
						( $args['headers']['Content-Type'] ?? null ) === 'text/calendar' &&
						( $args['headers']['Authorization'] ?? null ) === $expectedAuthHeader &&
						( $args['headers']['If-None-Match'] ?? null ) === '*' &&
						is_string( $body ) &&
						str_contains( $body, 'BEGIN:VCALENDAR' ) &&
						str_contains( $body, 'UID:' . $eventData['UID'] ) &&
						str_contains( $body, 'SUMMARY:' . $eventData['SUMMARY'] ) &&
						str_contains( $body, 'ATTENDEE' ) &&
						str_contains( $body, 'CN=' . $attendeeCN ) &&
						preg_match( '/mailto:\s*' . preg_quote( $attendeeMail, '/' ) . '/', $body ) &&
						str_contains( $body, 'ORGANIZER' ) &&
						str_contains( $body, 'CN=' . $organizerCN ) &&
						str_contains( $body, $organizerMail );
					}
				)
			)
			->willReturn(
				array(
					'headers'  => array(),
					'body'     => '',
					'response' => array( 'code' => 201 ),
					'cookies'  => array(),
					'filename' => null,
				)
			); // Simulate WP response on success

		// Mock wp_remote_retrieve_response_code
		$responseCodeMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )->willReturn( 201 );

		// Execute
		$result = $appleClient->create_event( $accountId, $calendarId, $eventData );

		// Assert success structure and parsed data
		$this->assertTrue( $result['success'] );
		$this->assertIsArray( $result['data'] );
		$this->assertEquals( $eventData['UID'], $result['data']['UID'] );
		$this->assertEquals( $eventData['SUMMARY'], $result['data']['SUMMARY'] );
		// VObject might parse attendees differently, adjust assertion
		$this->assertArrayHasKey( 'ATTENDEE', $result['data'] );
		$this->assertStringContainsString( 'mailto:attendee1@test.com', $result['data']['ATTENDEE'] );
		$this->assertArrayHasKey( 'ORGANIZER', $result['data'] );
		$this->assertStringContainsString( 'mailto:org@test.com', $result['data']['ORGANIZER'] );
	}

	public function test_create_event_failure() {
		$appleClient = $this->createAndPrepareClientInstance();
		// ... setup args ...
		$eventData = array(
			'UID'            => 'fail-uid', /* other required fields */
			'ATTENDEES'      => array(),
			'ORGANIZER'      => '',
			'ORGANIZER_NAME' => '',
		);

		// Mock wp_remote_request to return non-201
		$wpRequestMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_request' );
		$wpRequestMock->expects( $this->once() )
			->willReturn( array( 'response' => array( 'code' => 400 ) ) ); // Simulate failure

		// Mock wp_remote_retrieve_response_code
		$responseCodeMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )->willReturn( 400 );

		// Execute
		$result = $appleClient->create_event( 'acc', 'cal', $eventData );

		// Assert failure structure
		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Failed to create event', $result['message'] );
	}


	// --- Test update_event() ---

	public function test_update_event_success() {
		$appleClient = $this->createAndPrepareClientInstance();
		$accountId   = 'acc1';
		$calendarId  = 'cal1';
		$eventUid    = 'event-to-update-uid';
		$eventData   = array( // Data for the update
			'UID'     => $eventUid, // UID is crucial
			'SUMMARY' => 'Updated Event Summary',
			'DTSTART' => ( new \DateTime( '2023-11-11T14:00:00Z' ) )->format( 'Ymd\THis\Z' ),
			'DTEND'   => ( new \DateTime( '2023-11-11T15:00:00Z' ) )->format( 'Ymd\THis\Z' ),
			// No attendees/organizer update in this example's data structure
		);
		$calendarUrl        = "/$accountId/calendars/$calendarId/" . $eventUid . '.ics';
		$currentEtag        = '"abcdef12345"';
		$expectedAuthHeader = 'Basic ' . base64_encode( self::TEST_APPLE_ID . ':' . self::TEST_PASSWORD );

		// 1. Mock GET request for ETag using SabreDAV mock
		$mockGetResponse = array(
			'headers'    => array( 'etag' => array( $currentEtag ) ),
			'statusCode' => 200,
			'body'       => 'BEGIN:VCALENDAR...',
		);
		$this->sabreClientMock->expects( $this->once() )
			->method( 'request' )
			->with( 'GET', $this->equalTo( $calendarUrl ) )
			->willReturn( $mockGetResponse );

		// 2. Mock PUT request using wp_remote_request
		$wpRequestMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_request' );
		$wpRequestMock->expects( $this->once() )
			->with(
				$this->stringContains( $calendarUrl ), // Check base URL
				$this->callback(
					function ( $args ) use ( $currentEtag, $expectedAuthHeader, $eventUid ) {
						// Check args array
						return is_array( $args ) &&
							$args['method'] === 'PUT' &&
							isset( $args['headers']['Content-Type'] ) && $args['headers']['Content-Type'] === 'text/calendar' &&
							isset( $args['headers']['Authorization'] ) && $args['headers']['Authorization'] === $expectedAuthHeader &&
							isset( $args['headers']['If-Match'] ) && $args['headers']['If-Match'] === $currentEtag && // Check ETag
							isset( $args['body'] ) && is_string( $args['body'] ) &&
							str_contains( $args['body'], 'BEGIN:VCALENDAR' ) &&
							str_contains( $args['body'], 'UID:' . $eventUid ) &&
							str_contains( $args['body'], 'SUMMARY:Updated Event Summary' ); // Check updated content
					}
				)
			)
			->willReturn( array( 'response' => array( 'code' => 204 ) ) ); // Simulate WP response on success (204 No Content)

		// 3. Mock wp_remote_retrieve_response_code for the PUT
		$responseCodeMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )->willReturn( 204 );

		// Execute
		$result = $appleClient->update_event( $accountId, $calendarId, $eventData );

		// Assert success and parsed data
		$this->assertTrue( $result['success'] );
		$this->assertIsArray( $result['data'] );
		$this->assertEquals( $eventUid, $result['data']['UID'] );
		$this->assertEquals( $eventData['SUMMARY'], $result['data']['SUMMARY'] );
	}

	public function test_update_event_fails_if_no_uid() {
		$appleClient    = $this->createAndPrepareClientInstance();
		$eventDataNoUid = array( 'SUMMARY' => 'No UID Event' );

		$result = $appleClient->update_event( 'acc', 'cal', $eventDataNoUid );

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'UID is required', $result['message'] );
		$this->sabreClientMock->expects( $this->never() )->method( 'request' ); // Ensure Sabre client wasn't called
	}

	public function test_update_event_fails_to_get_etag() {
		$appleClient = $this->createAndPrepareClientInstance();
		$eventData   = array( 'UID' => 'event-uid' /* ... */ );
		$calendarUrl = '/acc/calendars/cal/' . $eventData['UID'] . '.ics';

		// Mock GET request to fail getting ETag
		$mockGetResponse = array(
			'headers'    => array(),
			'statusCode' => 404,
		); // No etag header
		$this->sabreClientMock->expects( $this->once() )
			->method( 'request' )
			->with( 'GET', $calendarUrl )
			->willReturn( $mockGetResponse );

		// Execute
		$result = $appleClient->update_event( 'acc', 'cal', $eventData );

		// Assert
		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Failed to retrieve ETag', $result['message'] );
		// Ensure PUT request wasn't made
		$wpRequestMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_request' );
		$wpRequestMock->expects( $this->never() );
	}

	public function test_update_event_fails_on_put() {
		$appleClient = $this->createAndPrepareClientInstance();
		// ... setup args, eventData, calendarUrl, etag ...
		$eventData   = array( 'UID' => 'event-uid' /* ... */ );
		$calendarUrl = '/acc1/calendars/cal1/' . $eventData['UID'] . '.ics';
		$currentEtag = '"etag123"';

		// Mock GET success
		$mockGetResponse = array(
			'headers'    => array( 'etag' => array( $currentEtag ) ),
			'statusCode' => 200,
		);
		$this->sabreClientMock->method( 'request' )->with( 'GET', $calendarUrl )->willReturn( $mockGetResponse );

		// Mock PUT failure
		$wpRequestMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_request' );
		$wpRequestMock->expects( $this->once() )->willReturn( array( 'response' => array( 'code' => 412 ) ) ); // e.g., Precondition Failed

		$responseCodeMock = $this->getFunctionMock( 'QuillBooking\Integrations\Apple', 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )->willReturn( 412 );

		// Execute
		$result = $appleClient->update_event( 'acc1', 'cal1', $eventData );

		// Assert
		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Failed to update event', $result['message'] );
	}


	// --- Test delete_event() ---

	public function test_delete_event_success() {
		$appleClient = $this->createAndPrepareClientInstance();
		$accountId   = 'acc1';
		$calendarId  = 'cal1';
		$eventUid    = 'event-to-delete-uid';
		$calendarUrl = "/$accountId/calendars/$calendarId/" . $eventUid . '.ics';
		$currentEtag = '"abcdef12345"';

		// --- Define return values ---
		$mockGetResponse    = array(
			'headers'    => array( 'etag' => array( $currentEtag ) ),
			'statusCode' => 200,
			'body'       => 'dummy body',
		);
		$mockDeleteResponse = array(
			'statusCode' => 204,
		);

		// --- FIX: Use willReturnCallback to handle different calls ---
		$this->sabreClientMock->expects( $this->exactly( 2 ) )
			->method( 'request' )
			->willReturnCallback(
				// This callback function will be executed for EACH call to 'request'
				function ( string $method, string $url ) use ( $mockGetResponse, $mockDeleteResponse, $calendarUrl ) {
					if ( $method === 'GET' && $url === $calendarUrl ) {
						// If it's the GET call for the ETag
						return $mockGetResponse;
					} elseif ( $method === 'DELETE' && $url === $calendarUrl ) {
						// If it's the DELETE call
						return $mockDeleteResponse;
					} else {
						// If called with unexpected arguments, fail the test
						TestCase::fail( "Sabre\DAV\Client::request called with unexpected arguments: Method='{$method}', URL='{$url}'" );
						// Or return a generic error response: return ['statusCode' => 500];
					}
				}
			);
		// --- End Fix ---

		// Execute
		$result = $appleClient->delete_event( $accountId, $calendarId, $eventUid );

		// Assert
		$this->assertTrue( $result['success'] );
		$this->assertStringContainsString( 'Event removed successfully', $result['message'] );
	}

	public function test_delete_event_fails_on_delete_request() {
		$appleClient = $this->createAndPrepareClientInstance();
		$accountId   = 'acc1';
		$calendarId  = 'cal1';
		$eventUid    = 'event-uid';
		$calendarUrl = "/$accountId/calendars/$calendarId/" . $eventUid . '.ics';
		$currentEtag = '"etag123"';

		// --- Define return values ---
		$mockGetResponse = array(
			'headers'    => array( 'etag' => array( $currentEtag ) ),
			'statusCode' => 200,
			'body'       => 'dummy body',
		);
		// Simulate DELETE failure (e.g., 403 Forbidden)
		$mockDeleteResponse = array(
			'statusCode' => 403,
		);

		// --- FIX: Use willReturnCallback for BOTH calls ---
		$this->sabreClientMock->expects( $this->exactly( 2 ) ) // Expect GET then DELETE
			->method( 'request' )
			->willReturnCallback(
				function ( string $method, string $url ) use ( $mockGetResponse, $mockDeleteResponse, $calendarUrl ) {
					if ( $method === 'GET' && $url === $calendarUrl ) {
						// Return success for the GET call
						return $mockGetResponse;
					} elseif ( $method === 'DELETE' && $url === $calendarUrl ) {
						// Return failure for the DELETE call
						return $mockDeleteResponse;
					} else {
						TestCase::fail( "Sabre\DAV\Client::request called with unexpected arguments: Method='{$method}', URL='{$url}'" );
					}
				}
			);
		// --- End Fix ---

		// Execute
		$result = $appleClient->delete_event( $accountId, $calendarId, $eventUid );

		// Assert
		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Failed to remove event', $result['message'] );
	}
} // End Test Class
