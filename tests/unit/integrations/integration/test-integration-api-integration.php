<?php

namespace QuillBooking\Tests\Integration; // Match the namespace of the class being tested

// Use WP_UnitTestCase if you need WP environment/DB setup for Integration mock or WP functions
// Use PHPUnit\Framework\TestCase if not, but ensure WP functions are stubbed/mocked
// For this example, assuming WP_UnitTestCase might be needed for Integration or WP functions
use WP_UnitTestCase;
use phpmock\phpunit\PHPMock;
use QuillBooking\Integration\API as AbstractAPI;
use QuillBooking\Integration\Integration; // Dependency for constructor
use WP_Error;

// Concrete implementation for testing the abstract class
// Needs to be defined BEFORE the test class uses it.
class ConcreteAPIForTesting extends AbstractAPI {

	// Store args passed to request_remote for assertion
	public $lastRequestRemoteArgs = null;
	// Control the return value of request_remote for different test scenarios
	public $requestRemoteReturnValue = null;

	// We MUST implement the abstract method
	public function request_remote( $method, $path, $body = null ) {
		$this->lastRequestRemoteArgs = func_get_args(); // Store arguments
		// Return whatever the test configured it to return
		if ( $this->requestRemoteReturnValue instanceof \Exception ) {
			// Allow throwing exceptions if needed by a test
			throw $this->requestRemoteReturnValue;
		}
		return $this->requestRemoteReturnValue;
	}

	// Expose protected method for direct testing
	public function testPrepareResponse( $success, $code, $data ) {
		return $this->prepare_response( $success, $code, $data );
	}
}


class Test_Integration_Api_Integration extends WP_UnitTestCase {
	// Or extend PHPUnit\Framework\TestCase

	use PHPMock;

	/** @var Integration|\PHPUnit\Framework\MockObject\MockObject */
	private $integrationMock;

	// Namespace where the global functions are CALLED FROM within the Abstract API class
	private const ABSTRACT_API_NAMESPACE = 'QuillBooking\Integration';

	protected function setUp(): void {
		parent::setUp(); // Needed for WP_UnitTestCase

		// Mock the Integration dependency needed for the constructor
		$this->integrationMock = $this->createMock( Integration::class );

		// --- Mock WP functions called by the AbstractAPI methods ---

		// Mock is_wp_error
		$this->getFunctionMock( self::ABSTRACT_API_NAMESPACE, 'is_wp_error' )
			->expects( $this->any() )->willReturnCallback( fn( $thing) => $thing instanceof WP_Error );

		// Mock wp_remote_retrieve_response_code
		$this->getFunctionMock( self::ABSTRACT_API_NAMESPACE, 'wp_remote_retrieve_response_code' )
			->expects( $this->any() )->willReturnCallback(
				function ( $response ) {
					if ( is_wp_error( $response ) ) {
						return null;
					}
					return $response['response']['code'] ?? null; // Simulate WP behavior
				}
			);

		// Mock json_decode
		$this->getFunctionMock( self::ABSTRACT_API_NAMESPACE, 'json_decode' )
			->expects( $this->any() )->willReturnCallback(
				function ( $string, $assoc = false ) {
					// Handle potential non-string input if needed, though wp_remote_retrieve_body usually gives string
					if ( ! is_string( $string ) ) {
						return null;
					}
					return \json_decode( $string, $assoc ); // Use real decode
				}
			);

		// Mock http_build_query (used by get method)
		$this->getFunctionMock( self::ABSTRACT_API_NAMESPACE, 'http_build_query' )
			->expects( $this->any() )->willReturnCallback( fn( $d) => \http_build_query( $d ) ); // Use real func

		// Mock json_encode (used by post, put, patch, delete methods)
		$this->getFunctionMock( self::ABSTRACT_API_NAMESPACE, 'json_encode' )
			->expects( $this->any() )->willReturnCallback( fn( $d) => \json_encode( $d ) ); // Use real func
	}

	protected function tearDown(): void {
		parent::tearDown(); // Needed for WP_UnitTestCase & PHPMock cleanup
	}

	/** Helper to create instance of concrete test class */
	private function createConcreteApiInstance(): ConcreteAPIForTesting {
		// Pass the mocked Integration dependency
		return new ConcreteAPIForTesting( $this->integrationMock );
	}

	// --- Tests for prepare_response() ---

	public function test_prepare_response_formats_correctly() {
		$api      = $this->createConcreteApiInstance();
		$success  = true;
		$code     = 201;
		$data     = array(
			'id'      => '123',
			'message' => 'Created',
		);
		$expected = array(
			'success' => $success,
			'code'    => $code,
			'data'    => $data,
		);

		// Call the exposed helper method
		$result = $api->testPrepareResponse( $success, $code, $data );

		$this->assertEquals( $expected, $result );
	}

	public function test_prepare_response_formats_failure() {
		$api      = $this->createConcreteApiInstance();
		$success  = false;
		$code     = 404;
		$data     = array( 'error' => 'Not Found' );
		$expected = array(
			'success' => $success,
			'code'    => $code,
			'data'    => $data,
		);

		$result = $api->testPrepareResponse( $success, $code, $data );

		$this->assertEquals( $expected, $result );
	}

	// --- Tests for request() ---

	public function test_request_success_path() {
		$api          = $this->createConcreteApiInstance();
		$method       = 'GET';
		$path         = 'items/1';
		$body         = null;
		$responseData = array(
			'id'   => 1,
			'name' => 'Item One',
		);
		$responseCode = 200;
		// Simulate successful WP response array from request_remote
		$api->requestRemoteReturnValue = array(
			'body'     => json_encode( $responseData ),
			'response' => array( 'code' => $responseCode ),
		);
		$expectedResult                = array(
			'success' => true,
			'code'    => $responseCode,
			'data'    => $responseData,
		);

		// Execute
		$result = $api->request( $method, $path, $body );

		// Assert request_remote was called correctly
		$this->assertNotNull( $api->lastRequestRemoteArgs );
		$this->assertEquals( array( $method, $path, $body ), $api->lastRequestRemoteArgs );
		// Assert final result
		$this->assertEquals( $expectedResult, $result );
	}

	public function test_request_handles_wp_error_from_remote() {
		$api     = $this->createConcreteApiInstance();
		$method  = 'GET';
		$path    = 'items/error';
		$wpError = new WP_Error( 'http_fail', 'Network Error' );
		// Configure request_remote to return WP_Error
		$api->requestRemoteReturnValue = $wpError;
		$expectedResult                = array(
			'success' => false,
			'code'    => null,
			'data'    => array(
				'wp_error' => array(
					'code'    => 'http_fail',
					'message' => 'Network Error',
				),
			),
		);

		// Execute
		$result = $api->request( $method, $path );

		// Assert final result structure for WP_Error
		$this->assertEquals( $expectedResult, $result );
		// Assert request_remote was still called
		$this->assertNotNull( $api->lastRequestRemoteArgs );
		$this->assertEquals( array( $method, $path, null ), $api->lastRequestRemoteArgs );
	}

	public function test_request_handles_401_error_from_remote() {
		$api          = $this->createConcreteApiInstance();
		$method       = 'GET';
		$path         = 'secure/resource';
		$errorBody    = array( 'error' => 'auth_required' );
		$responseCode = 401;
		// Simulate 401 WP response array from request_remote
		$api->requestRemoteReturnValue = array(
			'body'     => json_encode( $errorBody ),
			'response' => array( 'code' => $responseCode ),
		);
		$expectedResult                = array(
			'success' => false,
			'code'    => $responseCode,
			'data'    => $errorBody,
		);

		// Execute
		$result = $api->request( $method, $path );

		// Assert final result
		$this->assertEquals( $expectedResult, $result );
		// Note: The 401 refresh logic IS NOT in the abstract class, so we only test that 401 is handled here.
	}

	public function test_request_handles_other_error_code_from_remote() {
		$api          = $this->createConcreteApiInstance();
		$method       = 'POST';
		$path         = 'create/item';
		$errorBody    = array(
			'error'   => 'validation_failed',
			'details' => array( 'field' => 'required' ),
		);
		$responseCode = 400; // Example: Bad Request
		// Simulate 400 WP response array from request_remote
		$api->requestRemoteReturnValue = array(
			'body'     => json_encode( $errorBody ),
			'response' => array( 'code' => $responseCode ),
		);
		$expectedResult                = array(
			'success' => false,
			'code'    => $responseCode,
			'data'    => $errorBody,
		);

		// Execute
		$result = $api->request( $method, $path );

		// Assert final result
		$this->assertEquals( $expectedResult, $result );
	}

	public function test_request_unsets_links_on_success() {
		$api    = $this->createConcreteApiInstance();
		$method = 'GET';
		$path   = 'resource/with/links';
		// Simulate a HAL or similar response with _links
		$responseDataWithLinks = array(
			'id'     => 5,
			'prop'   => 'value',
			'_links' => array( 'self' => array( 'href' => '/resource/5' ) ),
		);
		// Expected data after _links is removed
		$responseDataWithoutLinks      = array(
			'id'   => 5,
			'prop' => 'value',
		);
		$responseCode                  = 200;
		$api->requestRemoteReturnValue = array(
			'body'     => json_encode( $responseDataWithLinks ),
			'response' => array( 'code' => $responseCode ),
		);
		$expectedResult                = array(
			'success' => true,
			'code'    => $responseCode,
			'data'    => $responseDataWithoutLinks,
		);

		// Execute
		$result = $api->request( $method, $path );

		// Assert that the _links key is gone from the data part
		$this->assertEquals( $expectedResult, $result );
	}


	// --- Tests for get(), post(), put(), patch(), delete() ---
	// These test that the public verb methods correctly call the main request() method

	/**
	 * @dataProvider httpMethodProvider
	 */
	public function test_http_verb_methods_call_request_correctly( string $verbMethod, string $expectedHttpMethod, bool $bodyIsEncoded ) {
		$path      = 'api/resource';
		$bodyArray = array(
			'param1' => 'val1',
			'nested' => array( 'a' ),
		);
		// Expected body passed to request() method: null for GET, JSON string for others
		$expectedBodyForRequest = $bodyIsEncoded ? json_encode( $bodyArray ) : null;
		// Expected path passed to request() method: may include query string for GET
		$expectedPathForRequest = $verbMethod === 'get' ? $path . '?' . http_build_query( $bodyArray ) : $path;

		// Create partial mock of our concrete class, mocking only 'request'
		$apiMock = $this->getMockBuilder( ConcreteAPIForTesting::class )
			->setConstructorArgs( array( $this->integrationMock ) )
			->onlyMethods( array( 'request' ) ) // Mock only the main request method
			->getMock();

		// Expect 'request' to be called once with the correct arguments
		$apiMock->expects( $this->once() )
			->method( 'request' )
			->with(
				$this->equalTo( $expectedHttpMethod ), // Check method verb
				$this->equalTo( $expectedPathForRequest ), // Check path (with query string for GET)
				$this->equalTo( $expectedBodyForRequest ) // Check body (null or JSON)
			)
			->willReturn( array( 'success' => true ) ); // Return simple value, content doesn't matter here

		// Call the specific verb method being tested
		switch ( $verbMethod ) {
			case 'get':
				$apiMock->$verbMethod( $path, $bodyArray ); // Pass array as args for GET
				break;
			case 'delete':
			case 'post':
				$apiMock->$verbMethod( $path, $bodyArray ); // Pass array as body
				break;
			case 'put':
			case 'patch':
				$apiMock->$verbMethod( $path, $bodyArray ); // Pass array as body (required)
				break;
		}
		// No assertion needed here, the ->expects() handles the test verification
	}

	public static function httpMethodProvider(): array {
		return array(
			// methodToCall, expectedHttpMethodInRequest, bodyShouldBeJsonEncoded
			'GET'    => array( 'get', 'GET', false ),
			'POST'   => array( 'post', 'POST', true ),
			'PUT'    => array( 'put', 'PUT', true ),
			'PATCH'  => array( 'patch', 'PATCH', true ),
			'DELETE' => array( 'delete', 'DELETE', true ),
		);
	}

	public function test_get_without_args_calls_request_correctly() {
		$path    = 'simple/path';
		$apiMock = $this->getMockBuilder( ConcreteAPIForTesting::class )
			->setConstructorArgs( array( $this->integrationMock ) )
			->onlyMethods( array( 'request' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'request' )->with( 'GET', $path, null ); // No query string, null body
		$apiMock->get( $path ); // Call without args
	}

	public function test_post_without_body_calls_request_correctly() {
		$path    = 'action/trigger';
		$apiMock = $this->getMockBuilder( ConcreteAPIForTesting::class )
			->setConstructorArgs( array( $this->integrationMock ) )
			->onlyMethods( array( 'request' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'request' )->with( 'POST', $path, null ); // Null body
		$apiMock->post( $path ); // Call without body
	}

	public function test_delete_without_body_calls_request_correctly() {
		$path    = 'resource/123';
		$apiMock = $this->getMockBuilder( ConcreteAPIForTesting::class )
			->setConstructorArgs( array( $this->integrationMock ) )
			->onlyMethods( array( 'request' ) )->getMock();
		$apiMock->expects( $this->once() )->method( 'request' )->with( 'DELETE', $path, null ); // Null body
		$apiMock->delete( $path ); // Call without body
	}
} // End class
