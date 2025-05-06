<?php

namespace QuillBooking\Tests\Integrations\Outlook; // <<< CHANGE Namespace

use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Outlook\API as OutlookAPI; // <<< CHANGE Class under test
use QuillBooking\Integrations\Outlook\App as OutlookApp; // <<< CHANGE App dependency
use QuillBooking_Base_Test_Case;
use WP_Error;

class Test_Integration_Api_Outlook extends QuillBooking_Base_Test_Case {


	use PHPMock;

	/** @var OutlookApp|\PHPUnit\Framework\MockObject\MockObject */ // <<< CHANGE Type hint
	private $appMock;

	// --- CORRECTED NAMESPACE CONSTANTS ---
	// Namespace where request_remote calls wp_remote_request, get_option
	private const CHILD_API_NAMESPACE = 'QuillBooking\Integrations\Outlook'; // <<< CHANGE Namespace
	// Namespace where the inherited request method calls is_wp_error, retrieve_code, json_decode
	private const PARENT_API_NAMESPACE = 'QuillBooking\Integration';
	// --- END CORRECTION ---

	// Base Microsoft Graph API endpoint
	private const OUTLOOK_ENDPOINT = 'https://graph.microsoft.com/v1.0'; // <<< CHANGE Endpoint

	public function setUp(): void {
		parent::setUp();

		// Mock the Outlook App dependency
		$this->appMock = $this->createMock( OutlookApp::class ); // <<< CHANGE Class

		// Mock get_option (called by request_remote in Child Namespace)
		$this->getFunctionMock( self::CHILD_API_NAMESPACE, 'get_option' )
			->expects( $this->any() )->with( 'blog_charset' )->willReturn( 'UTF-8' );

		// Mock is_wp_error (called by request in Parent Namespace)
		$this->getFunctionMock( self::PARENT_API_NAMESPACE, 'is_wp_error' )
			->expects( $this->any() )->willReturnCallback( fn( $thing) => $thing instanceof WP_Error );

		// Mock retrieve_code (called by request in Parent Namespace)
		// $this->getFunctionMock( self::PARENT_API_NAMESPACE, 'wp_remote_retrieve_response_code' )
		// ->expects( $this->any() )->willReturnCallback( fn( $r) => is_wp_error( $r ) ? null : ( $r['response']['code'] ?? null ) );

		// // Mock json_decode (called by request in Parent Namespace)
		// $this->getFunctionMock( self::PARENT_API_NAMESPACE, 'json_decode' )
		// ->expects( $this->any() )->willReturnCallback( fn( $s, $a = false) => \json_decode( $s, $a ) );
	}

	public function tearDown(): void {
		parent::tearDown();
	}

	/**
	 * Helper to create an Outlook API instance for tests
	 */
	private function createApiInstance( string $accessToken = 'test-outlook-access-token', ?string $refreshToken = 'test-outlook-refresh-token', ?string $accountId = 'test-outlook-account-id' ): OutlookAPI {
		// <<< CHANGE Return type
		// Inject the Outlook App mock
		return new OutlookAPI( $accessToken, $refreshToken, $this->appMock, $accountId ); // <<< CHANGE Class
	}

	// --- Test Cases for API Request Logic ---

	public function test_request_success_get() {
		$api            = $this->createApiInstance();
		$accessToken    = 'test-outlook-access-token';
		$path           = 'me'; // <<< CHANGE Path
		$url            = self::OUTLOOK_ENDPOINT . "/{$path}"; // <<< CHANGE URL base
		$expectedData   = array(
			'id'          => 'outlook-user-guid',
			'displayName' => 'Outlook User',
		); // <<< CHANGE Expected data
		$mockWpResponse = array(
			'body'     => json_encode( $expectedData ),
			'response' => array( 'code' => 200 ),
		);

		// Mock wp_remote_request (CHILD namespace)
		$wpRemoteMock = $this->getFunctionMock( self::CHILD_API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with(
				$this->equalTo( $url ),
				$this->callback(
					function ( $args ) use ( $accessToken ) {
						// <<< Use correct token
						return $args['method'] === 'GET' &&
						! isset( $args['body'] ) &&
						$args['headers']['Authorization'] === 'Bearer ' . $accessToken;
					}
				)
			)
			->willReturn( $mockWpResponse );

		// Mocks for retrieve_code/json_decode are in setUp

		// Call the method under test
		$result = $api->get( $path );

		// Assertions
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 200, $result['code'] ); // Assuming 'code' key
		$this->assertEquals( $expectedData, $result['data'] ); // Assuming 'data' key
	}

	public function test_request_api_error_non_401() {
		$api  = $this->createApiInstance();
		$path = 'me/events/nonexistent_event_id'; // <<< CHANGE Path
		$url  = self::OUTLOOK_ENDPOINT . "/{$path}"; // <<< CHANGE URL base
		// Sample MS Graph error structure
		$errorData      = array(
			'error' => array(
				'code'    => 'ErrorItemNotFound',
				'message' => 'The specified object was not found in the store.',
			),
		); // <<< CHANGE Error data
		$mockWpResponse = array(
			'body'     => json_encode( $errorData ),
			'response' => array( 'code' => 404 ),
		);

		// Mock wp_remote_request (CHILD namespace)
		$wpRemoteMock = $this->getFunctionMock( self::CHILD_API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )->with( $url, $this->anything() )->willReturn( $mockWpResponse );

		// Mocks for retrieve_code/json_decode are in setUp

		// Call the method under test (e.g., trying to delete)
		$result = $api->delete( $path ); // Use delete which calls request

		// Assertions
		$this->assertFalse( $result['success'] );
		$this->assertEquals( 404, $result['code'] );
		$this->assertEquals( $errorData, $result['data'] ); // Error data in 'data' key

		// Verify refresh_tokens was NOT called (as code == 404)
		$this->appMock->expects( $this->never() )->method( 'refresh_tokens' );
	}


	public function test_request_handles_401_with_successful_refresh() {
		$originalToken   = 'old-outlook-token';
		$refreshToken    = 'valid-outlook-refresh-token';
		$accountId       = 'outlook-acc-123';
		$newToken        = 'new-shiny-outlook-token';
		$newRefreshToken = 'new-outlook-refresh-token'; // Outlook often issues new refresh tokens
		$path            = 'me/calendars'; // <<< CHANGE Path
		$url             = self::OUTLOOK_ENDPOINT . "/{$path}"; // <<< CHANGE URL base
		// Sample MS Graph calendar list response
		$expectedData = array(
			'value' => array(
				array(
					'id'   => 'cal1',
					'name' => 'Calendar',
				),
			),
		); // <<< CHANGE Expected data

		$api = $this->createApiInstance( $originalToken, $refreshToken, $accountId );

		$mockResponse401 = array(
			'body'     => json_encode(
				array(
					'error' => array(
						'code'    => 'InvalidAuthenticationToken',
						'message' => 'Access token has expired.',
					),
				)
			),
			'response' => array( 'code' => 401 ),
		);
		$mockResponse200 = array(
			'body'     => json_encode( $expectedData ),
			'response' => array( 'code' => 200 ),
		);

		// Expect refresh_tokens to be called ONCE on the App mock
		$this->appMock->expects( $this->once() )
			->method( 'refresh_tokens' )
			->with( $refreshToken, $accountId )
			// Simulate successful refresh returning NEW tokens
			->willReturn(
				array(
					'access_token'  => $newToken,
					'refresh_token' => $newRefreshToken,
				)
			);

		// Mock wp_remote_request (CHILD namespace) - Expect two calls
		$wpRemoteMock = $this->getFunctionMock( self::CHILD_API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->exactly( 2 ) )
			->withConsecutive(
				array( $this->equalTo( $url ), $this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $originalToken ) ),
				array( $this->equalTo( $url ), $this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $newToken ) ) // Uses new token
			)
			->willReturnOnConsecutiveCalls( $mockResponse401, $mockResponse200 );

		// Mocks for retrieve_code/json_decode are in setUp and will be called twice

		// Call the method under test
		$result = $api->get( $path );

		// Assertions
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 200, $result['code'] );
		$this->assertEquals( $expectedData, $result['data'] );

		// Optional: Assert internal state was updated (requires reflection or getters)
		// $reflection = new \ReflectionClass($api);
		// $accessTokenProp = $reflection->getProperty('access_token'); $accessTokenProp->setAccessible(true);
		// $refreshTokenProp = $reflection->getProperty('refresh_token'); $refreshTokenProp->setAccessible(true);
		// $this->assertEquals($newToken, $accessTokenProp->getValue($api));
		// $this->assertEquals($newRefreshToken, $refreshTokenProp->getValue($api));
	}

	public function test_request_handles_401_with_failed_refresh() {
		$originalToken = 'old-outlook-token';
		$refreshToken  = 'invalid-outlook-refresh-token';
		$accountId     = 'outlook-acc-123';
		$path          = 'me'; // <<< CHANGE Path
		$url           = self::OUTLOOK_ENDPOINT . "/{$path}"; // <<< CHANGE URL base
		$errorData401  = array(
			'error' => array(
				'code'    => 'InvalidAuthenticationToken',
				'message' => 'Token invalid.',
			),
		); // <<< CHANGE Error data

		$api = $this->createApiInstance( $originalToken, $refreshToken, $accountId );

		$mockResponse401 = array(
			'body'     => json_encode( $errorData401 ),
			'response' => array( 'code' => 401 ),
		);

		// Expect refresh_tokens on App mock to return false
		$this->appMock->expects( $this->once() )
			->method( 'refresh_tokens' )
			->with( $refreshToken, $accountId )
			->willReturn( false ); // Simulate refresh failure

		// Expect wp_remote_request only ONCE (CHILD namespace)
		$wpRemoteMock = $this->getFunctionMock( self::CHILD_API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with( $url, $this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $originalToken ) )
			->willReturn( $mockResponse401 );

		// Mocks for retrieve_code/json_decode are in setUp and will be called once

		// Call the method under test
		$result = $api->get( $path );

		// Assertions: Should return the original 401 error
		$this->assertFalse( $result['success'] );
		$this->assertEquals( 401, $result['code'] );
		$this->assertEquals( $errorData401, $result['data'] ); // Error in 'data'
	}


	public function test_request_handles_wp_error() {
		$api     = $this->createApiInstance();
		$path    = 'me'; // <<< CHANGE Path
		$url     = self::OUTLOOK_ENDPOINT . "/{$path}"; // <<< CHANGE URL base
		$wpError = new WP_Error( 'http_request_failed', 'MS Graph unreachable' ); // <<< CHANGE Message

		// Mock wp_remote_request (CHILD namespace)
		$wpRemoteMock = $this->getFunctionMock( self::CHILD_API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )->with( $url, $this->anything() )->willReturn( $wpError );

		// Expect retrieve_code/json_decode NOT to be called (PARENT namespace)
		$this->getFunctionMock( self::PARENT_API_NAMESPACE, 'wp_remote_retrieve_response_code' )
			->expects( $this->never() );
		$this->getFunctionMock( self::PARENT_API_NAMESPACE, 'json_decode' )
			->expects( $this->never() );

		// Get the result
		$result = $api->get( $path );

		// Assertions for WP_Error structure (assuming it's put in 'data')
		$this->assertFalse( $result['success'] );
		$this->assertNull( $result['code'] );
		$this->assertIsArray( $result['data'] );
		$this->assertArrayHasKey( 'wp_error', $result['data'] );
		$this->assertEquals( 'http_request_failed', $result['data']['wp_error']['code'] );
		$this->assertEquals( 'MS Graph unreachable', $result['data']['wp_error']['message'] );
	}

	// --- Test Cases for Specific Outlook API Methods ---

	public function test_get_account_info() {
		$api             = $this->createApiInstance();
		$path            = 'me';
		$expectedData    = array(
			'id'          => 'outlook-guid',
			'displayName' => 'Test User',
		);
		$mockApiResponse = array(
			'success' => true,
			'code'    => 200,
			'data'    => $expectedData,
		);

		// Mock the public 'get' method inherited from Abstract_API
		$apiMock = $this->getMockBuilder( OutlookAPI::class )
			->setConstructorArgs( array( 'token', 'refresh', $this->appMock, 'id' ) )
			->onlyMethods( array( 'get' ) ) // Mock 'get'
			->getMock();
		$apiMock->expects( $this->once() )->method( 'get' )->with( $path )->willReturn( $mockApiResponse );

		$result = $apiMock->get_account_info(); // Call method on mock
		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_get_calendars() {
		$api             = $this->createApiInstance();
		$path            = 'me/calendars';
		$expectedData    = array( 'value' => array( array( 'id' => 'cal1' ), array( 'id' => 'cal2' ) ) ); // MS Graph uses 'value'
		$mockApiResponse = array(
			'success' => true,
			'code'    => 200,
			'data'    => $expectedData,
		);

		$apiMock = $this->getMockBuilder( OutlookAPI::class )
			->setConstructorArgs( array( 'token', 'refresh', $this->appMock, 'id' ) )
			->onlyMethods( array( 'get' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'get' )->with( $path )->willReturn( $mockApiResponse );

		$result = $apiMock->get_calendars();
		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_get_events() {
		$api             = $this->createApiInstance();
		$calendarId      = 'cal123';
		$path            = "me/calendars/{$calendarId}/calendarview"; // Specific path
		$args            = array(
			'startDateTime' => '2023-01-01T00:00:00Z',
			'endDateTime'   => '2023-01-02T00:00:00Z',
		); // Example args
		$expectedData    = array( 'value' => array( array( 'id' => 'evt1' ), array( 'id' => 'evt2' ) ) );
		$mockApiResponse = array(
			'success' => true,
			'code'    => 200,
			'data'    => $expectedData,
		);

		$apiMock = $this->getMockBuilder( OutlookAPI::class )
			->setConstructorArgs( array( 'token', 'refresh', $this->appMock, 'id' ) )
			->onlyMethods( array( 'get' ) )->getMock();
		// Expect 'get' to be called with path AND args
		$apiMock->expects( $this->once() )->method( 'get' )->with( $path, $args )->willReturn( $mockApiResponse );

		$result = $apiMock->get_events( $calendarId, $args );
		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_create_event() {
		$api             = $this->createApiInstance();
		$calendarId      = 'cal123';
		$path            = "me/calendars/{$calendarId}/events";
		$eventData       = array(
			'subject' => 'New Event',
			'start'   => array(
				'dateTime' => '...',
				'timeZone' => 'UTC',
			), /* ... */
		);
		$responseData    = array( 'id' => 'newEvtId' /* ... */ );
		$mockApiResponse = array(
			'success' => true,
			'code'    => 201,
			'data'    => $responseData,
		);

		$apiMock = $this->getMockBuilder( OutlookAPI::class )
			->setConstructorArgs( array( 'token', 'refresh', $this->appMock, 'id' ) )
			->onlyMethods( array( 'post' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'post' )->with( $path, $eventData )->willReturn( $mockApiResponse );

		$result = $apiMock->create_event( $calendarId, $eventData );
		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_update_event() {
		$api             = $this->createApiInstance();
		$calendarId      = 'cal123';
		$eventId         = 'evt456';
		$path            = "me/calendars/{$calendarId}/events/{$eventId}";
		$updateData      = array( 'subject' => 'Updated Subject' );
		$responseData    = array(
			'id'      => $eventId,
			'subject' => 'Updated Subject',
		); // PATCH often returns updated object
		$mockApiResponse = array(
			'success' => true,
			'code'    => 200,
			'data'    => $responseData,
		);

		$apiMock = $this->getMockBuilder( OutlookAPI::class )
			->setConstructorArgs( array( 'token', 'refresh', $this->appMock, 'id' ) )
			->onlyMethods( array( 'patch' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'patch' )->with( $path, $updateData )->willReturn( $mockApiResponse );

		$result = $apiMock->update_event( $calendarId, $eventId, $updateData );
		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_delete_event() {
		$api     = $this->createApiInstance();
		$eventId = 'evt789';
		// Note the different path structure for delete in Outlook API code
		$path            = "me/events/{$eventId}";
		$mockApiResponse = array(
			'success' => true,
			'code'    => 204,
			'data'    => null,
		); // 204 No Content

		$apiMock = $this->getMockBuilder( OutlookAPI::class )
			->setConstructorArgs( array( 'token', 'refresh', $this->appMock, 'id' ) )
			->onlyMethods( array( 'delete' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'delete' )->with( $path )->willReturn( $mockApiResponse );

		$result = $apiMock->delete_event( $eventId ); // Only pass event ID
		$this->assertEquals( $mockApiResponse, $result );
	}
} // End class Test_Integration_Api_Outlook
