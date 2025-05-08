<?php

namespace QuillBooking\Tests\Integrations\Apple;

use QuillBooking\Integrations\Apple\Remote_Data as AppleRemoteData; // Class under test
use QuillBooking\Integrations\Apple\Integration as AppleIntegration; // Dependency
use QuillBooking\Integrations\Apple\Client as AppleClient; // Dependency's dependency
use QuillBooking_Base_Test_Case;

class Test_Integration_Remote_Data_Apple extends QuillBooking_Base_Test_Case {
	// Or extends TestCase

	/**
	 * Mock object for the Integration dependency.
	 * Needs to provide the mocked Client object.
	 *
	 * @var AppleIntegration|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $integrationMock;

	/**
	 * Mock object for the Apple Client dependency.
	 * This is what Remote_Data interacts with via $integration->client.
	 *
	 * @var AppleClient|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $clientMock;

	public function setUp(): void {
		parent::setUp();

		$this->integrationMock = $this->createMock( AppleIntegration::class );
		$this->clientMock      = $this->createMock( AppleClient::class );

		// Configure the mocked Integration to return the mocked Client object
		// Assumes 'client' is a public property on the Integration instance
		$this->integrationMock->client = $this->clientMock;
		// If 'client' were accessed via a getter like $integration->getClient(), mock it instead:
		// $this->integrationMock->method('getClient')->willReturn($this->clientMock);
	}

	/**
	 * Helper to create an instance of the class under test.
	 */
	private function createRemoteDataInstance(): AppleRemoteData {
		// Inject the mocked Integration object
		return new AppleRemoteData( $this->integrationMock );
	}

	// --- Tests for fetch_calendars() ---

	public function test_fetch_calendars_success() {
		$remoteData = $this->createRemoteDataInstance();

		$client_response = array(
			'account_id' => 'apple-acc-123',
			'calendars'  => array(
				'cal_id_1' => array(
					'name'  => 'Home',
					'color' => '#ff0000',
				),
				'work_cal' => array(
					'name'  => 'Work',
					'color' => '#00ff00',
				),
			),
		);
		$expected_result = array(
			array(
				'id'   => 'cal_id_1',
				'name' => 'Home',
			),
			array(
				'id'   => 'work_cal',
				'name' => 'Work',
			),
		);

		// Configure the Client mock
		$this->clientMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $client_response );

		// Execute
		$result = $remoteData->fetch_calendars();

		// Assert
		$this->assertEquals( $expected_result, $result );
	}

	public function test_fetch_calendars_client_returns_empty() {
		$remoteData      = $this->createRemoteDataInstance();
		$client_response = array(); // Client fails or finds nothing

		$this->clientMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $client_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result ); // Expect empty array
	}

	public function test_fetch_calendars_client_returns_no_calendars_key() {
		$remoteData      = $this->createRemoteDataInstance();
		$client_response = array( 'account_id' => 'abc' ); // Missing 'calendars' key

		$this->clientMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $client_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result ); // Expect empty array due to Arr::get default
	}

	public function test_fetch_calendars_client_returns_empty_calendars_array() {
		$remoteData      = $this->createRemoteDataInstance();
		$client_response = array(
			'account_id' => 'apple-acc-123',
			'calendars'  => array(), // Empty calendars array
		);

		$this->clientMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $client_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result ); // Expect empty array
	}

	// --- Tests for fetch_events() ---

	public function test_fetch_events_success() {
		$remoteData = $this->createRemoteDataInstance();

		$input_data = array(
			'calendar'   => 'cal_id_work',
			'start_date' => '2023-12-01T00:00:00Z',
			'end_date'   => '2023-12-01T23:59:59Z',
			'id'         => 'apple-acc-456', // Account ID
		);

		// Define expected args for client->get_events
		$expected_start_arg = '20231201T000000Z'; // Ymd\THis\Z format
		$expected_end_arg   = '20231201T235959Z';   // Ymd\THis\Z format

		// Define the events array client->get_events should return
		$client_events_response = array(
			array(
				'UID'     => 'event1',
				'SUMMARY' => 'Meeting A',
				'DTSTART' => '...',
			),
			array(
				'UID'     => 'event2',
				'SUMMARY' => 'Meeting B',
				'DTSTART' => '...',
			),
		);

		// Configure the Client mock
		$this->clientMock->expects( $this->once() )
			->method( 'get_events' )
			->with(
				$this->equalTo( $input_data['id'] ),
				$this->equalTo( $input_data['calendar'] ),
				$this->equalTo( $expected_start_arg ),
				$this->equalTo( $expected_end_arg )
			)
			->willReturn( $client_events_response );

		// Execute
		$result = $remoteData->fetch_events( $input_data );

		// Assert - fetch_events returns the client response directly
		$this->assertEquals( $client_events_response, $result );
	}

	public function test_fetch_events_client_returns_empty() {
		$remoteData             = $this->createRemoteDataInstance();
		$input_data             = array( /* ... provide valid input ... */
			'calendar'   => 'cal_id_work',
			'start_date' => '2023-12-01T00:00:00Z',
			'end_date'   => '2023-12-01T23:59:59Z',
			'id'         => 'apple-acc-456',
		);
		$client_events_response = array(); // Client returns empty array

		$this->clientMock->expects( $this->once() )
			->method( 'get_events' )
			// ->with(...) // Optional: check args
			->willReturn( $client_events_response );

		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}

	// Optional: Test if DateTime throws an exception with invalid date strings
	public function test_fetch_events_invalid_start_date_format() {
		$remoteData = $this->createRemoteDataInstance();
		$input_data = array(
			'calendar'   => 'cal_id_work',
			'start_date' => 'Invalid Date String', // Invalid format
			'end_date'   => '2023-12-01T23:59:59Z',
			'id'         => 'apple-acc-456',
		);

		// Expect an exception from the `new \DateTime()` call
		$this->expectException( \Exception::class ); // Or more specific DateTime exception if possible

		// We don't expect the client mock to be called as DateTime fails first
		$this->clientMock->expects( $this->never() )->method( 'get_events' );

		// Execute - This should throw the exception
		$remoteData->fetch_events( $input_data );
	}
} // End Test Class
