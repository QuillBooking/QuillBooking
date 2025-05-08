<?php

namespace QuillBooking\Tests\Integrations\Twilio;

use WP_UnitTestCase; // Or PHPUnit\Framework\TestCase
use phpmock\phpunit\PHPMock;
use QuillBooking\Integrations\Twilio\API as TwilioAPI; // Class under test
use QuillBooking_Base_Test_Case;

// Assuming QuillBooking_Base_Test_Case extends WP_UnitTestCase or TestCase
class Test_Integration_API_Twilio extends QuillBooking_Base_Test_Case {

	use PHPMock;

	// Namespace where global functions are called from within Twilio API class
	private const API_NAMESPACE = 'QuillBooking\Integrations\Twilio';

	private const TEST_ACC_SID       = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
	private const TEST_AUTH_TOKEN    = 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy';
	private const TEST_SMS_FROM      = '+15005550006'; // Twilio test number
	private const TEST_WHATSAPP_FROM = '+14155238886'; // Twilio WhatsApp Sandbox

	/** @var \phpmock\Mock */
	private $wpRemoteRequestMock; // Store mock instance

	public function setUp(): void {
		parent::setUp();

		// Mock global WordPress functions
		$this->getFunctionMock( self::API_NAMESPACE, 'get_option' )
			->expects( $this->any() )
			->with( 'blog_charset' )
			->willReturn( 'UTF-8' );

		$this->getFunctionMock( self::API_NAMESPACE, 'wp_json_encode' )
			->expects( $this->any() )
			->willReturnCallback( 'json_encode' ); // Use real json_encode

		$this->getFunctionMock( self::API_NAMESPACE, 'http_build_query' )
			->expects( $this->any() )
			->willReturnCallback( 'http_build_query' ); // Use real http_build_query

		$this->getFunctionMock( self::API_NAMESPACE, 'base64_encode' )
			->expects( $this->any() )
			->with( self::TEST_ACC_SID . ':' . self::TEST_AUTH_TOKEN )
			->willReturn( base64_encode( self::TEST_ACC_SID . ':' . self::TEST_AUTH_TOKEN ) ); // Use real base64

		// Central mock for wp_remote_request - configure per test
		$this->wpRemoteRequestMock = $this->getFunctionMock( self::API_NAMESPACE, 'wp_remote_request' );
	}

	/**
	 * Helper to create API instance
	 */
	private function createApiInstance(): TwilioAPI {
		return new TwilioAPI(
			self::TEST_SMS_FROM,
			self::TEST_WHATSAPP_FROM,
			self::TEST_ACC_SID,
			self::TEST_AUTH_TOKEN
		);
	}

	// --- Test Cases ---

	public function test_get_account_info() {
		$api              = $this->createApiInstance();
		$expectedUrl      = 'https://api.twilio.com/2010-04-01/Accounts/' . self::TEST_ACC_SID . '.json';
		$expectedMethod   = 'GET';
		$expectedHeaders  = $this->getExpectedHeaders( 'json' ); // Assuming GET uses default json content type internally? check request() -> request_remote() flow for GET
		$expectedResponse = array(
			'response' => array( 'code' => 200 ),
			'body'     => '{"sid": "' . self::TEST_ACC_SID . '"}',
		);

		// Configure wp_remote_request mock for this GET call
		$this->wpRemoteRequestMock->expects( $this->once() )
			->with(
				$this->equalTo( $expectedUrl ),
				$this->callback(
					function ( $args ) use ( $expectedMethod, $expectedHeaders ) {
						return $args['method'] === $expectedMethod &&
						isset( $args['headers']['Authorization'] ) && // Ensure auth is checked
						// ($args['headers']['Content-Type'] ?? '') === ($expectedHeaders['Content-Type'] ?? '') && // Check content-type if relevant for GET
						is_null( $args['body'] ?? null ); // No body for GET
					}
				)
			)
			->willReturn( $expectedResponse );

		// Execute - get_account_info calls get() -> request() -> request_remote()
		$result = $api->get_account_info();

		// Note: This API class doesn't parse the response, it returns the raw wp_remote_request result
		$this->assertEquals( $expectedResponse, $result );
	}

	public function test_send_sms_success() {
		$api                = $this->createApiInstance();
		$toNumber           = '+15005550007';
		$message            = 'Test SMS message';
		$expectedUrl        = 'https://api.twilio.com/2010-04-01/Accounts/' . self::TEST_ACC_SID . '/Messages.json';
		$expectedMethod     = 'POST';
		$expectedBodyData   = array(
			'From' => self::TEST_SMS_FROM,
			'To'   => $toNumber,
			'Body' => $message,
		);
		$expectedBodyString = http_build_query( $expectedBodyData );
		$expectedHeaders    = $this->getExpectedHeaders( 'form' ); // send_sms forces 'form'
		$expectedResponse   = array(
			'response' => array( 'code' => 201 ),
			'body'     => '{"sid": "SMxxxxx"}',
		);

		// Configure wp_remote_request mock for this POST call
		$this->wpRemoteRequestMock->expects( $this->once() )
			->with(
				$this->equalTo( $expectedUrl ),
				$this->callback(
					function ( $args ) use ( $expectedMethod, $expectedBodyString, $expectedHeaders ) {
						return $args['method'] === $expectedMethod &&
						( $args['headers']['Content-Type'] ?? '' ) === $expectedHeaders['Content-Type'] &&
						isset( $args['headers']['Authorization'] ) &&
						( $args['body'] ?? null ) === $expectedBodyString;
					}
				)
			)
			->willReturn( $expectedResponse );

		// Execute
		$result = $api->send_sms( $toNumber, $message );

		// Assert: Returns raw response
		$this->assertEquals( $expectedResponse, $result );
	}

	public function test_send_whatsapp_message_success() {
		$api                = $this->createApiInstance();
		$toNumber           = '+15005550008'; // Must be valid WhatsApp number format
		$message            = 'Test WhatsApp message';
		$expectedUrl        = 'https://api.twilio.com/2010-04-01/Accounts/' . self::TEST_ACC_SID . '/Messages.json';
		$expectedMethod     = 'POST';
		$expectedBodyData   = array(
			'From' => 'whatsapp:' . self::TEST_WHATSAPP_FROM,
			'To'   => 'whatsapp:' . $toNumber,
			'Body' => $message,
		);
		$expectedBodyString = http_build_query( $expectedBodyData );
		$expectedHeaders    = $this->getExpectedHeaders( 'form' ); // send_whatsapp_message forces 'form'
		$expectedResponse   = array(
			'response' => array( 'code' => 201 ),
			'body'     => '{"sid": "SMxxxxx"}',
		);

		// Configure wp_remote_request mock
		$this->wpRemoteRequestMock->expects( $this->once() )
			->with(
				$this->equalTo( $expectedUrl ),
				$this->callback(
					function ( $args ) use ( $expectedMethod, $expectedBodyString, $expectedHeaders ) {
						return $args['method'] === $expectedMethod &&
						( $args['headers']['Content-Type'] ?? '' ) === $expectedHeaders['Content-Type'] &&
						isset( $args['headers']['Authorization'] ) &&
						( $args['body'] ?? null ) === $expectedBodyString;
					}
				)
			)
			->willReturn( $expectedResponse );

		// Execute
		$result = $api->send_whatsapp_message( $toNumber, $message );

		// Assert: Returns raw response
		$this->assertEquals( $expectedResponse, $result );
	}

	public function test_post_json_content_type() {
		$api              = $this->createApiInstance();
		$path             = self::TEST_ACC_SID . '/SomeResource.json';
		$url              = 'https://api.twilio.com/2010-04-01/Accounts/' . $path;
		$bodyData         = array(
			'key'    => 'value',
			'nested' => array( 'a' => 1 ),
		);
		$expectedBodyJson = json_encode( $bodyData );
		$expectedHeaders  = $this->getExpectedHeaders( 'json' );
		$expectedResponse = array(
			'response' => array( 'code' => 200 ),
			'body'     => '{"status":"ok"}',
		);

		// Configure wp_remote_request mock
		$this->wpRemoteRequestMock->expects( $this->once() )
			->with(
				$url,
				$this->callback(
					function ( $args ) use ( $expectedBodyJson, $expectedHeaders ) {
						return $args['method'] === 'POST' &&
						( $args['headers']['Content-Type'] ?? '' ) === $expectedHeaders['Content-Type'] &&
						isset( $args['headers']['Authorization'] ) &&
						( $args['body'] ?? null ) === $expectedBodyJson; // Check JSON body
					}
				)
			)
			->willReturn( $expectedResponse );

		// Execute post with 'json' type
		$result = $api->post( $path, $bodyData, 'json' );

		$this->assertEquals( $expectedResponse, $result );
	}

	// Helper to get expected headers based on content type
	private function getExpectedHeaders( string $contentType = 'form' ): array {
		$contentTypeHeader = $contentType === 'json'
			? 'application/json; charset=UTF-8' // Assume UTF-8 from mock get_option
			: 'application/x-www-form-urlencoded';

		return array(
			'Accept'        => 'application/json',
			'Content-Type'  => $contentTypeHeader,
			'Cache-Control' => 'no-cache',
			'Authorization' => 'Basic ' . base64_encode( self::TEST_ACC_SID . ':' . self::TEST_AUTH_TOKEN ),
		);
	}


}
