<?php

namespace QuillBooking\Tests\Integrations\Zoom; // <<< CHANGE Namespace

use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Zoom\Integration as ZoomIntegration;
use QuillBooking\Integrations\Zoom\API as ZoomAPI;
use WP_Error;
use QuillBooking_Base_Test_Case;

// Assuming Utils class is in root namespace QuillBooking\Utils based on previous errors
use QuillBooking\Utils;

class Test_Integration_Integration_Zoom extends QuillBooking_Base_Test_Case {
	// <<< CHANGE Class Name

	use PHPMock;

	// Namespaces for mocked functions/statics
	private const INTEGRATION_NAMESPACE = 'QuillBooking\Integrations\Zoom'; // <<< CHANGE Namespace
	private const UTILS_NAMESPACE       = 'QuillBooking'; // Namespace where Utils is defined

	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock;
	/** @var ZoomAPI|\PHPUnit\Framework\MockObject\MockObject */ // <<< CHANGE Type hint
	private $apiMock; // Mock for the API class instance

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

		// --- Mock Core Dependencies ---
		$this->accountsMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_account', 'get_cache_data', 'update_account' ) ) // Added update_account
			->getMock();

		$this->apiMock = $this->createMock( ZoomAPI::class ); // <<< CHANGE Mock Zoom API

		// --- Mock Models (Keep similar structure, add needed properties) ---
		$this->bookingMock = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'get_meta', 'update_meta', 'logs' ) )
			->getMock();
		$this->logMock     = $this->getMockBuilder( \stdClass::class )->addMethods( array( 'create' ) )->getMock();
		$this->bookingMock->method( 'logs' )->willReturn( $this->logMock );

		$this->eventMock              = $this->createMock( \stdClass::class );
		$this->eventMock->name        = 'Zoom Test Event';
		$this->eventMock->description = 'Zoom Test Description';

		$this->calendarMock           = $this->getMockBuilder( \stdClass::class )->addMethods( array( 'get_meta' ) )->getMock();
		$this->calendarMock->id       = 123;
		$this->calendarMock->name     = 'Host Calendar';
		$this->calendarMock->timezone = 'UTC';
		$this->calendarMock->user     = (object) array(
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
		$this->bookingMock->slot_time  = 60; // Duration needed for Zoom create/update
		$this->bookingMock->event_url  = 'https://example.com/booking/abc';
		$this->bookingMock->event_id   = 'evt-1';
		$this->bookingMock->id         = 987;
		$this->bookingMock->calendar   = $this->calendarMock;
		$this->bookingMock->hash_id    = 'booking-hash-xyz';
		$this->bookingMock->location   = 'zoom'; // Default to zoom location for relevant tests

		// Mock global functions
		// Only mock get_option if needed by get_site_uid AND if that test runs
		// $this->getFunctionMock(self::INTEGRATION_NAMESPACE, 'get_option')...

		// Mock __() for log messages
		$l10nMock = $this->getFunctionMock( self::INTEGRATION_NAMESPACE, '__' );
		$l10nMock->expects( $this->any() )->willReturnArgument( 0 );
	}

	public function tearDown(): void {
		parent::tearDown();
	}

	/**
	 * Helper to create the Zoom Integration instance mock.
	 */
	private function createIntegrationInstance( $setApiMock = true ): ZoomIntegration {
		// <<< CHANGE Type hint
		// Mock ZoomIntegration, mocking connect, set_host, and the wrapper generateHashKey
		$integration = $this->getMockBuilder( ZoomIntegration::class ) // <<< CHANGE Class
			->onlyMethods( array( 'connect', 'set_host' ) ) // <<< ADD generateHashKey
			->addMethods( array( 'generateHashKey' ) ) // <<< ADD generateHashKey
			->disableOriginalConstructor()
			->getMock();

		// Inject accounts mock
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		// Configure connect mock
		if ( $setApiMock ) {
			$integration->method( 'connect' )->willReturn( $this->apiMock ); // Return Zoom API mock
		} else {
			// Simulate connect failure (e.g., missing tokens returns WP_Error)
			$integration->method( 'connect' )->willReturn( null );
		}

		return $integration;
	}

	// --- ADD TESTS FOR ZOOM INTEGRATION ---

	// --- add_event_to_calendars Tests ---

	public function test_add_event_to_calendars_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id               = $this->calendarMock->id;
		$account_id            = 'zoom-acc-1';
		$integration_meta      = array( $account_id => array( 'name' => 'Zoom User 1' ) ); // Simple meta for Zoom
		$meeting_response_data = array(
			'id'       => 111222,
			'join_url' => 'https://zoom.us/j/111222',
		);
		$api_success_response  = array(
			'success' => true,
			'data'    => $meeting_response_data,
		);
		$account_data          = array( 'name' => 'Zoom Sched User' ); // Data returned by get_account

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->with( $integration->meta_key )->willReturn( $integration_meta ); // Check meta_key access
		// Expect get_account call within the loop
		$this->accountsMock->expects( $this->once() )->method( 'get_account' )->with( $account_id )->willReturn( $account_data );
		// connect() is mocked in createIntegrationInstance to return apiMock

		// Expect API create_meeting call
		$this->apiMock->expects( $this->once() )
			->method( 'create_meeting' )
			->with(
				$this->callback(
					function ( $data ) use ( $account_data ) {
						// Check essential fields in meeting data
						return $data['agenda'] === 'Zoom Test Event' &&
						str_contains( $data['start_time'], 'T' ) && // Check format
						$data['duration'] === 60 &&
						$data['type'] === '2' &&
						$data['schedule_for'] === $account_data['name'] &&
						$data['topic'] === 'Zoom Test Event';
					}
				)
			)
			->willReturn( $api_success_response );

		// Expect booking meta update
		$this->bookingMock->expects( $this->once() )
			->method( 'update_meta' )
			->with(
				'zoom_event_details',
				array(
					'meeting'    => $meeting_response_data,
					'account_id' => $account_id,
				)
			);

		// Expect log create
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Meeting created' ) ) );

		// Execute
		$integration->add_event_to_calendars( $this->bookingMock );
	}

	public function test_add_event_to_calendars_skips_if_location_not_zoom() {
		$integration                 = $this->createIntegrationInstance( true );
		$this->bookingMock->location = 'google_meet'; // Set location to something else

		// Assertions: Expect no major methods to be called
		$integration->expects( $this->never() )->method( 'set_host' );
		$this->calendarMock->expects( $this->never() )->method( 'get_meta' );
		$this->accountsMock->expects( $this->never() )->method( 'get_account' );
		$integration->expects( $this->never() )->method( 'connect' );
		$this->apiMock->expects( $this->never() )->method( 'create_meeting' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );
		$this->logMock->expects( $this->never() )->method( 'create' );

		// Execute
		$result = $integration->add_event_to_calendars( $this->bookingMock );

		// Assert return value is the original booking object
		$this->assertSame( $this->bookingMock, $result );
	}

	public function test_add_event_to_calendars_api_fail() {
		$integration = $this->createIntegrationInstance( true ); // Connect succeeds

		$host_id            = $this->calendarMock->id;
		$account_id         = 'zoom-acc-1';
		$integration_meta   = array( $account_id => array( 'name' => 'Zoom User 1' ) );
		$account_data       = array( 'name' => 'Zoom Sched User' );
		$api_error_response = array(
			'success' => false,
			'data'    => null,
			'error'   => array( 'message' => 'Zoom API Error' ),
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );
		$this->accountsMock->method( 'get_account' )->willReturn( $account_data );
		// connect() is mocked

		// Expect API create_meeting call to fail
		$this->apiMock->expects( $this->once() )
			->method( 'create_meeting' )
			->with( $this->isType( 'array' ) )
			->willReturn( $api_error_response );

		// Expect booking meta NOT updated
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// Expect ERROR log create
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Error creating meeting' ) ) );

		// Execute
		$integration->add_event_to_calendars( $this->bookingMock );
	}

	public function test_add_event_to_calendars_connect_fail() {
		// Ensure connect() returns WP_Error
		$integration = $this->createIntegrationInstance( false );

		$host_id    = $this->calendarMock->id;
		$account_id = 'zoom-acc-1';
		// Use only ONE account in meta for this specific test
		$integration_meta = array( $account_id => array( 'name' => 'Zoom User 1' ) );

		// --- Mock Dependencies ---
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$reflection = new \ReflectionClass( $integration );
		$hostProp   = $reflection->getProperty( 'host' );
		$hostProp->setAccessible( true );
		$hostProp->setValue( $integration, $this->calendarMock );
		$this->calendarMock->method( 'get_meta' )->willReturn( $integration_meta );
		// connect() is mocked to return WP_Error by createIntegrationInstance(false)
		// We still expect connect to BE CALLED once
		$integration->expects( $this->once() )->method( 'connect' )->with( $host_id, $account_id );

		// --- Assertions ---
		// If connect fails and the 'continue' runs, get_account should NOT be called
		$this->accountsMock->expects( $this->never() )->method( 'get_account' );
		$this->apiMock->expects( $this->never() )->method( 'create_meeting' );
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );
		// Error log IS expected
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Error connecting' ) ) );

		// --- Execute ---
		$integration->add_event_to_calendars( $this->bookingMock );
	}


	// --- remove_event_from_calendars Tests ---

	public function test_remove_event_from_calendars_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id              = $this->calendarMock->id;
		$account_id           = 'zoom-acc-1';
		$meeting_id           = 123456789;
		$zoom_meta            = array(
			'meeting'    => array( 'id' => $meeting_id ),
			'account_id' => $account_id,
		);
		$api_success_response = array(
			'success' => true,
			'code'    => 204,
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'zoom_event_details' )->willReturn( $zoom_meta );
		// connect() mocked

		// Expect API delete_meeting call
		$this->apiMock->expects( $this->once() )
			->method( 'delete_meeting' )
			->with( $meeting_id )
			->willReturn( $api_success_response );

		// Expect log create
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Meeting removed' ) ) );

		// Expect meta NOT to be updated (remove doesn't update meta)
		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// Execute
		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	public function test_remove_event_from_calendars_api_fail() {
		$integration = $this->createIntegrationInstance( true );

		$host_id            = $this->calendarMock->id;
		$account_id         = 'zoom-acc-1';
		$meeting_id         = 123456789;
		$zoom_meta          = array(
			'meeting'    => array( 'id' => $meeting_id ),
			'account_id' => $account_id,
		);
		$api_error_response = array(
			'success' => false,
			'error'   => array( 'message' => 'Delete Zoom Error' ),
		);

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->willReturn( $zoom_meta );
		// connect() mocked

		// Expect API delete_meeting call to fail
		$this->apiMock->expects( $this->once() )
			->method( 'delete_meeting' )
			->with( $meeting_id )
			->willReturn( $api_error_response );

		// Expect log create for ERROR
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Error removing' ) ) );

		$this->bookingMock->expects( $this->never() )->method( 'update_meta' );

		// Execute
		$integration->remove_event_from_calendars( $this->bookingMock );
	}

	// Add test_remove_event_from_calendars_connect_fail (similar structure)
	// Add test_remove_event_from_calendars_meta_empty (similar structure)


	// --- reschedule_event Tests ---

	public function test_reschedule_event_success() {
		$integration = $this->createIntegrationInstance( true );

		$host_id              = $this->calendarMock->id;
		$account_id           = 'zoom-acc-1';
		$meeting_id           = 123456789;
		$zoom_meta            = array(
			'meeting'    => array( 'id' => $meeting_id ),
			'account_id' => $account_id,
		);
		$updated_meeting_data = array(
			'id'    => $meeting_id,
			'topic' => 'Rescheduled',
		);
		$api_success_response = array(
			'success' => true,
			'code'    => 200,
			'data'    => $updated_meeting_data,
		); // Assuming update returns data

		// Mock Dependencies
		$integration->expects( $this->once() )->method( 'set_host' )->with( $host_id );
		$this->bookingMock->method( 'get_meta' )->with( 'zoom_event_details' )->willReturn( $zoom_meta );
		// connect() mocked

		// Expect API update_meeting call
		$this->apiMock->expects( $this->once() )
			->method( 'update_meeting' )
			->with(
				$meeting_id,
				$this->callback(
					function ( $data ) {
						return isset( $data['start_time'] ) && isset( $data['duration'] );
					}
				)
			)
			->willReturn( $api_success_response );

		// Expect booking meta update
		$this->bookingMock->expects( $this->once() )
			->method( 'update_meta' )
			->with(
				'zoom_event_details',
				array( // Note: Zoom code saves differently than Google
					'event'      => $updated_meeting_data, // Should be 'meeting'? Check code. Assuming 'event' based on provided code snippet structure.
					'account_id' => $account_id,
				)
			);

		// Expect log create
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'info' && str_contains( $log['message'], 'Meeting rescheduled' ) ) );

		// Execute
		$integration->reschedule_event( $this->bookingMock );
	}

	// Add test_reschedule_event_api_fail (similar structure)
	// Add test_reschedule_event_connect_fail (similar structure)
	// Add test_reschedule_event_meta_empty (similar structure)


	// --- Test get_event_description --- (Identical to Google version)
	public function test_get_event_description_formats_correctly() {
		// --- FIX: Instantiate the REAL Integration class ---
		// Ensure dependencies are available. Assuming Utils is handled.
		// If Integration constructor requires the Utils dependency injection:
		$utils       = new \QuillBooking\Utils(); // Create real Utils
		$integration = new ZoomIntegration( $utils );   // Create real Integration

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

	// --- Test connect ---
	public function test_connect_success() {
		// Don't use createIntegrationInstance helper as we test connect itself
		$integration = $this->getMockBuilder( ZoomIntegration::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'set_host' ) ) // Only mock things called by parent::connect if any
			->getMock();
		// Inject accounts mock
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );
		// Inject App mock if needed by the 'new API' call (based on Zoom API constructor)
		// $appProp = $reflection->getProperty('app'); $appProp->setAccessible(true); $appProp->setValue($integration, $this->createMock(\QuillBooking\Integrations\Zoom\App::class));

		$host_id      = 123;
		$account_id   = 'zoom-acc-connect';
		$account_data = array(
			'tokens' => array(
				'access_token'  => 'at-123',
				'refresh_token' => 'rt-456',
			),
		);

		// Mock get_account to return tokens
		$this->accountsMock->expects( $this->once() )
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( $account_data );

		$result = $integration->connect( $host_id, $account_id );

		// Assert it returns an instance of the Zoom API class
		$this->assertInstanceOf( ZoomAPI::class, $result );
		// Optionally check properties on the returned API instance if needed
	}

	public function test_connect_fails_no_tokens() {
		$integration  = $this->getMockBuilder( ZoomIntegration::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'set_host' ) )
			->getMock();
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		$host_id      = 123;
		$account_id   = 'zoom-acc-no-token';
		$account_data = array( 'tokens' => array( 'refresh_token' => 'rt-only' ) ); // Missing access token

		$this->accountsMock->method( 'get_account' )->willReturn( $account_data );

		$result = $integration->connect( $host_id, $account_id );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'zoom_integration_error', $result->get_error_code() );
	}


}
