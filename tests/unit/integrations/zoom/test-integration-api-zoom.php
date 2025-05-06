<?php

namespace QuillBooking\Tests\Integrations\Zoom; // Ensure namespace matches test file location

use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Zoom\API; // Class under test
// Remove: use QuillBooking\Integrations\Zoom\App; // No App dependency
use QuillBooking_Base_Test_Case; // Assuming this is your base test class
use WP_Error;

class Test_Integration_Api_Zoom extends QuillBooking_Base_Test_Case {


	// Use the PHPMock trait
	use PHPMock;

	// Remove: private $appMock; // No App dependency

	// Namespace where the global functions are CALLED from within the Zoom API class
	private const API_NAMESPACE = 'QuillBooking\Integrations\Zoom';
	// Base Zoom API endpoint
	private const ZOOM_ENDPOINT = 'https://api.zoom.us/v2';

	public function setUp(): void {
		parent::setUp();
	}

	public function tearDown(): void {
		// PHPMock trait handles disabling mocks automatically
		parent::tearDown();
	}

	/**
	 * Helper to create an API instance for tests.
	 * Constructor takes access token and optional account ID.
	 */
	private function createApiInstance( string $accessToken = 'test-zoom-access-token', ?string $accountId = 'test-zoom-account-id' ): API {
		// Instantiate the Zoom API class directly
		return new API( $accessToken, $accountId );
	}

	// --- Test Cases for API Request Logic ---


	public function test_request_api_error_non_401() {
		$api            = $this->createApiInstance();
		$path           = 'meetings/99999999999';
		$url            = self::ZOOM_ENDPOINT . "/{$path}";
		$errorData      = array(
			'code'    => 3001,
			'message' => 'Meeting does not exist.',
		);
		$mockWpResponse = array(
			'body'     => json_encode( $errorData ),
			'response' => array( 'code' => 404 ),
		);

		// --- Define ALL necessary mocks INSIDE the test ---

		// Mock get_option needed by request_remote's headers
		$getOptionMock = $this->getFunctionMock( self::API_NAMESPACE, 'get_option' );
		$getOptionMock->expects( $this->once() ) // Expect it once for the header
			->with( 'blog_charset' )
			->willReturn( 'UTF-8' );

		// Mock wp_remote_request
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with( $url, $this->anything() )
			->willReturn( $mockWpResponse );

		// Mock is_wp_error needed by request
		$isWpErrorMock = $this->getFunctionMock( self::API_NAMESPACE, 'is_wp_error' );
		$isWpErrorMock->expects( $this->once() ) // Expect it once after wp_remote_request
			->with( $mockWpResponse )
			->willReturn( false ); // It's not a WP_Error

		// Mock wp_remote_retrieve_response_code needed by request
		$responseCodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )
			->with( $mockWpResponse )
			->willReturn( 404 );

		// Mock json_decode needed by request
		$jsonDecodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->once() )
			->with( json_encode( $errorData ), true )
			->willReturn( $errorData );

		// --- Execute ---
		$result = $api->delete( $path );

		// --- Assertions ---
		$this->assertIsArray( $result );
		$this->assertFalse( $result['success'] );
		$this->assertEquals( 404, $result['code'] );
		$this->assertEquals( $errorData, $result['data'] );
	}


	public function test_request_handles_401_without_refresh_attempt() {
		// Testing the 401 path, IGNORING the internal (flawed) refresh_tokens logic
		$originalToken   = 'expired-or-invalid-token';
		$api             = $this->createApiInstance( $originalToken );
		$path            = 'users/me';
		$url             = self::ZOOM_ENDPOINT . "/{$path}";
		$errorData401    = array(
			'code'    => 124,
			'message' => 'Invalid access token.',
		); // Example Zoom 401 error
		$mockResponse401 = array(
			'body'     => json_encode( $errorData401 ),
			'response' => array( 'code' => 401 ),
		);

		// Mock ONLY the first wp_remote_request call, which fails with 401
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() ) // Expect only ONE call
			->with(
				$url,
				$this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $originalToken )
			)
			->willReturn( $mockResponse401 );

		// Mock response code retrieval for the 401 response
		$this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' )
			->expects( $this->once() )->with( $mockResponse401 )->willReturn( 401 );

		// Mock json_decode for the 401 error body
		$this->getFunctionMock( self::API_NAMESPACE, 'json_decode' )
			->expects( $this->once() )->with( json_encode( $errorData401 ), true )->willReturn( $errorData401 );

		// Call the method under test
		$result = $api->get( $path );

		// Assertions: Should return the 401 error directly
		$this->assertFalse( $result['success'] );
		$this->assertEquals( 401, $result['code'] );
		$this->assertEquals( $errorData401, $result['data'] ); // Error details in 'data'
	}

	public function test_request_success_get() {
		$api = $this->createApiInstance();
		// Use a valid Zoom API path
		$path           = 'users/me';
		$url            = self::ZOOM_ENDPOINT . "/{$path}";
		$accessToken    = 'test-zoom-access-token'; // Match default token or pass specific one
		$expectedData   = array(
			'id'    => 'user123',
			'email' => 'test@zoom.us',
		); // Example Zoom user data
		$mockWpResponse = array(
			'body'     => json_encode( $expectedData ),
			'response' => array( 'code' => 200 ),
		);

		// Mock wp_remote_request for THIS test case
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with(
				$this->equalTo( $url ),
				$this->callback(
					function ( $args ) use ( $accessToken ) {
						return is_array( $args ) &&
						$args['method'] === 'GET' &&
						! isset( $args['body'] ) &&
						isset( $args['headers']['Authorization'] ) &&
						$args['headers']['Authorization'] === 'Bearer ' . $accessToken;
					}
				)
			)
			->willReturn( $mockWpResponse );

		// Call the method under test (using public helper get())
		$result = $api->get( $path );

		// Assertions
		$this->assertIsArray( $result );
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 200, $result['code'] ); // Assuming abstract prepare_response uses 'code'
		$this->assertEquals( $expectedData, $result['data'] );
	}




	public function test_request_handles_wp_error() {
		$api     = $this->createApiInstance();
		$path    = 'users/me';
		$url     = self::ZOOM_ENDPOINT . "/{$path}";
		$wpError = new WP_Error( 'http_request_failed', 'Zoom host unreachable' );

		// Mock wp_remote_request to return WP_Error
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with( $url, $this->anything() )
			->willReturn( $wpError );

		// No need to mock response code/decode as they shouldn't be called

		// Get the result
		$result = $api->get( $path );

		// Assertions (assuming prepare_response puts WP_Error details in 'data')
		$this->assertFalse( $result['success'] );
		$this->assertNull( $result['code'] ); // code is null for WP_Error case
		$this->assertIsArray( $result['data'] );
		$this->assertArrayHasKey( 'wp_error', $result['data'] );
		$this->assertIsArray( $result['data']['wp_error'] );
		$this->assertEquals( 'http_request_failed', $result['data']['wp_error']['code'] );
		$this->assertEquals( 'Zoom host unreachable', $result['data']['wp_error']['message'] );
	}


	// --- Test Cases for Specific Zoom API Methods ---

	public function test_get_account_info() {
		$api             = $this->createApiInstance();
		$path            = 'users/me';
		$expectedData    = array( 'id' => 'user123' );
		$mockApiResponse = array(
			'success' => true,
			'code'    => 200,
			'data'    => $expectedData,
		);

		// We can mock the public 'get' method directly for simplicity here,
		// assuming the underlying 'request' logic is tested elsewhere.
		// Or mock wp_remote_request as in test_request_success_get.
		$apiMock = $this->getMockBuilder( API::class )
			->setConstructorArgs( array( 'test-zoom-access-token', 'test-zoom-account-id' ) ) // Pass constructor args
			->onlyMethods( array( 'get' ) ) // Only mock 'get'
			->getMock();

		$apiMock->expects( $this->once() )
			->method( 'get' )
			->with( $path ) // Check the path passed to get()
			->willReturn( $mockApiResponse ); // Return the expected final structure

		$result = $apiMock->get_account_info(); // Call the method on the mock

		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_create_meeting() {
		$api             = $this->createApiInstance();
		$path            = 'users/me/meetings';
		$meetingData     = array(
			'topic' => 'Test Meeting',
			'type'  => 2,
		);
		$responseData    = array(
			'id'        => 98765,
			'topic'     => 'Test Meeting',
			'start_url' => '...',
			'join_url'  => '...',
		);
		$mockApiResponse = array(
			'success' => true,
			'code'    => 201,
			'data'    => $responseData,
		);

		// Mock the public 'post' method
		$apiMock = $this->getMockBuilder( API::class )
			->setConstructorArgs( array( 'test-zoom-access-token', 'test-zoom-account-id' ) )
			->onlyMethods( array( 'post' ) )
			->getMock();

		$apiMock->expects( $this->once() )
			->method( 'post' )
			->with( $path, $meetingData ) // Check path and data passed to post()
			->willReturn( $mockApiResponse );

		$result = $apiMock->create_meeting( $meetingData );

		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_update_meeting() {
		$api             = $this->createApiInstance();
		$meetingId       = '987654321';
		$path            = "meetings/{$meetingId}";
		$updateData      = array( 'topic' => 'Updated Topic' );
		$mockApiResponse = array(
			'success' => true,
			'code'    => 204,
			'data'    => null,
		); // 204 No Content on success often

		// Mock the public 'patch' method
		$apiMock = $this->getMockBuilder( API::class )
			->setConstructorArgs( array( 'test-zoom-access-token', 'test-zoom-account-id' ) )
			->onlyMethods( array( 'patch' ) )
			->getMock();

		$apiMock->expects( $this->once() )
			->method( 'patch' )
			->with( $path, $updateData ) // Check path and data
			->willReturn( $mockApiResponse );

		$result = $apiMock->update_meeting( $meetingId, $updateData );

		$this->assertEquals( $mockApiResponse, $result );
	}

	public function test_delete_meeting() {
		$api             = $this->createApiInstance();
		$meetingId       = '11223344';
		$path            = "meetings/{$meetingId}";
		$mockApiResponse = array(
			'success' => true,
			'code'    => 204,
			'data'    => null,
		); // 204 No Content on success

		// Mock the public 'delete' method
		$apiMock = $this->getMockBuilder( API::class )
			->setConstructorArgs( array( 'test-zoom-access-token', 'test-zoom-account-id' ) )
			->onlyMethods( array( 'delete' ) )
			->getMock();

		$apiMock->expects( $this->once() )
			->method( 'delete' )
			->with( $path ) // Check path passed to delete()
			->willReturn( $mockApiResponse );

		$result = $apiMock->delete_meeting( $meetingId );

		$this->assertEquals( $mockApiResponse, $result );
	}

} // End class Test_Integration_Api_Zoom
