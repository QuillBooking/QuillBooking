<?php



use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Google\API;
use QuillBooking\Integrations\Google\App;
use QuillBooking_Base_Test_Case;
use WP_Error;

class Test_Integration_Api_Google extends QuillBooking_Base_Test_Case {


	// Use the PHPMock trait
	use PHPMock;

	private $appMock;

	// Namespace where the global functions are CALLED from within the API class
	private const API_NAMESPACE = 'QuillBooking\Integrations\Google';

	public function setUp(): void {
		parent::setUp();

		// Create mock for the App dependency using PHPUnit's mocking
		$this->appMock = $this->createMock( App::class );

		// Mock get_option universally for this test class if its return value is constant
		// Note: Specify the namespace where get_option is called
		$getOptionMock = $this->getFunctionMock( self::API_NAMESPACE, 'get_option' );
		$getOptionMock->expects( $this->any() ) // Called any number of times
			->with( 'blog_charset' ) // Specifically for the blog_charset option
			->willReturn( 'UTF-8' ); // Return the expected value

		// Mock is_wp_error universally
		$isWpErrorMock = $this->getFunctionMock( self::API_NAMESPACE, 'is_wp_error' );
		$isWpErrorMock->expects( $this->any() )
			->willReturnCallback( fn( $thing) => $thing instanceof WP_Error );
	}

	public function tearDown(): void {
		// PHPMock trait handles disabling mocks automatically
		parent::tearDown();
	}

	/**
	 * Helper to create an API instance for tests
	 */
	private function createApiInstance( $accessToken = 'test-access-token', $refreshToken = 'test-refresh-token', $accountId = 'test-account-id' ): API {
		// Inject the PHPUnit mock object
		return new API( $accessToken, $refreshToken, $this->appMock, $accountId );
	}

	// --- Test Cases ---

	public function test_request_success_get() {
		$api            = $this->createApiInstance();
		$path           = 'calendar/v3/users/me/calendarList';
		$url            = "https://www.googleapis.com/{$path}";
		$expectedData   = array(
			'items' => array(
				array(
					'id'      => 'primary',
					'summary' => 'Test Cal',
				),
			),
		);
		$mockWpResponse = array(
			'body'     => json_encode( $expectedData ),
			'response' => array( 'code' => 200 ),
		);

		// Mock wp_remote_request for THIS test case
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() ) // Expect it once
			->with(
				$this->equalTo( $url ), // Check URL
				$this->callback(
					function ( $args ) {
						// Use callback for detailed arg check
						return is_array( $args ) &&
						$args['method'] === 'GET' &&
						! isset( $args['body'] ) &&
						isset( $args['headers']['Authorization'] ) &&
						$args['headers']['Authorization'] === 'Bearer test-access-token';
					}
				)
			)
			->willReturn( $mockWpResponse ); // Return the success response

		// Mock wp_remote_retrieve_response_code for THIS test case
		$responseCodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )
			->with( $this->equalTo( $mockWpResponse ) ) // Ensure it's called with the correct response array
			->willReturn( 200 );

		// (Optional) Mock json_decode if you want strict control or specific behavior
		$jsonDecodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->once() )
			->with( json_encode( $expectedData ), true ) // Check arguments
			->willReturn( $expectedData );             // Return decoded data

		// Call the method under test
		$result = $api->get( $path ); // Or $api->request('GET', $path)

		// Assertions
		$this->assertIsArray( $result );
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 200, $result['code'] );
		$this->assertEquals( $expectedData, $result['data'] );
	}

	public function test_request_api_error_non_401() {
		$api            = $this->createApiInstance();
		$path           = 'calendar/v3/calendars/nonexistent/events';
		$url            = "https://www.googleapis.com/{$path}";
		$errorData      = array(
			'error' => array(
				'code'    => 404,
				'message' => 'Not Found',
			),
		);
		$mockWpResponse = array(
			'body'     => json_encode( $errorData ),
			'response' => array( 'code' => 404 ),
		);

		// Mock wp_remote_request
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with( $url, $this->anything() ) // Simpler argument check okay here
			->willReturn( $mockWpResponse );

		// Mock wp_remote_retrieve_response_code
		$responseCodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )
			->with( $mockWpResponse )
			->willReturn( 404 );

		// Mock json_decode
		$jsonDecodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->once() )
			->with( json_encode( $errorData ), true )
			->willReturn( $errorData );

		// Call the method under test
		$result = $api->get( $path );

		// Assertions
		$this->assertIsArray( $result );
		$this->assertFalse( $result['success'] );
		$this->assertEquals( 404, $result['code'] );
		$this->assertEquals( $errorData, $result['data'] );

		// Verify refresh_tokens was NOT called on the App mock
		$this->appMock->expects( $this->never() )->method( 'refresh_tokens' );
	}


	public function test_request_handles_401_with_successful_refresh() {
		$originalToken = 'old-token';
		$refreshToken  = 'valid-refresh-token';
		$accountId     = 'acc-123';
		$newToken      = 'new-shiny-token';
		$path          = 'calendar/v3/users/me/calendarList';
		$url           = "https://www.googleapis.com/{$path}";
		$expectedData  = array( 'items' => array( array( 'id' => 'primary' ) ) );

		$api = $this->createApiInstance( $originalToken, $refreshToken, $accountId );

		$mockResponse401 = array(
			'body'     => json_encode(
				array(
					'error' => array(
						'code'    => 401,
						'message' => 'Invalid Credentials',
					),
				)
			),
			'response' => array( 'code' => 401 ),
		);
		$mockResponse200 = array(
			'body'     => json_encode( $expectedData ),
			'response' => array( 'code' => 200 ),
		);

		// Expect refresh_tokens to be called ONCE on the App mock and return new tokens
		$this->appMock->expects( $this->once() )
			->method( 'refresh_tokens' )
			->with( $refreshToken, $accountId )
			->willReturn(
				array(
					'access_token'  => $newToken,
					'refresh_token' => $refreshToken,
				)
			); // Must match return structure of App::refresh_tokens

		// Mock wp_remote_request: Expect two calls using PHPUnit's invocation count matching
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->exactly( 2 ) )
			->withConsecutive( // Check arguments for each consecutive call
				array( $this->equalTo( $url ), $this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $originalToken ) ), // First call args
				array( $this->equalTo( $url ), $this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $newToken ) )     // Second call args
			)
			->willReturnOnConsecutiveCalls( // Return different values for each call
				$mockResponse401,
				$mockResponse200
			);

		// Mock wp_remote_retrieve_response_code for both calls
		$responseCodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->exactly( 2 ) )
			->withConsecutive(
				array( $this->equalTo( $mockResponse401 ) ),
				array( $this->equalTo( $mockResponse200 ) )
			)
			->willReturnOnConsecutiveCalls( 401, 200 );

		// Mock json_decode for the first (error) and second (success) response bodies
		$jsonDecodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->exactly( 2 ) )
			->withConsecutive(
				array( $mockResponse401['body'], true ),
				array( $mockResponse200['body'], true )
			)
			->willReturnOnConsecutiveCalls(
				json_decode( $mockResponse401['body'], true ), // Decode error
				$expectedData                                // Return success data
			);

		// Call the method under test
		$result = $api->get( $path );

		// Assertions
		$this->assertTrue( $result['success'] );
		$this->assertEquals( 200, $result['code'] );
		$this->assertEquals( $expectedData, $result['data'] );
	}

	public function test_request_handles_401_with_failed_refresh() {
		$originalToken = 'old-token';
		$refreshToken  = 'invalid-refresh-token';
		$accountId     = 'acc-123';
		$path          = 'calendar/v3/users/me/calendarList';
		$url           = "https://www.googleapis.com/{$path}";
		$errorData401  = array(
			'error' => array(
				'code'    => 401,
				'message' => 'Invalid Credentials',
			),
		);

		$api = $this->createApiInstance( $originalToken, $refreshToken, $accountId );

		$mockResponse401 = array(
			'body'     => json_encode( $errorData401 ),
			'response' => array( 'code' => 401 ),
		);

		// Expect refresh_tokens on App mock to return false
		$this->appMock->expects( $this->once() )
			->method( 'refresh_tokens' )
			->with( $refreshToken, $accountId )
			->willReturn( false );

		// Expect wp_remote_request only ONCE
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with( $url, $this->callback( fn( $args) => $args['headers']['Authorization'] === 'Bearer ' . $originalToken ) )
			->willReturn( $mockResponse401 );

		// Expect wp_remote_retrieve_response_code only ONCE
		$responseCodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->once() )
			->with( $mockResponse401 )
			->willReturn( 401 );

		// Mock json_decode for the error body
		$jsonDecodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->once() )
			->with( $mockResponse401['body'], true )
			->willReturn( $errorData401 );

		$result = $api->get( $path );

		// Assertions: Should return the original 401 error
		$this->assertFalse( $result['success'] );
		$this->assertEquals( 401, $result['code'] );
		$this->assertEquals( $errorData401, $result['data'] );
	}


	public function test_request_handles_wp_error() {
		$api     = $this->createApiInstance();
		$path    = 'calendar/v3/users/me/calendarList';
		$url     = "https://www.googleapis.com/{$path}";
		$wpError = new WP_Error( 'http_request_failed', 'Could not resolve host' );

		// Mock wp_remote_request to return WP_Error
		$wpRemoteMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
		$wpRemoteMock->expects( $this->once() )
			->with( $url, $this->anything() )
			->willReturn( $wpError );

		// These should not be called
		$responseCodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_retrieve_response_code' );
		$responseCodeMock->expects( $this->never() );
		$jsonDecodeMock = $this->getFunctionMock( self::API_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->never() );

		// Get the result
		$result = $api->get( $path );

		$this->assertFalse( $result['success'] );
		$this->assertNull( $result['code'] );
		$this->assertIsArray( $result['data'] );
		$this->assertArrayHasKey( 'wp_error', $result['data'] );
		$this->assertIsArray( $result['data']['wp_error'] );
		$this->assertEquals( 'http_request_failed', $result['data']['wp_error']['code'] );
		$this->assertEquals( 'Could not resolve host', $result['data']['wp_error']['message'] );

	}


}
