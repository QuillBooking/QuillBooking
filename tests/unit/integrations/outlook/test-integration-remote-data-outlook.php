<?php

namespace QuillBooking\Tests\Integrations\Outlook; // <<< CHANGE Namespace


use QuillBooking\Integrations\Outlook\Remote_Data as OutlookRemoteData;
use QuillBooking\Integrations\Outlook\Integration as OutlookIntegration;
use QuillBooking\Integrations\Outlook\API as OutlookAPI;


use QuillBooking_Base_Test_Case;

class Test_Integration_Remote_Data_Outlook extends QuillBooking_Base_Test_Case {


	/**
	 * Mock object for the Integration dependency.
	 *
	 * @var OutlookIntegration|\PHPUnit\Framework\MockObject\MockObject // <<< CHANGE Type hint
	 */
	private $integrationMock;

	/**
	 * Mock object for the API dependency.
	 *
	 * @var OutlookAPI|\PHPUnit\Framework\MockObject\MockObject // <<< CHANGE Type hint
	 */
	private $apiMock;

	public function setUp(): void {
		parent::setUp();

		// Create mock for the Outlook Integration class
		$this->integrationMock = $this->createMock( OutlookIntegration::class ); // <<< CHANGE Class

		// Create mock for the Outlook API class
		$this->apiMock = $this->createMock( OutlookAPI::class ); // <<< CHANGE Class

		// Configure the mocked Integration to return the mocked API object
		$this->integrationMock->api = $this->apiMock;
	}

	/**
	 * Helper method to create an instance of the class under test.
	 *
	 * @return OutlookRemoteData // <<< CHANGE Return type
	 */
	private function createRemoteDataInstance(): OutlookRemoteData {
		// <<< CHANGE Return type
		// Pass the Outlook Integration mock
		return new OutlookRemoteData( $this->integrationMock ); // <<< CHANGE Class
	}

	// --- Tests for fetch_calendars() ---

	public function test_fetch_calendars_success() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define expected MS Graph API response (uses 'value')
		$api_response_data = array(
			'value' => array( // <<< Uses 'value' key
				array(
					'id'    => 'AQMk...',
					'name'  => 'Calendar',
					'owner' => array( 'address' => 'user1@domain.com' ),
				),
				array(
					'id'    => 'AQMk2...',
					'name'  => 'Birthdays',
					'owner' => array( 'address' => 'user1@domain.com' ),
				),
				array(
					'id'    => 'AQMk3...',
					'name'  => 'Shared Calendar',
					'owner' => array( 'address' => 'other@domain.com' ),
				),
			),
		);
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 2. Define expected formatted result
		$expected_formatted_result = array(
			array(
				'id'   => 'AQMk...',
				'name' => 'Calendar (user1@domain.com)',
			), // <<< Uses sprintf formatting
			array(
				'id'   => 'AQMk2...',
				'name' => 'Birthdays (user1@domain.com)',
			),
			array(
				'id'   => 'AQMk3...',
				'name' => 'Shared Calendar (other@domain.com)',
			),
		);

		// 3. Configure API mock
		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' ) // Assuming Outlook API class has this method
			->willReturn( $api_response );

		// 4. Execute
		$result = $remoteData->fetch_calendars();

		// 5. Assert
		$this->assertEquals( $expected_formatted_result, $result );
	}

	// --- Keep other fetch_calendars tests (api_failure, no_value_key, value_is_empty, data_is_null) ---
	// --- They test the error handling logic which is similar ---
	public function test_fetch_calendars_api_failure() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$api_response = array( 'success' => false );
		$this->apiMock->method( 'get_calendars' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_calendars() );
	}
	public function test_fetch_calendars_success_but_no_value_key() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$api_response = array(
			'success' => true,
			'data'    => array( 'other' => 'stuff' ),
		);
		$this->apiMock->method( 'get_calendars' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_calendars() );
	}
	public function test_fetch_calendars_success_but_value_is_empty_array() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$api_response = array(
			'success' => true,
			'data'    => array( 'value' => array() ),
		);
		$this->apiMock->method( 'get_calendars' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_calendars() );
	}
	public function test_fetch_calendars_success_but_data_is_null() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$api_response = array(
			'success' => true,
			'data'    => null,
		);
		$this->apiMock->method( 'get_calendars' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_calendars() );
	}


	// --- Tests for fetch_events() ---

	public function test_fetch_events_success() {
		$remoteData = $this->createRemoteDataInstance();
		$input_data = array(
			'calendar'   => 'AQMk...', // Example Outlook Calendar ID
			'start_date' => '2023-11-10T00:00:00Z',
			'end_date'   => '2023-11-10T23:59:59Z',
		);

		// 2. Define expected MS Graph API response
		$api_response_data = array(
			'value' => array( // <<< Uses 'value' key
				array(
					'id'      => 'evtAQMk1...',
					'subject' => 'Outlook Meeting 1', // <<< Uses 'subject'
					'start'   => array(
						'dateTime' => '2023-11-10T09:00:00.0000000',
						'timeZone' => 'UTC',
					), // MS Graph includes precision & timezone
					'end'     => array(
						'dateTime' => '2023-11-10T10:00:00.0000000',
						'timeZone' => 'UTC',
					),
				),
				array(
					'id'      => 'evtAQMk2...',
					'subject' => 'Project Deadline', // <<< Uses 'subject'
					'start'   => array(
						'dateTime' => '2023-11-10T15:30:00.0000000',
						'timeZone' => 'UTC',
					),
					'end'     => array(
						'dateTime' => '2023-11-10T16:00:00.0000000',
						'timeZone' => 'UTC',
					),
				),
			),
		);
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 3. Define the expected formatted result
		$expected_formatted_result = array(
			array(
				'id'      => 'evtAQMk1...',
				'start'   => '2023-11-10 09:00:00', // Formatted
				'end'     => '2023-11-10 10:00:00',
				'subject' => 'Outlook Meeting 1', // <<< Uses 'subject'
			),
			array(
				'id'      => 'evtAQMk2...',
				'start'   => '2023-11-10 15:30:00',
				'end'     => '2023-11-10 16:00:00',
				'subject' => 'Project Deadline', // <<< Uses 'subject'
			),
		);

		// 4. Configure the API mock - check calendar, args, AND headers
		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )
			->with(
				$this->equalTo( $input_data['calendar'] ),
				// Check the specific MS Graph API args
				$this->callback(
					function ( $args ) use ( $input_data ) {
						$start_dt_str = ( new \DateTime( $input_data['start_date'], new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' );
						$end_dt_str   = ( new \DateTime( $input_data['end_date'], new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' );
						return is_array( $args ) &&
						isset( $args['startdatetime'] ) && $args['startdatetime'] === $start_dt_str && // <<< Check keys
						isset( $args['enddatetime'] ) && $args['enddatetime'] === $end_dt_str && // <<< Check keys
						isset( $args['$select'] ) && $args['$select'] === 'subject,recurrence,showAs,start,end,subject,isAllDay,transactionId' &&
						isset( $args['$top'] ) && $args['$top'] === 100;
					}
				),
				// Check the headers argument
				$this->equalTo( array( 'Prefer' => 'outlook.timezone="UTC"' ) ) // <<< CHECK headers
			)
			->willReturn( $api_response );

		// 5. Execute
		$result = $remoteData->fetch_events( $input_data );

		// 6. Assert
		$this->assertEquals( $expected_formatted_result, $result );
	}

	// --- Keep other fetch_events tests (api_failure, no_value_key, value_is_empty, data_is_null) ---
	public function test_fetch_events_api_failure() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$input_data   = array(
			'calendar'   => 'AQMk...', // Example Outlook Calendar ID
			'start_date' => '2023-11-10T00:00:00Z',
			'end_date'   => '2023-11-10T23:59:59Z',
		);
		$api_response = array( 'success' => false );
		$this->apiMock->method( 'get_events' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_events( $input_data ) );
	}
	public function test_fetch_events_success_but_no_value_key() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$input_data   = array(
			'calendar'   => 'AQMk...', // Example Outlook Calendar ID
			'start_date' => '2023-11-10T00:00:00Z',
			'end_date'   => '2023-11-10T23:59:59Z',
		);
		$api_response = array(
			'success' => true,
			'data'    => array( 'other' => 'stuff' ),
		);
		$this->apiMock->method( 'get_events' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_events( $input_data ) );
	}
	public function test_fetch_events_success_but_value_is_empty_array() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$input_data   = array(
			'calendar'   => 'AQMk...', // Example Outlook Calendar ID
			'start_date' => '2023-11-10T00:00:00Z',
			'end_date'   => '2023-11-10T23:59:59Z',
		);
		$api_response = array(
			'success' => true,
			'data'    => array( 'value' => array() ),
		);
		$this->apiMock->method( 'get_events' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_events( $input_data ) );
	}
	public function test_fetch_events_success_but_data_is_null() {
		/* ... similar ... */
		$remoteData   = $this->createRemoteDataInstance();
		$input_data   = array(
			'calendar'   => 'AQMk...', // Example Outlook Calendar ID
			'start_date' => '2023-11-10T00:00:00Z',
			'end_date'   => '2023-11-10T23:59:59Z',
		);
		$api_response = array(
			'success' => true,
			'data'    => null,
		);
		$this->apiMock->method( 'get_events' )->willReturn( $api_response );
		$this->assertEquals( array(), $remoteData->fetch_events( $input_data ) );
	}

	// Keep test for missing dateTime, Outlook code also expects 'dateTime'
	public function test_fetch_events_event_missing_datetime() {
		$remoteData        = $this->createRemoteDataInstance();
		$input_data        = array(
			'calendar'   => 'AQMk...', // Example Outlook Calendar ID
			'start_date' => '2023-11-10T00:00:00Z',
			'end_date'   => '2023-11-10T23:59:59Z',
		);
		$api_response_data = array(
			'value' => array( // Uses 'value'
				array(
					'id'      => 'outlook_all_day',
					'subject' => 'Outlook All Day Event',
					'start'   => array(
						'date'     => '2023-11-10',
						'timeZone' => 'UTC',
					), // Use 'date' key
					'end'     => array(
						'date'     => '2023-11-11',
						'timeZone' => 'UTC',
					),   // Use 'date' key
				),
			),
		);
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )->willReturn( $api_response );

		$request = $remoteData->fetch_events( $input_data );

		$this->assertEquals( array(), $request );

	}
} // End class Test_Integration_Remote_Data_Outlook
