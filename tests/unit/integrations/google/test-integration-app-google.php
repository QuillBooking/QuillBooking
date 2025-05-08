<?php

namespace QuillBooking\Tests\Integrations\Google;

use PHPUnit\Framework\TestCase;
use phpmock\phpunit\PHPMock; // Use PHPMock for global functions
use QuillBooking\Integrations\Google\App;
use QuillBooking\Integrations\Google\Integration; // Dependency to mock
use QuillBooking\Integrations\Google\API;         // Used internally, may need mocking via global func mocks
use QuillBooking\Models\Calendar_Model; // Used internally, may need mocking/stubbing
use QuillBooking_Base_Test_Case;
use WP_Error;

// Assume bootstrap loads necessary WordPress stubs/functions like WP_Error

class Test_Integration_App_Google extends QuillBooking_Base_Test_Case {


	use PHPMock; // Enable PHPMock trait

	/**
	 * Mock object for the Integration dependency.
	 *
	 * @var Integration|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $integrationMock;

	/**
	 * Mock object for the 'accounts' handler provided by Integration.
	 * Needs methods like add_account, get_account, update_account.
	 *
	 * @var \PHPUnit\Framework\MockObject\MockObject
	 */
	private $accountsMock;

	// Namespace where the global functions (like admin_url, wp_remote_post)
	// are CALLED from within the App class being tested.
	private const APP_NAMESPACE = 'QuillBooking\Integrations\Google';

	public function setUp(): void {
		parent::setUp();

		// 1. Mock Object Dependencies using PHPUnit's createMock
		$this->integrationMock = $this->createMock( Integration::class );

		// Create a generic mock object for the 'accounts' property/handler.
		// We define expected methods on it later in tests or universally here if simple.
		$this->accountsMock = $this->getMockBuilder( \stdClass::class )
			->disableOriginalConstructor()
			->addMethods(
				array(
					'add_account',
					'get_account',
					'update_account',
				)
			)
			->getMock();

		// Assign the mock accounts object to the mock integration object
		// Assuming 'accounts' is a public property or accessed via a getter we haven't mocked.
		// If it's accessed via a method like $integration->getAccounts(), mock that method instead.
		$this->integrationMock->accounts = $this->accountsMock;

		// 2. Mock Global Functions (used WITHIN App class) using PHPMock
		// Mock is_wp_error universally for convenience in this test suite
		$isWpErrorMock = $this->getFunctionMock( self::APP_NAMESPACE, 'is_wp_error' );
		$isWpErrorMock->expects( $this->any() ) // Called potentially many times
			->willReturnCallback( fn( $thing) => $thing instanceof WP_Error ); // Use actual check

		// Mock json_decode universally - usually safe to use the real one via callback
		$jsonDecodeMock = $this->getFunctionMock( self::APP_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->any() )
			->willReturnCallback( fn( $string, $assoc = false) => \json_decode( $string, $assoc ) );

		// Mock wp_remote_retrieve_body universally, returning body if response isn't WP_Error

		// Mock esc_html__ for error messages - just return the text
		$escHtmlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'esc_html__' );
		$escHtmlMock->expects( $this->any() )
			->willReturnCallback( fn( $text, $domain) => $text );

		// Reset $_GET before each test as App class reads from it
		$GLOBALS['_GET'] = array();
	}

	protected function tearDown(): void {
		$GLOBALS['_GET'] = array();
		parent::tearDown(); // Crucial for PHPMock cleanup
	}
	/**
	 * Helper to create an App instance with mocked dependencies injected.
	 */
	private function createAppInstance(): App {
		// Pass the PHPUnit mock object for Integration to the constructor
		return new App( $this->integrationMock );
	}

	// --- Test Cases ---


	public function test_refresh_tokens_success() {
		$app                   = $this->createAppInstance();
		$refresh_token         = 'valid-refresh-token';
		$account_id            = 'acc-123';
		$app_credentials       = array(
			'client_id'     => 'the-client-id',
			'client_secret' => 'the-client-secret',
		);
		$new_token_response    = array(
			'access_token' => 'new-access-token',
			'expires_in'   => 3599,
		);
		$account_data_before   = array(
			'name'   => 'test@example.com',
			'tokens' => array(
				'access_token'  => 'old-access-token',
				'refresh_token' => $refresh_token,
			),
		);
		$expected_final_tokens = array(
			'access_token'  => 'new-access-token',
			'refresh_token' => $refresh_token,
		);

		// 1. Mock get_setting
		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )
			->with( 'app' )
			->willReturn( $app_credentials );

		// 2. Mock wp_remote_post
		$mock_wp_response = array(
			'body'     => json_encode( $new_token_response ),
			'response' => array( 'code' => 200 ),
		);
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )
			->with(
				'https://accounts.google.com/o/oauth2/token',
				$this->callback(
					function ( $args ) use ( $app_credentials, $refresh_token ) {
						$body_params = $args['body'];
						return isset( $body_params['grant_type'], $body_params['client_id'], $body_params['client_secret'], $body_params['refresh_token'] ) &&
							$body_params['grant_type'] === 'refresh_token' &&
							$body_params['client_id'] === $app_credentials['client_id'] &&
							$body_params['client_secret'] === $app_credentials['client_secret'] &&
							$body_params['refresh_token'] === $refresh_token;
					}
				)
			)
			->willReturn( $mock_wp_response );

		// 3. Mock wp_remote_retrieve_body
		$retrieveBodyMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_retrieve_body' );
		$retrieveBodyMock->expects( $this->once() )
			->with( $mock_wp_response )
			->willReturn( json_encode( $new_token_response ) );

		// 4. Mock get_account
		$this->accountsMock->expects( $this->once() )
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( $account_data_before );

		// 5. Mock update_account
		$this->accountsMock->expects( $this->once() )
			->method( 'update_account' )
			->with(
				$account_id,
				$this->callback(
					function ( $update_data ) use ( $expected_final_tokens ) {
						return isset( $update_data['tokens'] ) &&
							$update_data['tokens'] === $expected_final_tokens;
					}
				)
			)
			->willReturn( true );

		// Execute
		$result = $app->refresh_tokens( $refresh_token, $account_id );

		// Assert
		$this->assertEquals( $expected_final_tokens, $result );
	}


	public function test_refresh_tokens_returns_wp_error_if_refresh_token_empty() {
		$app                 = $this->createAppInstance();
		$account_id          = 'acc-123';
		$empty_refresh_token = '';

		// No mocks needed as it should return early

		$result = $app->refresh_tokens( $empty_refresh_token, $account_id );

		// return wp_error
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'missing_required_fields', $result->get_error_code() );
		$this->assertEquals( 'Missing refresh token or account ID.', $result->get_error_message() );
	}

	public function test_refresh_tokens_returns_wp_error_if_get_tokens_fails() {
		$app             = $this->createAppInstance();
		$refresh_token   = 'valid-refresh-token';
		$account_id      = 'acc-123';
		$app_credentials = array(
			'client_id'     => 'the-client-id',
			'client_secret' => 'the-client-secret',
		);

		// --- Mock Dependencies ---
		// 1. Mock integration->get_setting
		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )
			->with( 'app' )
			->willReturn( $app_credentials );

		// 2. Mock wp_remote_post to simulate failure from get_tokens
		$wpError          = new WP_Error( 'token_fail', 'Failed to get token' );
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() ) // Expect get_tokens to be called
			->willReturn( $wpError ); // Simulate WP_Error response

		// is_wp_error mock in setUp handles checking this

		// --- Execute Method Under Test ---
		$result = $app->refresh_tokens( $refresh_token, $account_id );

		// return wp_error
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'token_refresh_failed', $result->get_error_code() );
		$this->assertEquals( 'Failed to refresh the access token.', $result->get_error_message() );
		// Ensure account update methods were NOT called
		$this->accountsMock->expects( $this->never() )->method( 'get_account' );
		$this->accountsMock->expects( $this->never() )->method( 'update_account' );
	}

	public function test_refresh_tokens_returns_wp_error_if_account_data_missing() {
		$app                = $this->createAppInstance();
		$refresh_token      = 'valid-refresh-token';
		$account_id         = 'acc-123';
		$app_credentials    = array(
			'client_id'     => 'the-client-id',
			'client_secret' => 'the-client-secret',
		);
		$new_token_response = array(
			'access_token' => 'new-access-token',
			'expires_in'   => 3599,
		);

		// 1. Mock get_setting
		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )
			->with( 'app' )
			->willReturn( $app_credentials );

		// 2. Mock wp_remote_post
		$mock_generic_wp_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => 'dummy',
		);
		$wpRemotePostMock         = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )->willReturn( $mock_generic_wp_response );

		// 3. Mock wp_remote_retrieve_body
		$retrieveBodyMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_retrieve_body' );
		$retrieveBodyMock->expects( $this->once() )
			->with( $mock_generic_wp_response )
			->willReturn( json_encode( $new_token_response ) );

		// 4. Mock get_account -> return null (simulate missing account)
		$this->accountsMock->expects( $this->once() )
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( null );

		// 5. update_account should NOT be called
		$this->accountsMock->expects( $this->never() )
			->method( 'update_account' );

		// Execute
		$result = $app->refresh_tokens( $refresh_token, $account_id );

		// return wp_error
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'account_not_found', $result->get_error_code() );
		$this->assertEquals( 'Account not found.', $result->get_error_message() );
	}

	// Test get_app_credentials() [SUCCESS]
	public function test_get_app_credentials_success() {
		$app         = $this->createAppInstance();
		$credentials = array(
			'client_id'     => 'test-id',
			'client_secret' => 'test-secret',
		);

		// Configure the mock Integration object (using PHPUnit methods)
		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' ) // Method called on the Integration object
			->with( 'app' )           // Expected argument
			->willReturn( $credentials ); // Value to return

		$result = $app->get_app_credentials();

		$this->assertEquals( $credentials, $result );
	}

	// Test get_app_credentials() [FAILURE - Missing ID]
	public function test_get_app_credentials_missing_id() {
		$app         = $this->createAppInstance();
		$credentials = array( 'client_secret' => 'test-secret' ); // Missing client_id

		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )
			->with( 'app' )
			->willReturn( $credentials );

		$result = $app->get_app_credentials();

		$this->assertFalse( $result );
	}

	// Test get_app_credentials() [FAILURE - Missing Secret]
	public function test_get_app_credentials_missing_secret() {
		$app         = $this->createAppInstance();
		$credentials = array( 'client_id' => 'test-id' ); // Missing client_secret

		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )
			->with( 'app' )
			->willReturn( $credentials );

		$result = $app->get_app_credentials();

		$this->assertFalse( $result );
	}

	// Test get_app_credentials() [FAILURE - Setting Not Set]
	public function test_get_app_credentials_not_set() {
		$app = $this->createAppInstance();

		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )
			->with( 'app' )
			->willReturn( null ); // Simulate setting not existing

		$result = $app->get_app_credentials();

		$this->assertFalse( $result );
	}

	// Test get_redirect_uri()
	public function test_get_redirect_uri() {
		$app          = $this->createAppInstance();
		$expected_uri = 'http://test.com/wp-admin/admin.php';

		// Mock the global admin_url function using PHPMock
		$adminUrlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' );
		$adminUrlMock->expects( $this->once() )
			->with( 'admin.php' ) // Argument check
			->willReturn( $expected_uri ); // Return value

		$this->assertEquals( $expected_uri, $app->get_redirect_uri() );
	}

	// Test get_auth_uri() [SUCCESS]
	public function test_get_auth_uri_builds_correct_url() {
		$app                  = $this->createAppInstance();
		$host_id              = 123;
		$credentials          = array(
			'client_id'     => 'google-client-id',
			'client_secret' => 'google-client-secret',
		);
		$redirect_uri         = 'http://test.local/wp-admin/admin.php';
		$encoded_redirect_uri = urlencode( $redirect_uri );
		$scopes               = array(
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar.readonly',
			'https://www.googleapis.com/auth/calendar.events',
		);
		$encoded_scopes       = urlencode( implode( ' ', $scopes ) );

		// --- Mock Dependencies ---
		// 1. Mock Integration object's method (used by get_app_credentials)
		$this->integrationMock->method( 'get_setting' )->with( 'app' )->willReturn( $credentials );

		// 2. Mock global functions using PHPMock (used by get_redirect_uri)
		$adminUrlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' );
		$adminUrlMock->expects( $this->once() ) // <<< FIX HERE
			->with( 'admin.php' )
			->willReturn( $redirect_uri );

		// Mock global urlencode and urlencode_deep needed for building the args
		// urlencode_deep is tricky, for this test, let's assume it just encodes the scopes string.
		// We can mock it to simply return the pre-encoded scopes string for simplicity.
		$urlencodeDeepMock = $this->getFunctionMock( self::APP_NAMESPACE, 'urlencode_deep' );
		$urlencodeDeepMock->expects( $this->once() )
			->with( implode( ' ', $scopes ) ) // It gets called with the unencoded scopes array/string
			->willReturn( $encoded_scopes ); // We make it return the simple urlencode result

		$urlencodeMock = $this->getFunctionMock( self::APP_NAMESPACE, 'urlencode' );
		$urlencodeMock->expects( $this->once() )
			->with( $redirect_uri ) // It gets called with the redirect URI
			->willReturn( $encoded_redirect_uri ); // Return the urlencoded version

		// Mock add_query_arg - Crucial WordPress function for URL building
		$addQueryArgMock = $this->getFunctionMock( self::APP_NAMESPACE, 'add_query_arg' );
		$expectedBaseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
		// Set expectation for how add_query_arg should be called
		$addQueryArgMock->expects( $this->once() )
			->with(
				// Check the arguments passed TO add_query_arg
				$this->callback(
					function ( $args_array ) use ( $credentials, $encoded_scopes, $encoded_redirect_uri, $host_id ) {
						return isset( $args_array['response_type'] ) && $args_array['response_type'] === 'code' &&
						isset( $args_array['client_id'] ) && $args_array['client_id'] === $credentials['client_id'] &&
						isset( $args_array['scope'] ) && $args_array['scope'] === $encoded_scopes && // Compare encoded
						isset( $args_array['redirect_uri'] ) && $args_array['redirect_uri'] === $encoded_redirect_uri && // Compare encoded
						isset( $args_array['state'] ) && $args_array['state'] === "quillbooking-g-{$host_id}" &&
						isset( $args_array['prompt'] ) && $args_array['prompt'] === 'consent' &&
						isset( $args_array['access_type'] ) && $args_array['access_type'] === 'offline';
					}
				),
				$this->equalTo( $expectedBaseUrl ) // Check the base URL argument
			)
			// Make the mock return a predictable full URL string
			->willReturn( $expectedBaseUrl . '?response_type=code&client_id=' . $credentials['client_id'] . '&scope=' . $encoded_scopes . '&redirect_uri=' . $encoded_redirect_uri . '&state=quillbooking-g-' . $host_id . '&prompt=consent&access_type=offline' );

		// --- Execute Method Under Test ---
		$auth_uri_result = $app->get_auth_uri( $host_id );

		// --- Assert Result ---
		// Check the final URL returned by the mocked add_query_arg
		$this->assertStringContainsString( $expectedBaseUrl, $auth_uri_result );
		$this->assertStringContainsString( 'client_id=' . $credentials['client_id'], $auth_uri_result );
		$this->assertStringContainsString( 'scope=' . $encoded_scopes, $auth_uri_result );
		$this->assertStringContainsString( 'redirect_uri=' . $encoded_redirect_uri, $auth_uri_result );
		$this->assertStringContainsString( 'state=quillbooking-g-' . $host_id, $auth_uri_result );
		$this->assertStringContainsString( 'prompt=consent', $auth_uri_result );
		$this->assertStringContainsString( 'access_type=offline', $auth_uri_result );
	}

	// Test get_auth_uri() [FAILURE - Missing Credentials]
	public function test_get_auth_uri_returns_wp_error_if_credentials_missing() {
		$app     = $this->createAppInstance();
		$host_id = 123;

		// Simulate missing credentials by having get_setting return false
		// ->method() implies ->expects($this->any()) unless chained with ->expects()
		$this->integrationMock->method( 'get_setting' )->with( 'app' )->willReturn( false );

		// Mock admin_url, but expect it *never* to be called in this error scenario
		$adminUrlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' );
		$adminUrlMock->expects( $this->never() ); // <<< FIX HERE: Change once() to never()

		// --- Execute ---
		$result = $app->get_auth_uri( $host_id );

		// --- Assert ---
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_app_credentials', $result->get_error_code() );
	}


	// Test get_tokens() [SUCCESS]
	public function test_get_tokens_success() {
		$app                    = $this->createAppInstance();
		$query                  = array(
			'grant_type' => 'authorization_code',
			'code'       => 'auth-code',
		);
		$expected_tokens        = array(
			'access_token'  => 'acc-tok',
			'refresh_token' => 'ref-tok',
			'expires_in'    => 3600,
		);
		$mock_wp_response_array = array( // This is what our wp_remote_post mock will return
			'body'     => json_encode( $expected_tokens ),
			'response' => array( 'code' => 200 ),
		);

		// --- Mock Dependencies ---
		// Mock global wp_remote_post using PHPMock
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )
			->with(
				'https://accounts.google.com/o/oauth2/token', // URL check
				array( 'body' => $query )                             // Body args check
			)
			->willReturn( $mock_wp_response_array ); // Return the simulated successful WP response array

		// wp_remote_retrieve_body and json_decode are mocked in setUp to work generally,
		// so they should correctly process the $mock_wp_response_array['body'] here.
		// We don't need to override them unless specific behavior is needed for this test.

		// --- Execute Method Under Test ---
		$tokens = $app->get_tokens( $query );

		// --- Assert Result ---
		$this->assertEquals( $expected_tokens, $tokens );
	}

	// Test get_tokens() [FAILURE - WP_Error]
	public function test_get_tokens_returns_false_on_wp_error() {
		$app     = $this->createAppInstance();
		$query   = array(
			'grant_type' => 'authorization_code',
			'code'       => 'auth-code',
		);
		$wpError = new WP_Error( 'http_fail', 'Request failed' );

		// Mock wp_remote_post to return WP_Error
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )
			->with( $this->anything(), $this->anything() ) // Don't need specific arg checks here
			->willReturn( $wpError ); // Return the WP_Error object

		// is_wp_error mock in setUp handles checking this $wpError object.
		// wp_remote_retrieve_body mock in setUp handles returning empty string for WP_Error.

		$tokens = $app->get_tokens( $query );

		$this->assertFalse( $tokens );
	}

	// Test get_tokens() [FAILURE - Missing Access Token in Response]
	public function test_get_tokens_returns_false_if_access_token_missing() {
		$app                        = $this->createAppInstance();
		$query                      = array(
			'grant_type' => 'authorization_code',
			'code'       => 'auth-code',
		);
		$invalid_response_body_json = json_encode( array( 'error' => 'invalid_grant' ) ); // No access_token
		$mock_wp_response_array     = array(
			'body'     => $invalid_response_body_json,
			'response' => array( 'code' => 400 ), // Simulate a WP response array with error body
		);

		// Mock wp_remote_post to return the error response
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )->willReturn( $mock_wp_response_array );

		// The general json_decode mock from setUp should decode this JSON string.

		$tokens = $app->get_tokens( $query );

		$this->assertFalse( $tokens ); // Should return false because 'access_token' is missing
	}



}
