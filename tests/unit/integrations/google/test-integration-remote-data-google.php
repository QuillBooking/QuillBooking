<?php



use QuillBooking\Integrations\Google\Remote_Data;
use QuillBooking\Integrations\Google\Integration;
use QuillBooking\Integrations\Google\API;

class Test_Integration_Remote_Data_Google extends QuillBooking_Base_Test_Case {
	/**
	 * Mock object for the Integration dependency.
	 * It needs to provide the mocked API object.
	 *
	 * @var Integration|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $integrationMock;

	/**
	 * Mock object for the API dependency.
	 * This is what Remote_Data actually interacts with via $integration->api.
	 *
	 * @var API|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $apiMock;

	public function setUp(): void {
		parent::setUp();

		// Create mock for the Integration class
		$this->integrationMock = $this->createMock( Integration::class );

		// Create mock for the API class
		$this->apiMock = $this->createMock( API::class );

		// Configure the mocked Integration to return the mocked API object
		// Assumes 'api' is a public property on the Integration instance
		$this->integrationMock->api = $this->apiMock;
		// If 'api' were accessed via a getter like $integration->getApi(), you would mock it like this:
		// $this->integrationMock->method('getApi')->willReturn($this->apiMock);
	}

	/**
	 * Helper method to create an instance of the class under test
	 * with the mocked Integration dependency injected.
	 *
	 * @return Remote_Data
	 */
	private function createRemoteDataInstance(): Remote_Data {
		// The Remote_Data constructor takes the Integration instance
		return new Remote_Data( $this->integrationMock );
	}

	// --- Tests for fetch_calendars() ---

	public function test_fetch_calendars_success() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define the expected response from the mocked API layer
		$api_response_data = array(
			'items' => array(
				array(
					'id'      => 'primary',
					'summary' => 'Personal Calendar',
				),
				array(
					'id'      => 'work@example.com',
					'summary' => 'Work Calendar',
				),
				array(
					'id'      => 'cal_id_3',
					'summary' => 'Shared Project',
				),
			),
		);
		$api_response      = array(
			'success'     => true,
			'data'        => $api_response_data,
			'status_code' => 200,
			'error'       => null,
		); // Example full response structure

		// 2. Define the expected formatted result from fetch_calendars
		$expected_formatted_result = array(
			array(
				'id'   => 'primary',
				'name' => 'Personal Calendar',
			),
			array(
				'id'   => 'work@example.com',
				'name' => 'Work Calendar',
			),
			array(
				'id'   => 'cal_id_3',
				'name' => 'Shared Project',
			),
		);

		// 3. Configure the API mock
		$this->apiMock->expects( $this->once() ) // Expect get_calendars to be called exactly once
			 ->method( 'get_calendars' )         // The method name on the API mock
			 ->willReturn( $api_response );      // Return the predefined API response

		// 4. Execute the method under test
		$result = $remoteData->fetch_calendars();

		// 5. Assert the result
		$this->assertEquals( $expected_formatted_result, $result );
	}

	public function test_fetch_calendars_api_failure() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define API failure response
		$api_response = array(
			'success'     => false,
			'data'        => null,
			'status_code' => 500,
			'error'       => 'API unavailable',
		);

		// 2. Configure the API mock
		$this->apiMock->expects( $this->once() )
			 ->method( 'get_calendars' )
			 ->willReturn( $api_response );

		// 3. Execute
		$result = $remoteData->fetch_calendars();

		// 4. Assert - Expect empty array on failure
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_calendars_success_but_no_items_key() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define API response data missing the 'items' key
		$api_response_data = array( 'kind' => 'calendar#calendarList' ); // No 'items'
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 2. Configure the API mock
		$this->apiMock->expects( $this->once() )
			 ->method( 'get_calendars' )
			 ->willReturn( $api_response );

		// 3. Execute
		$result = $remoteData->fetch_calendars();

		// 4. Assert - Expect empty array due to '?? []'
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_calendars_success_but_items_is_empty_array() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define API response data with empty 'items'
		$api_response_data = array( 'items' => array() );
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 2. Configure the API mock
		$this->apiMock->expects( $this->once() )
			 ->method( 'get_calendars' )
			 ->willReturn( $api_response );

		// 3. Execute
		$result = $remoteData->fetch_calendars();

		// 4. Assert - Expect empty array
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_calendars_success_but_data_is_null() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define API response data as null
		$api_response = array(
			'success' => true,
			'data'    => null,
		);

		// 2. Configure the API mock
		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $api_response );

		// 3. Execute
		$result = $remoteData->fetch_calendars();

		// 4. Assert - Expect empty array due to '?? []'
		$this->assertEquals( array(), $result );
	}


	// --- Tests for fetch_events() ---

	public function test_fetch_events_success() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define input data for fetching events
		$input_data = array(
			'calendar'   => 'primary',
			'start_date' => '2023-11-01T00:00:00Z', // UTC string format
			'end_date'   => '2023-11-01T23:59:59Z',  // UTC string format
		);

		// 2. Define expected response from the API mock
		$api_response_data = array(
			'items' => array(
				array(
					'id'      => 'event_1',
					'summary' => 'Morning Meeting',
					'start'   => array( 'dateTime' => '2023-11-01T10:00:00Z' ), // UTC time from Google
					'end'     => array( 'dateTime' => '2023-11-01T11:00:00Z' ),
				),
				array(
					'id'      => 'event_2',
					'summary' => 'Lunch',
					'start'   => array( 'dateTime' => '2023-11-01T13:00:00Z' ),
					'end'     => array( 'dateTime' => '2023-11-01T14:00:00Z' ),
				),
			),
		);
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 3. Define the expected formatted result (dates as 'Y-m-d H:i:s')
		$expected_formatted_result = array(
			array(
				'id'      => 'event_1',
				'start'   => '2023-11-01 10:00:00', // Converted from UTC ISO string
				'end'     => '2023-11-01 11:00:00',
				'summary' => 'Morning Meeting',
			),
			array(
				'id'      => 'event_2',
				'start'   => '2023-11-01 13:00:00',
				'end'     => '2023-11-01 14:00:00',
				'summary' => 'Lunch',
			),
		);

		// 4. Configure the API mock - including checking arguments
		$this->apiMock->expects( $this->once() )
			 ->method( 'get_events' )
			->with(
				$this->equalTo( $input_data['calendar'] ), // Check calendar ID
				// Check the arguments array passed for time range
				$this->callback(
					function( $args ) use ( $input_data ) {
						// Recreate expected formatted dates ('c' format = ISO 8601)
						$expected_start_c = ( new \DateTime( $input_data['start_date'], new \DateTimeZone( 'UTC' ) ) )->format( 'c' );
						$expected_end_c   = ( new \DateTime( $input_data['end_date'], new \DateTimeZone( 'UTC' ) ) )->format( 'c' );

						return is_array( $args ) &&
						isset( $args['timeMin'] ) && $args['timeMin'] === $expected_start_c &&
						isset( $args['timeMax'] ) && $args['timeMax'] === $expected_end_c &&
						isset( $args['timeZone'] ) && $args['timeZone'] === 'UTC';
					}
				)
			)
			 ->willReturn( $api_response );

		// 5. Execute
		$result = $remoteData->fetch_events( $input_data );

		// 6. Assert
		$this->assertEquals( $expected_formatted_result, $result );
	}

	public function test_fetch_events_api_failure() {
		$remoteData   = $this->createRemoteDataInstance();
		$input_data   = array(
			'calendar'   => 'primary',
			'start_date' => '2023-11-01T00:00:00Z',
			'end_date'   => '2023-11-01T23:59:59Z',
		);
		$api_response = array(
			'success' => false,
			'data'    => null,
			'error'   => 'Failed to fetch',
		);

		$this->apiMock->expects( $this->once() )
			 ->method( 'get_events' )
			 ->with( $input_data['calendar'], $this->isType( 'array' ) ) // Basic arg check
			 ->willReturn( $api_response );

		$result = $remoteData->fetch_events( $input_data );

		$this->assertEquals( array(), $result ); // Expect empty array on failure
	}


	public function test_fetch_events_success_but_no_items_key() {
		$remoteData        = $this->createRemoteDataInstance();
		$input_data        = array(
			'calendar'   => 'test-calendar-id', // Provide a calendar ID
			'start_date' => '2023-01-01T00:00:00Z', // Provide valid dates
			'end_date'   => '2023-01-01T23:59:59Z',
		);
		$api_response_data = array( 'kind' => 'calendar#events' ); // No 'items' key
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )
			->willReturn( $api_response );

		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_events_success_but_items_is_empty_array() {
		$remoteData        = $this->createRemoteDataInstance();
		$input_data        = array(
			'calendar'   => 'test-calendar-id', // Provide a calendar ID
			'start_date' => '2023-01-01T00:00:00Z', // Provide valid dates
			'end_date'   => '2023-01-01T23:59:59Z',
		);
		$api_response_data = array( 'items' => array() );
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
		   ->method( 'get_events' )
		   ->willReturn( $api_response );

		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_events_success_but_data_is_null() {
		$remoteData   = $this->createRemoteDataInstance();
		$input_data   = array(
			'calendar'   => 'test-calendar-id', // Provide a calendar ID
			'start_date' => '2023-01-01T00:00:00Z', // Provide valid dates
			'end_date'   => '2023-01-01T23:59:59Z',
		);
		$api_response = array(
			'success' => true,
			'data'    => null,
		);

		$this->apiMock->expects( $this->once() )
		   ->method( 'get_events' )
		   ->willReturn( $api_response );

		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}
} // End class RemoteDataTest
