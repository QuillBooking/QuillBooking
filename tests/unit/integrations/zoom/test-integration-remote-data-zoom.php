<?php

namespace QuillBooking\Tests\Integrations\Zoom; // <<< CHANGE Namespace

use PHPUnit\Framework\TestCase;
// PHPMock is not needed here
use QuillBooking\Integrations\Zoom\Remote_Data as ZoomRemoteData; // <<< CHANGE Class being tested
use QuillBooking\Integrations\Zoom\Integration as ZoomIntegration; // <<< CHANGE Dependency
use QuillBooking\Integrations\Zoom\API as ZoomAPI; // <<< CHANGE API Class

// Assuming your base test case is available if needed
use QuillBooking_Base_Test_Case; // Or remove if not extending a base

// Use TestCase directly if QuillBooking_Base_Test_Case isn't needed here
class Test_Integration_Remote_Data_Zoom extends TestCase {


	/**
	 * Mock object for the Integration dependency.
	 *
	 * @var ZoomIntegration|\PHPUnit\Framework\MockObject\MockObject // <<< CHANGE Type hint
	 */
	private $integrationMock;

	/**
	 * Mock object for the API dependency.
	 *
	 * @var ZoomAPI|\PHPUnit\Framework\MockObject\MockObject // <<< CHANGE Type hint
	 */
	private $apiMock;

	protected function setUp(): void {
		parent::setUp();

		// Create mock for the Zoom Integration class
		$this->integrationMock = $this->createMock( ZoomIntegration::class ); // <<< CHANGE Class

		// Create mock for the Zoom API class
		$this->apiMock = $this->getMockBuilder( ZoomAPI::class ) // <<< CHANGE Class
			->disableOriginalConstructor()
			->addMethods( array( 'get_calendars', 'get_events' ) ) // <<< CHANGE Methods
			->getMock();

		// Configure the mocked Integration to return the mocked API object
		$this->integrationMock->api = $this->apiMock;
	}

	/**
	 * Helper method to create an instance of the class under test.
	 *
	 * @return ZoomRemoteData // <<< CHANGE Return type
	 */
	private function createRemoteDataInstance(): ZoomRemoteData {
		// <<< CHANGE Return type
		// Pass the Zoom Integration mock
		return new ZoomRemoteData( $this->integrationMock ); // <<< CHANGE Class
	}

	// --- Tests for fetch_calendars() ---

	public function test_fetch_calendars_success() {
		$remoteData = $this->createRemoteDataInstance();

		// 1. Define expected Zoom API response (uses 'value')
		$api_response_data = array(
			'value' => array( // <<< CHANGE key to 'value'
				array(
					'id'    => 'cal_1',
					'name'  => 'Zoom Room 1',
					'owner' => array( 'address' => 'room1@example.com' ),
				),
				array(
					'id'    => 'cal_2',
					'name'  => 'Personal Meeting',
					'owner' => array( 'address' => 'user@example.com' ),
				),
			),
		);
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 2. Define expected formatted result (uses sprintf)
		$expected_formatted_result = array(
			array(
				'id'   => 'cal_1',
				'name' => 'Zoom Room 1 (room1@example.com)',
			), // <<< CHANGE formatting
			array(
				'id'   => 'cal_2',
				'name' => 'Personal Meeting (user@example.com)',
			),
		);

		// 3. Configure API mock
		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' ) // Assuming Zoom API class has this method
			->willReturn( $api_response );

		// 4. Execute
		$result = $remoteData->fetch_calendars();

		// 5. Assert
		$this->assertEquals( $expected_formatted_result, $result );
	}

	public function test_fetch_calendars_api_failure() {
		$remoteData   = $this->createRemoteDataInstance();
		$api_response = array(
			'success' => false,
			'error'   => 'Zoom API Error',
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $api_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_calendars_success_but_no_value_key() {
		// <<< CHANGE Test name
		$remoteData        = $this->createRemoteDataInstance();
		$api_response_data = array( 'other_key' => 'some_data' ); // No 'value' key
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $api_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_calendars_success_but_value_is_empty_array() {
		// <<< CHANGE Test name
		$remoteData        = $this->createRemoteDataInstance();
		$api_response_data = array( 'value' => array() ); // Empty value array
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $api_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_calendars_success_but_data_is_null() {
		$remoteData   = $this->createRemoteDataInstance();
		$api_response = array(
			'success' => true,
			'data'    => null,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_calendars' )
			->willReturn( $api_response );

		$result = $remoteData->fetch_calendars();
		$this->assertEquals( array(), $result );
	}


	// --- Tests for fetch_events() ---

	public function test_fetch_events_success() {
		$remoteData = $this->createRemoteDataInstance();
		$input_data = array(
			'calendar'   => 'zoom_cal_1',
			'start_date' => '2023-11-05T00:00:00Z',
			'end_date'   => '2023-11-05T23:59:59Z',
		);

		// 2. Define expected Zoom API response
		$api_response_data = array(
			'value' => array( // <<< CHANGE key to 'value'
				array(
					'id'      => 'zoom_event_1',
					'subject' => 'Team Sync', // <<< CHANGE key to 'subject'
					'start'   => array( 'dateTime' => '2023-11-05T14:00:00Z' ),
					'end'     => array( 'dateTime' => '2023-11-05T15:00:00Z' ),
					// Other Zoom fields might be present but aren't used by formatting logic
				),
				array(
					'id'      => 'zoom_event_2',
					'subject' => 'Project Update', // <<< CHANGE key to 'subject'
					'start'   => array( 'dateTime' => '2023-11-05T18:00:00Z' ),
					'end'     => array( 'dateTime' => '2023-11-05T18:30:00Z' ),
				),
			),
		);
		$api_response = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		// 3. Define the expected formatted result
		$expected_formatted_result = array(
			array(
				'id'      => 'zoom_event_1',
				'start'   => '2023-11-05 14:00:00',
				'end'     => '2023-11-05 15:00:00',
				'subject' => 'Team Sync', // <<< CHANGE key
			),
			array(
				'id'      => 'zoom_event_2',
				'start'   => '2023-11-05 18:00:00',
				'end'     => '2023-11-05 18:30:00',
				'subject' => 'Project Update', // <<< CHANGE key
			),
		);

		// 4. Configure the API mock - check calendar, args, AND headers
		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )
			->with(
				$this->equalTo( $input_data['calendar'] ),
				// Check the specific Zoom API args
				$this->callback(
					function ( $args ) use ( $input_data ) {
						$start_dt_str = ( new \DateTime( $input_data['start_date'], new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' );
						$end_dt_str   = ( new \DateTime( $input_data['end_date'], new \DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d\TH:i:s\Z' );
						return is_array( $args ) &&
						isset( $args['startdatetime'] ) && $args['startdatetime'] === $start_dt_str && // <<< CHANGE keys
						isset( $args['enddatetime'] ) && $args['enddatetime'] === $end_dt_str && // <<< CHANGE keys
						isset( $args['$select'] ) && $args['$select'] === 'subject,recurrence,showAs,start,end,subject,isAllDay,transactionId' && // <<< Check keys
						isset( $args['$top'] ) && $args['$top'] === 100;                                // <<< Check keys
					}
				),
				// Check the headers argument
				$this->equalTo( array( 'Prefer' => 'zoom.timezone="UTC"' ) ) // <<< CHECK headers arg
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
			'calendar'   => 'zoom_cal_1',
			'start_date' => '2023-11-05T00:00:00Z',
			'end_date'   => '2023-11-05T23:59:59Z',
		);
		$api_response = array( 'success' => false );

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )
			// Check args if needed, especially headers
			->with( $input_data['calendar'], $this->isType( 'array' ), $this->isType( 'array' ) )
			->willReturn( $api_response );

		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_events_success_but_no_value_key() {
		// <<< CHANGE Test name
		$remoteData        = $this->createRemoteDataInstance();
		$input_data        = array(
			'calendar'   => 'test-calendar-id', // Provide a calendar ID
			'start_date' => '2023-01-01T00:00:00Z', // Provide valid dates
			'end_date'   => '2023-01-01T23:59:59Z',
		);
		$api_response_data = array( 'other_key' => 'data' ); // No 'value'
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )->willReturn( $api_response );
		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}

	public function test_fetch_events_success_but_value_is_empty_array() {
		// <<< CHANGE Test name
		$remoteData        = $this->createRemoteDataInstance();
		$input_data        = array(
			'calendar'   => 'test-calendar-id', // Provide a calendar ID
			'start_date' => '2023-01-01T00:00:00Z', // Provide valid dates
			'end_date'   => '2023-01-01T23:59:59Z',
		);
		$api_response_data = array( 'value' => array() ); // Empty 'value'
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )->willReturn( $api_response );
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
		); // Null data

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )->willReturn( $api_response );
		$result = $remoteData->fetch_events( $input_data );
		$this->assertEquals( array(), $result );
	}

	// Keep this test, but verify Zoom code handles 'date' vs 'dateTime'
	// The provided Zoom\Remote_Data code does NOT handle 'date' key, so this test
	// should currently fail if the API mock returns 'date' key.
	public function test_fetch_events_event_missing_datetime() {
		$remoteData        = $this->createRemoteDataInstance();
		$input_data        = array(
			'calendar'   => 'test-calendar-id',
			'start_date' => '2023-01-01T00:00:00Z',
			'end_date'   => '2023-01-01T23:59:59Z',
		);
		$api_response_data = array(
			'value' => array(
				array(
					'id'      => 'zoom_all_day',
					'subject' => 'Zoom All Day Event',
					'start'   => array( 'date' => '2023-11-05' ), // Use 'date' key
					'end'     => array( 'date' => '2023-11-06' ), // Use 'date' key
				),
			),
		);
		$api_response      = array(
			'success' => true,
			'data'    => $api_response_data,
		);

		$this->apiMock->expects( $this->once() )
			->method( 'get_events' )->willReturn( $api_response );

		// This call should now trigger the expected Warning
		$request = $remoteData->fetch_events( $input_data );

		$this->assertEquals( array(), $request );

		// No assertEquals([]) needed here, as the expectation is the warning itself.
	}
} // End class Test_Integration_Remote_Data_Zoom
