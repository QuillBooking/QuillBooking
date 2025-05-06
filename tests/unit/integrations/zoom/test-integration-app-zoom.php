<?php

namespace QuillBooking\Tests\Integrations\Zoom; // Make sure namespace matches file location

use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Zoom\App; // Class under test
use QuillBooking\Integrations\Zoom\Integration as ZoomIntegration; // Dependency type hint
use QuillBooking_Base_Test_Case;
use WP_Error;

class Test_Integration_App_Zoom extends QuillBooking_Base_Test_Case {


	use PHPMock;

	/**
	 * Mock object for the Zoom Integration dependency.
	 *
	 * @var ZoomIntegration|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $integrationMock;

	/**
	 * Mock object for the 'accounts' handler.
	 *
	 * @var \PHPUnit\Framework\MockObject\MockObject
	 */
	private $accountsMock;

	// Namespace where global functions are CALLED FROM within Zoom\App
	private const APP_NAMESPACE = 'QuillBooking\Integrations\Zoom';
	// Namespace where global functions are CALLED FROM within Zoom\API
	private const API_NAMESPACE = 'QuillBooking\Integrations\Zoom'; // Usually same as App unless API is elsewhere
	// Namespace where global functions are CALLED FROM within parent Integration\API
	private const PARENT_API_NAMESPACE = 'QuillBooking\Integration';


	public function setUp(): void {
		parent::setUp();

		$this->integrationMock           = $this->createMock( ZoomIntegration::class ); // Mock ZoomIntegration
		$this->accountsMock              = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'add_account', 'get_account', 'update_account' ) )
			->getMock();
		$this->integrationMock->accounts = $this->accountsMock; // Assign mock accounts

		// Mock global functions commonly used (can be moved to specific tests if needed)
		// $this->getFunctionMock( self::APP_NAMESPACE, 'is_wp_error' )
		// ->expects( $this->any() )->willReturnCallback( fn( $thing) => $thing instanceof WP_Error );
		// $this->getFunctionMock( self::APP_NAMESPACE, 'json_decode' )
		// ->expects( $this->any() )->willReturnCallback( fn( $s, $a = false) => \json_decode( $s, $a ) );
		$this->getFunctionMock( self::APP_NAMESPACE, 'esc_html__' )
			->expects( $this->any() )->willReturnCallback( fn( $t, $d) => $t );

		// Mock WP functions used in parent API class if needed by maybe_add_settings API call check
		// $this->getFunctionMock( self::PARENT_API_NAMESPACE, 'is_wp_error' )
		// ->expects( $this->any() )->willReturnCallback( fn( $thing) => $thing instanceof WP_Error );
		// $this->getFunctionMock( self::PARENT_API_NAMESPACE, 'json_decode' )
		// ->expects( $this->any() )->willReturnCallback( fn( $s, $a = false) => \json_decode( $s, $a ) );
		$this->getFunctionMock( self::PARENT_API_NAMESPACE, 'wp_remote_retrieve_response_code' )
			->expects( $this->any() )->willReturnCallback( fn( $r) => is_wp_error( $r ) ? null : ( $r['response']['code'] ?? null ) );

		$GLOBALS['_GET'] = array(); // Reset $_GET
	}

	protected function tearDown(): void {
		$GLOBALS['_GET'] = array();
		parent::tearDown();
	}

	/** Helper to create Zoom App instance */
	private function createAppInstance(): App {
		return new App( $this->integrationMock );
	}

	// --- Tests for get_app_credentials ---


	public function test_refresh_tokens_success() {
		$app                 = $this->createAppInstance(); // Create instance first
		$account_id          = 'acc-123'; // Use a distinct account ID if needed
		$refresh_token       = 'zoom-rt-old';
		$credentials         = array(
			'client_id'     => 'the-client-id',
			'client_secret' => 'the-client-secret',
		);
		$account_data_before = array(
			'id'     => $account_id,
			'app'    => $credentials, // Required by get_app_credentials & get_auth_header
			'tokens' => array(
				'access_token'  => 'zoom-at-old',
				'refresh_token' => $refresh_token,
			),
		);
		$expected_basic_auth = 'Basic ' . base64_encode( $credentials['client_id'] . ':' . $credentials['client_secret'] );
		$expected_new_tokens = array( // API response
			'access_token'  => 'zoom-at-new',
			'refresh_token' => 'zoom-rt-new',
		);
		$mock_wp_response    = array( /* ... */ ); // Based on expected_new_tokens
		$base64Mock          = $this->getFunctionMock( self::APP_NAMESPACE, 'base64_encode' );
		$base64Mock->expects( $this->once() ) // Expect it once from get_authorization_header
			->with( $credentials['client_id'] . ':' . $credentials['client_secret'] )
			// Use willReturn with the actual expected encoded string
			->willReturn( \base64_encode( $credentials['client_id'] . ':' . $credentials['client_secret'] ) );
		// What the code actually saves/returns (old refresh token)
		$expected_final_tokens_result = array(
			'access_token'  => 'zoom-at-new',
			'refresh_token' => $refresh_token, // Uses original $refresh_token
		);

		// --- Mock dependencies ---

		// Mock get_account (Called 3 times)
		$this->accountsMock->expects( $this->exactly( 3 ) ) // <<< FIX: Expect 3 calls
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( $account_data_before ); // Return same data each time for this test

		// Mock get_setting (Called once by get_app_credentials indirectly - wait, Zoom uses get_account)
		// >> REMOVE get_setting mock if not used by Zoom\App::get_app_credentials <<
		// $this->integrationMock->expects( $this->once() )
		// ->method( 'get_setting' ) ...

		// Mock base64_encode (Called once by get_authorization_header)

		// Mock wp_remote_post (Called once by get_tokens)
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )
			->with(
				'https://zoom.us/oauth/token',
				// Callback needs to check body for refresh_token grant_type
				// AND header for Basic Auth
				$this->callback(
					function ( $args ) use ( $refresh_token, $expected_basic_auth ) {
						$body = $args['body'] ?? array();
						// Check required body keys for refresh
						return isset( $body['grant_type'] ) && $body['grant_type'] === 'refresh_token' &&
						isset( $body['refresh_token'] ) && $body['refresh_token'] === $refresh_token &&
						// Check header
						isset( $args['headers']['Authorization'] ) &&
						$args['headers']['Authorization'] === $expected_basic_auth;
					}
				)
			)
			->willReturn( $mock_wp_response );

		// Mock retrieve_body (Called once by get_tokens)
		$retrieveBodyMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_retrieve_body' );
		$retrieveBodyMock->expects( $this->once() )
			->with( $mock_wp_response )
			->willReturn( json_encode( $expected_new_tokens ) );

		// Mock is_wp_error (Called once by get_tokens)
		$isWpErrorMock = $this->getFunctionMock( self::APP_NAMESPACE, 'is_wp_error' );
		$isWpErrorMock->expects( $this->once() )
			->with( $mock_wp_response )
			->willReturn( false );

		// Mock json_decode (Called once by get_tokens)
		$jsonDecodeMock = $this->getFunctionMock( self::APP_NAMESPACE, 'json_decode' );
		$jsonDecodeMock->expects( $this->once() )
			->with( json_encode( $expected_new_tokens ), true )
			->willReturn( $expected_new_tokens );

		// Expect update_account call (Called once by refresh_tokens)
		$this->accountsMock->expects( $this->once() )
			->method( 'update_account' )
			->with( $account_id, array( 'tokens' => $expected_final_tokens_result ) ) // Use corrected expected data
			->willReturn( true ); // Simulate update success

		// --- Execute ---
		$result = $app->refresh_tokens( $refresh_token, $account_id );

		// --- Assert ---
		$this->assertEquals( $expected_final_tokens_result, $result ); // Use corrected expected data
	}

	public function test_get_tokens_fails_on_missing_access_token() {
		$app         = $this->createAppInstance();
		$account_id  = 'zoom-acc-1';
		$credentials = array(
			'client_id'     => 'zoom-client-id-123', // Use distinct values
			'client_secret' => 'zoom-secret-456',
		);
		// --- Ensure account data is complete for get_authorization_header ---
		$account_data = array(
			'id'  => $account_id,
			'app' => $credentials, // Make sure 'app' key with creds is present
		);
		// --- End Ensure ---

		$auth_code_query        = array(
			'grant_type'   => 'authorization_code',
			'code'         => 'some-auth-code',
			'redirect_uri' => 'http://test.site/wp-admin/admin.php',
		);
		$response_body_no_token = json_encode( array( 'token_type' => 'Bearer' ) );
		$mock_wp_response       = array(
			'body'     => $response_body_no_token,
			'response' => array( 'code' => 200 ),
		);
		$expected_basic_auth    = 'Basic ' . base64_encode( $credentials['client_id'] . ':' . $credentials['client_secret'] );

		// Mock dependencies
		// Mock get_account for get_authorization_header
		$this->accountsMock->expects( $this->once() ) // get_authorization_header calls it
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( $account_data );

		// Mock base64_encode (ensure it's mocked, maybe in setUp or here)
		$this->getFunctionMock( self::APP_NAMESPACE, 'base64_encode' )
			->expects( $this->once() ) // Expect it once from get_authorization_header
			->with( $credentials['client_id'] . ':' . $credentials['client_secret'] )
			->willReturn( \base64_encode( $credentials['client_id'] . ':' . $credentials['client_secret'] ) ); // Return real encoding

		// Mock wp_remote_post
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() ) // <<< EXPECTED CALL
			->with(
				'https://zoom.us/oauth/token',
				$this->callback(
					function ( $args ) use ( $auth_code_query, $expected_basic_auth ) {
						// Check body AND header
						return $args['body'] === $auth_code_query &&
							isset( $args['headers']['Authorization'] ) &&
							$args['headers']['Authorization'] === $expected_basic_auth;
					}
				)
			)
			->willReturn( $mock_wp_response );

		// Mock retrieve_body
		$retrieveBodyMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_retrieve_body' );
		$retrieveBodyMock->expects( $this->once() ) // <<< EXPECTED CALL
			->with( $mock_wp_response )
			->willReturn( $response_body_no_token );

		// Mock is_wp_error (ensure it's mocked)
		$this->getFunctionMock( self::APP_NAMESPACE, 'is_wp_error' )
			->expects( $this->once() ) // Expect it once
			->with( $mock_wp_response )
			->willReturn( false );

		// Mock json_decode (ensure it's mocked)
		$this->getFunctionMock( self::APP_NAMESPACE, 'json_decode' )
			->expects( $this->once() ) // Expect it once
			->with( $response_body_no_token, true )
			->willReturn( json_decode( $response_body_no_token, true ) );

		// --- Execute ---
		$result = $app->get_tokens( $auth_code_query, $account_id );

		// --- Assert ---
		$this->assertFalse( $result );
	}

	public function test_get_app_credentials_success() {
		$app          = $this->createAppInstance();
		$account_id   = 'zoom-acc-1';
		$credentials  = array(
			'client_id'     => 'zoom-client',
			'client_secret' => 'zoom-secret',
		);
		$account_data = array(
			'id'  => $account_id,
			'app' => $credentials,
		); // Account has 'app' key

		$this->accountsMock->expects( $this->once() )
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( $account_data );

		$result = $app->get_app_credentials( $account_id );
		$this->assertEquals( $credentials, $result );
	}

	public function test_get_app_credentials_account_not_found() {
		$app        = $this->createAppInstance();
		$account_id = 'zoom-acc-not-found';

		$this->accountsMock->expects( $this->once() )
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( null ); // Simulate account not found

		$result = $app->get_app_credentials( $account_id );
		$this->assertFalse( $result );
	}

	public function test_get_app_credentials_missing_app_key() {
		$app          = $this->createAppInstance();
		$account_id   = 'zoom-acc-1';
		$account_data = array( 'id' => $account_id ); // Missing 'app' key

		$this->accountsMock->expects( $this->once() )->method( 'get_account' )->willReturn( $account_data );
		$result = $app->get_app_credentials( $account_id );
		$this->assertFalse( $result );
	}

	public function test_get_app_credentials_missing_client_id_or_secret() {
		$app                 = $this->createAppInstance();
		$account_id          = 'zoom-acc-1';
		$credentials_missing = array( 'client_id' => 'zoom-client' ); // Missing secret
		$account_data        = array(
			'id'  => $account_id,
			'app' => $credentials_missing,
		);

		$this->accountsMock->expects( $this->once() )->method( 'get_account' )->willReturn( $account_data );
		$result = $app->get_app_credentials( $account_id );
		$this->assertFalse( $result );
	}

	// --- Tests for get_redirect_uri --- (Same as Google)

	public function test_get_redirect_uri() {
		$app          = $this->createAppInstance();
		$expected_uri = 'http://test.site/wp-admin/admin.php';
		$this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' )
			->expects( $this->once() )->with( 'admin.php' )->willReturn( $expected_uri );
		$this->assertEquals( $expected_uri, $app->get_redirect_uri() );
	}

	// --- Tests for get_auth_uri ---

	public function test_get_auth_uri_success() {
		$app                     = $this->createAppInstance();
		$host_id                 = 123;
		$account_id              = 'zoom-acc-1';
		$credentials             = array(
			'client_id'     => 'zoom-client',
			'client_secret' => 'zoom-secret',
		);
		$account_data            = array(
			'id'  => $account_id,
			'app' => $credentials,
		);
		$redirect_uri            = 'http://test.site/wp-admin/admin.php';
		$encoded_redirect_uri    = urlencode( $redirect_uri );
		$expected_state          = "quillbooking-zm-{$host_id}:{$account_id}";
		$expected_zoom_auth_base = 'https://zoom.us/oauth/authorize';

		// Mock dependencies
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data ); // For get_app_credentials
		$adminUrlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' );
		$adminUrlMock->expects( $this->once() )
			->with( 'admin.php' )
			->willReturn( $redirect_uri );

		$urlencodeMock = $this->getFunctionMock( self::APP_NAMESPACE, 'urlencode' );
		$urlencodeMock->expects( $this->once() )
			->with( $redirect_uri )
			->willReturn( $encoded_redirect_uri );

		$addQueryArgMock = $this->getFunctionMock( self::APP_NAMESPACE, 'add_query_arg' );
		$addQueryArgMock->expects( $this->once() )
			->with(
				$this->callback(
					function ( $p ) use ( $credentials, $encoded_redirect_uri, $expected_state ) {
						return $p['response_type'] === 'code' &&
						$p['client_id'] === $credentials['client_id'] &&
						$p['redirect_uri'] === $encoded_redirect_uri &&
						$p['state'] === $expected_state;
					}
				),
				$expected_zoom_auth_base
			)
			->willReturn( "{$expected_zoom_auth_base}?response_type=code&client_id={$credentials['client_id']}&redirect_uri={$encoded_redirect_uri}&state={$expected_state}" ); // Predictable return

		// Execute
		$result_uri = $app->get_auth_uri( $host_id, $account_id );

		// Assert
		$this->assertStringContainsString( $expected_zoom_auth_base, $result_uri );
		$this->assertStringContainsString( 'client_id=' . $credentials['client_id'], $result_uri );
		$this->assertStringContainsString( 'redirect_uri=' . $encoded_redirect_uri, $result_uri );
		$this->assertStringContainsString( 'state=' . $expected_state, $result_uri );
	}

	public function test_get_auth_uri_fails_if_credentials_fail() {
		$app        = $this->createAppInstance();
		$host_id    = 123;
		$account_id = 'zoom-acc-fail';

		// Simulate get_app_credentials failing
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( null );

		$result = $app->get_auth_uri( $host_id, $account_id );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_app_credentials', $result->get_error_code() );
	}

	// --- Tests for get_tokens ---

	public function test_get_tokens_success() {
		$app                 = $this->createAppInstance();
		$account_id          = 'zoom-acc-1';
		$credentials         = array(
			'client_id'     => 'zoom-client',
			'client_secret' => 'zoom-secret',
		);
		$account_data        = array(
			'id'  => $account_id,
			'app' => $credentials,
		);
		$auth_code_query     = array(
			'grant_type'   => 'authorization_code',
			'code'         => 'auth-code123',
			'redirect_uri' => 'http://test.site/wp-admin/admin.php',
		);
		$expected_tokens     = array(
			'access_token'  => 'zoom-at',
			'refresh_token' => 'zoom-rt',
		);
		$mock_wp_response    = array(
			'body'     => json_encode( $expected_tokens ),
			'response' => array( 'code' => 200 ),
		);
		$expected_basic_auth = 'Basic ' . base64_encode( $credentials['client_id'] . ':' . $credentials['client_secret'] );

		// Mock dependencies
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data ); // For get_authorization_header
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )
			->with(
				'https://zoom.us/oauth/token',
				$this->callback(
					function ( $args ) use ( $auth_code_query, $expected_basic_auth ) {
						// Check body AND header
						return $args['body'] === $auth_code_query &&
						isset( $args['headers']['Authorization'] ) &&
						$args['headers']['Authorization'] === $expected_basic_auth;
					}
				)
			)
			->willReturn( $mock_wp_response );
		// retrieve_body and json_decode mocked in setUp

		// Execute
		$result = $app->get_tokens( $auth_code_query, $account_id );

		// Assert
		$this->assertEquals( $expected_tokens, $result );
	}

	public function test_get_tokens_fails_on_wp_error() {
		$app             = $this->createAppInstance();
		$account_id      = 'zoom-acc-1';
		$credentials     = array(
			'client_id'     => 'zoom-client',
			'client_secret' => 'zoom-secret',
		);
		$account_data    = array(
			'id'  => $account_id,
			'app' => $credentials,
		);
		$auth_code_query = array( /* ... */ );
		$wp_error        = new WP_Error( 'http_fail', 'Zoom down' );

		// Mock dependencies
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data ); // For header
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )->willReturn( $wp_error ); // Return WP_Error

		// Execute
		$result = $app->get_tokens( $auth_code_query, $account_id );

		// Assert
		$this->assertFalse( $result );
	}
}
