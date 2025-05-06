<?php

namespace QuillBooking\Tests\Integrations\Outlook; // <<< CHANGE Namespace

use phpmock\phpunit\PHPMock;
use phpmock\MockBuilder; // For static Calendar_Model::find
use QuillBooking\Integrations\Outlook\App as OutlookApp; // <<< CHANGE Class under test
use QuillBooking\Integrations\Outlook\Integration as OutlookIntegration; // <<< CHANGE Dependency
use QuillBooking\Integrations\Outlook\API as OutlookAPI; // <<< CHANGE API Class
use QuillBooking\Models\Calendar_Model;
use QuillBooking_Base_Test_Case;
use WP_Error;

class Test_Integration_App_Outlook extends QuillBooking_Base_Test_Case {
	// <<< CHANGE Class Name

	use PHPMock;

	/** @var OutlookIntegration|\PHPUnit\Framework\MockObject\MockObject */ // <<< CHANGE Type hint
	private $integrationMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock;

	// Namespace where global functions are CALLED FROM within Outlook\App
	private const APP_NAMESPACE = 'QuillBooking\Integrations\Outlook'; // <<< CHANGE Namespace
	// Namespace where global functions are CALLED FROM within Outlook\API (needed for maybe_add_settings)
	private const API_NAMESPACE = 'QuillBooking\Integrations\Outlook'; // <<< CHANGE Namespace
	// Namespace for functions called within parent Integration\API (needed for maybe_add_settings)
	private const PARENT_API_NAMESPACE = 'QuillBooking\Integration';


	public function setUp(): void {
		parent::setUp();

		$this->integrationMock           = $this->createMock( OutlookIntegration::class ); // <<< CHANGE Class
		$this->accountsMock              = $this->getMockBuilder( \stdClass::class )
			->addMethods( array( 'add_account', 'get_account', 'update_account' ) )
			->getMock();
		$this->integrationMock->accounts = $this->accountsMock;

		// Mock global functions
		$this->getFunctionMock( self::APP_NAMESPACE, 'esc_html__' )
			->expects( $this->any() )->willReturnCallback( fn( $t, $d) => $t );
		$this->getFunctionMock( self::APP_NAMESPACE, 'urlencode' ) // For scope and redirect_uri
			->expects( $this->any() )->willReturnCallback( fn( $s) => \urlencode( $s ) ); // Use real urlencode

		$this->getFunctionMock( self::PARENT_API_NAMESPACE, 'wp_remote_retrieve_response_code' )
			->expects( $this->any() )->willReturnCallback( fn( $r) => is_wp_error( $r ) ? null : ( $r['response']['code'] ?? null ) );

		$GLOBALS['_GET'] = array();
	}

	protected function tearDown(): void {
		$GLOBALS['_GET'] = array();
		parent::tearDown();
	}

	/** Helper to create Outlook App instance */
	private function createAppInstance(): OutlookApp {
		// <<< CHANGE Type hint
		return new OutlookApp( $this->integrationMock ); // <<< CHANGE Class
	}

	public function test_refresh_tokens_success() {
		$app                 = $this->createAppInstance();
		$account_id          = 'outlook-acc-1';
		$refresh_token       = 'outlook-rt-old';
		$credentials         = array(
			'client_id'     => 'outlook-client-id',
			'client_secret' => 'outlook-client-secret',
		);
		$account_data_before = array(
			'id'     => $account_id,
			'tokens' => array(
				'refresh_token' => $refresh_token,
				'access_token'  => 'old-at',
			),
		);
		$refresh_query       = array( // Query for refresh token grant
			'grant_type'    => 'refresh_token',
			'refresh_token' => $refresh_token,
			'client_id'     => $credentials['client_id'],
			'client_secret' => $credentials['client_secret'],
			// scope might be needed depending on API requirements
		);
		$expected_new_tokens          = array(
			'access_token'  => 'outlook-at-new',
			'refresh_token' => 'outlook-rt-new', /*...*/
		);
		$mock_wp_response             = array(
			'body'     => json_encode( $expected_new_tokens ),
			'response' => array( 'code' => 200 ),
		);
		$expected_token_endpoint      = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
		$expected_final_tokens_result = array(
			'access_token'  => 'outlook-at-new',
			'refresh_token' => $refresh_token,
		); // Based on current code logic

		// Mock dependencies
		$this->integrationMock->method( 'get_setting' )->with( 'app' )->willReturn( $credentials ); // For get_app_credentials
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() ) // Called by get_tokens
			->with( $expected_token_endpoint, array( 'body' => $refresh_query ) )
			->willReturn( $mock_wp_response );
		$this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_retrieve_body' ) // Called by get_tokens
			->expects( $this->once() )->with( $mock_wp_response )->willReturn( json_encode( $expected_new_tokens ) );
		$this->getFunctionMock( self::APP_NAMESPACE, 'is_wp_error' )->expects( $this->once() )->willReturn( false ); // Called by get_tokens
		$this->getFunctionMock( self::APP_NAMESPACE, 'json_decode' )->expects( $this->once() )->willReturn( $expected_new_tokens ); // Called by get_tokens

		$this->accountsMock->expects( $this->once() ) // Called by refresh_tokens before update
			->method( 'get_account' )->with( $account_id )->willReturn( $account_data_before );
		$this->accountsMock->expects( $this->once() ) // Called by refresh_tokens to save
			->method( 'update_account' )
			->with( $account_id, array( 'tokens' => $expected_final_tokens_result ) )
			->willReturn( true );

		// Execute
		$result = $app->refresh_tokens( $refresh_token, $account_id );
		$this->assertEquals( $expected_final_tokens_result, $result );
	}


	public function test_get_tokens_fails_on_missing_access_token() {
		$app                    = $this->createAppInstance();
		$query                  = array( 'grant_type' => 'authorization_code' /*...*/ );
		$response_body_no_token = json_encode( array( 'error' => 'invalid_grant' ) );
		$mock_wp_response       = array(
			'body'     => $response_body_no_token,
			'response' => array( 'code' => 400 ),
		);
		$wpRemotePostMock       = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )->willReturn( $mock_wp_response );
		// Need specific retrieve_body mock for this test case if removed from setUp
		$this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_retrieve_body' )
			->expects( $this->once() )->with( $mock_wp_response )->willReturn( $response_body_no_token );

		$result = $app->get_tokens( $query );
		$this->assertFalse( $result );
	}


	// --- Tests for refresh_tokens --- (Similar structure to Google)



	public function test_get_app_credentials_success() {
		$app         = $this->createAppInstance();
		$credentials = array(
			'client_id'     => 'outlook-id',
			'client_secret' => 'outlook-secret',
		);
		$this->integrationMock->expects( $this->once() )
			->method( 'get_setting' )->with( 'app' )->willReturn( $credentials );
		$this->assertEquals( $credentials, $app->get_app_credentials() );
	}

	public function test_get_app_credentials_missing_id() {
		$app         = $this->createAppInstance();
		$credentials = array( 'client_secret' => 'outlook-secret' );
		$this->integrationMock->method( 'get_setting' )->willReturn( $credentials );
		$this->assertFalse( $app->get_app_credentials() );
	}

	public function test_get_app_credentials_missing_secret() {
		$app         = $this->createAppInstance();
		$credentials = array( 'client_id' => 'outlook-id' );
		$this->integrationMock->method( 'get_setting' )->willReturn( $credentials );
		$this->assertFalse( $app->get_app_credentials() );
	}

	public function test_get_app_credentials_not_set() {
		$app = $this->createAppInstance();
		$this->integrationMock->method( 'get_setting' )->willReturn( null );
		$this->assertFalse( $app->get_app_credentials() );
	}

	// --- Test for get_redirect_uri --- (Identical logic to Google)

	public function test_get_redirect_uri() {
		$app          = $this->createAppInstance();
		$expected_uri = 'http://test.site/wp-admin/admin.php';
		$this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' )
			->expects( $this->once() )->with( 'admin.php' )->willReturn( $expected_uri );
		$this->assertEquals( $expected_uri, $app->get_redirect_uri() );
	}

	// --- Test for get_auth_uri ---

	public function test_get_auth_uri_builds_correct_url() {
		$app                        = $this->createAppInstance();
		$host_id                    = 123;
		$credentials                = array(
			'client_id'     => 'outlook-client-id',
			'client_secret' => 'outlook-client-secret',
		);
		$redirect_uri               = 'http://test.local/wp-admin/admin.php';
		$scopes                     = 'openid profile offline_access User.Read Calendars.ReadWrite'; // Space separated string
		$encoded_redirect_uri       = urlencode( $redirect_uri );
		$encoded_scopes             = urlencode( $scopes );
		$expected_state             = "quillbooking-ms-{$host_id}"; // <<< CHANGE State format
		$expected_outlook_auth_base = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'; // <<< CHANGE Endpoint

		// Mock dependencies
		$this->integrationMock->method( 'get_setting' )->with( 'app' )->willReturn( $credentials ); // For get_app_credentials
		$adminUrlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' );
		$adminUrlMock->expects( $this->once() )
			->with( 'admin.php' )
			->willReturn( $redirect_uri );
		// urlencode mock setup in setUp handles redirect_uri and scope

		$addQueryArgMock = $this->getFunctionMock( self::APP_NAMESPACE, 'add_query_arg' );
		$addQueryArgMock->expects( $this->once() )
			->with(
				$this->callback(
					function ( $p ) use ( $credentials, $encoded_scopes, $encoded_redirect_uri, $expected_state ) {
						return $p['response_type'] === 'code' &&
						$p['access_type'] === 'offline' && // <<< Check access_type
						$p['client_id'] === $credentials['client_id'] &&
						$p['redirect_uri'] === $encoded_redirect_uri &&
						$p['state'] === $expected_state &&
						$p['scope'] === $encoded_scopes; // <<< Check scope
					}
				),
				$expected_outlook_auth_base // <<< CHANGE Endpoint check
			)
			// Return a predictable URL
			->willReturn( "{$expected_outlook_auth_base}?response_type=code&access_type=offline&client_id={$credentials['client_id']}&redirect_uri={$encoded_redirect_uri}&state={$expected_state}&scope={$encoded_scopes}" );

		// Execute
		$result_uri = $app->get_auth_uri( $host_id ); // Pass only host_id

		// Assert
		$this->assertStringContainsString( $expected_outlook_auth_base, $result_uri );
		$this->assertStringContainsString( 'client_id=' . $credentials['client_id'], $result_uri );
		$this->assertStringContainsString( 'scope=' . $encoded_scopes, $result_uri );
		$this->assertStringContainsString( 'redirect_uri=' . $encoded_redirect_uri, $result_uri );
		$this->assertStringContainsString( 'state=' . $expected_state, $result_uri );
		$this->assertStringContainsString( 'access_type=offline', $result_uri );
	}

	public function test_get_auth_uri_fails_if_credentials_fail() {
		$app     = $this->createAppInstance();
		$host_id = 123;

		// Simulate get_app_credentials failing
		$this->integrationMock->method( 'get_setting' )->with( 'app' )->willReturn( false );

		// Mock admin_url, but expect it NEVER to be called because the function exits early
		$adminUrlMock = $this->getFunctionMock( self::APP_NAMESPACE, 'admin_url' );
		$adminUrlMock->expects( $this->never() ); // <<< FIX: Use expects(never())

		// Execute
		$result = $app->get_auth_uri( $host_id );

		// Assert
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_app_credentials', $result->get_error_code() );
	}


	// --- Tests for get_tokens --- (Similar structure to Google)

	public function test_get_tokens_success() {
		$app                     = $this->createAppInstance();
		$auth_code_query         = array( // Example for auth code grant
			'grant_type'    => 'authorization_code',
			'code'          => 'outlook-auth-code',
			'client_id'     => 'outlook-client-id',
			'client_secret' => 'outlook-client-secret',
			'redirect_uri'  => 'http://test.local/wp-admin/admin.php',
		);
		$expected_tokens         = array(
			'token_type'    => 'Bearer',
			'scope'         => '...',
			'expires_in'    => 3599,
			'access_token'  => 'outlook-at',
			'refresh_token' => 'outlook-rt',
		);
		$mock_wp_response        = array(
			'body'     => json_encode( $expected_tokens ),
			'response' => array( 'code' => 200 ),
		);
		$expected_token_endpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'; // <<< CHANGE Endpoint

		// Mock wp_remote_post
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )
			->with( $expected_token_endpoint, array( 'body' => $auth_code_query ) ) // Check endpoint and body
			->willReturn( $mock_wp_response );
		// retrieve_body and json_decode mocked in setUp

		// Execute
		$result = $app->get_tokens( $auth_code_query ); // Pass query
		$this->assertEquals( $expected_tokens, $result );
	}

	public function test_get_tokens_fails_on_wp_error() {
		$app              = $this->createAppInstance();
		$query            = array( 'grant_type' => 'authorization_code' /*...*/ );
		$wp_error         = new WP_Error( 'http_fail', 'MS Login down' );
		$wpRemotePostMock = $this->getFunctionMock( self::APP_NAMESPACE, 'wp_remote_post' );
		$wpRemotePostMock->expects( $this->once() )->willReturn( $wp_error );

		$result = $app->get_tokens( $query );
		$this->assertFalse( $result );
	}



}
