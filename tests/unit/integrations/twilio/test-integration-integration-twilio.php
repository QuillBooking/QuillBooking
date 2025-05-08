<?php

namespace QuillBooking\Tests\Integrations\Twilio;

use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Twilio\Integration as TwilioIntegration; // Class under test
use QuillBooking\Integrations\Twilio\API as TwilioAPI; // Class returned by connect
use QuillBooking\Integration\Accounts; // Dependency
use QuillBooking\Models\Calendar_Model; // For Host type hint
use WP_Error;
use QuillBooking_Base_Test_Case; // Your base class

// Dummy classes for parent init()
class DummyTwilioRestAPI {

	public function __construct( $integration ) {}
}

class Test_Integration_Integration_Twilio extends QuillBooking_Base_Test_Case {

	use PHPMock;

	// Namespace where global functions (__ etc) are called from within Twilio\Integration
	private const INTEGRATION_NAMESPACE = 'QuillBooking\Integrations\Twilio';
	// Namespace where parent Integration functions might be called
	private const ABSTRACT_INTEGRATION_NAMESPACE = 'QuillBooking\Integration';

	/** @var Accounts|\PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock;

	public function setUp(): void {
		parent::setUp();

		// Mock the Accounts dependency
		$this->accountsMock = $this->createMock( Accounts::class );

		// Mock global functions (like __) if necessary
		$this->getFunctionMock( self::INTEGRATION_NAMESPACE, '__' )
			->expects( $this->any() )->willReturnArgument( 0 );
		$this->getFunctionMock( self::INTEGRATION_NAMESPACE, 'esc_html__' )
			->expects( $this->any() )->willReturnArgument( 0 );
		// Mock parent namespace __ if parent::connect uses it
		$this->getFunctionMock( self::ABSTRACT_INTEGRATION_NAMESPACE, '__' )
			->expects( $this->any() )->willReturnArgument( 0 );
	}

	/**
	 * Helper to create Integration instance, injecting mocked Accounts
	 */
	private function createIntegrationInstance(): TwilioIntegration {
		// Need to allow the constructor to run to call parent::__construct -> init()
		// We inject the accounts mock afterwards using reflection
		// Also set dummy classes for parent init
		TwilioIntegration::$classes['rest_api'] = DummyTwilioRestAPI::class; // Set dummy

		$integration = new TwilioIntegration(); // Call real constructor

		// Inject Accounts mock
		$reflection   = new \ReflectionClass( $integration );
		$accountsProp = $reflection->getProperty( 'accounts' );
		$accountsProp->setAccessible( true );
		$accountsProp->setValue( $integration, $this->accountsMock );

		// Ensure REST API class is reset if needed after test
		// Can be done in tearDown or before next test

		return $integration;
	}

	protected function tearDown(): void {
		// Reset static classes property if modified
		$reflection  = new \ReflectionClass( TwilioIntegration::class );
		$classesProp = $reflection->getProperty( 'classes' );
		$classesProp->setAccessible( true );
		$originalClasses = $reflection->getStaticPropertyValue( 'classes' ); // Get original value if needed or set to default
		// Resetting might be complex if original isn't stored; maybe skip reset if tests don't conflict.
		// $classesProp->setValue(null, ['rest_api' => \QuillBooking\Integrations\Twilio\REST_API\REST_API::class]);

		parent::tearDown();
	}


	// --- Test Cases ---

	public function test_constructor_initializes_correctly() {
		// Test that constructor runs parent::init() correctly
		$integration = $this->createIntegrationInstance();

		// Check properties set by parent init (using specific Twilio slug)
		$this->assertEquals( 'twilio', $integration->slug );
		$this->assertEquals( 'Twilio', $integration->name );
		$this->assertEquals( 'quillbooking_twilio_settings', $integration->option_name );
		$this->assertEquals( 'quillbooking_twilio_accounts', $integration->meta_key );
		$this->assertEquals( false, $integration->is_calendar );
		$this->assertEquals( true, $integration->is_global );
		$this->assertInstanceOf( Accounts::class, $integration->accounts ); // Check accounts object exists
		// $this->assertInstanceOf(DummyTwilioRestAPI::class, $integration->rest_api); // Cannot check private/protected easily
	}

	public function test_connect_success() {
		$integration  = $this->createIntegrationInstance();
		$host_id      = 1; // Not strictly used as it's global, but passed
		$account_id   = 'twilio_acc_1';
		$credentials  = array(
			'sms_number'      => '+15005550006',
			'whatsapp_number' => '+14155238886',
			'account_sid'     => 'ACxxxx',
			'auth_token'      => 'authxxxx',
		);
		$account_data = array( 'credentials' => $credentials );

		// Mock accounts->get_account
		$this->accountsMock->expects( $this->once() )
			->method( 'get_account' )
			->with( $account_id )
			->willReturn( $account_data );

		// We don't need to mock set_host as the parent::connect is simple

		// Execute
		$result = $integration->connect( $host_id, $account_id );

		// Assert
		$this->assertInstanceOf( TwilioAPI::class, $result );
		// Optionally check if properties on the returned API are set correctly
		$this->assertEquals( $credentials['sms_number'], $result->sms_number );
		$this->assertEquals( $credentials['whatsapp_number'], $result->whatsapp_number );
		$this->assertEquals( $credentials['account_sid'], $result->account_sid );
		$this->assertEquals( $credentials['auth_token'], $result->auth_token );
		// Check if $integration->api property was also set
		$this->assertSame( $result, $integration->api );
	}

	public function test_connect_fails_missing_sms_number() {
		$integration  = $this->createIntegrationInstance();
		$host_id      = 1;
		$account_id   = 'twilio_acc_1';
		$credentials  = array( // Missing sms_number
			'whatsapp_number' => '+14155238886',
			'account_sid'     => 'ACxxxx',
			'auth_token'      => 'authxxxx',
		);
		$account_data = array( 'credentials' => $credentials );

		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data );

		$result = $integration->connect( $host_id, $account_id );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_credentials', $result->get_error_code() );
	}

	public function test_connect_fails_missing_account_sid() {
		$integration  = $this->createIntegrationInstance();
		$host_id      = 1;
		$account_id   = 'twilio_acc_1';
		$credentials  = array( // Missing account_sid
			'sms_number'      => '+15005550006',
			'whatsapp_number' => '+14155238886',
			'auth_token'      => 'authxxxx',
		);
		$account_data = array( 'credentials' => $credentials );

		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data );

		$result = $integration->connect( $host_id, $account_id );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_credentials', $result->get_error_code() );
	}

	public function test_connect_fails_missing_auth_token() {
		$integration  = $this->createIntegrationInstance();
		$host_id      = 1;
		$account_id   = 'twilio_acc_1';
		$credentials  = array( // Missing auth_token
			'sms_number'      => '+15005550006',
			'whatsapp_number' => '+14155238886',
			'account_sid'     => 'ACxxxx',
		);
		$account_data = array( 'credentials' => $credentials );

		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( $account_data );

		$result = $integration->connect( $host_id, $account_id );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_credentials', $result->get_error_code() );
	}

	public function test_connect_fails_no_account_data() {
		$integration = $this->createIntegrationInstance();
		$host_id     = 1;
		$account_id  = 'twilio_acc_1';

		// Mock get_account returning null
		$this->accountsMock->method( 'get_account' )->with( $account_id )->willReturn( null );

		$result = $integration->connect( $host_id, $account_id );

		// Check failure - should fail on Arr::get for credentials
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'no_credentials', $result->get_error_code() );
	}

} // End Test Class
