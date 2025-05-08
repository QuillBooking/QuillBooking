<?php

namespace QuillBooking\Tests\Integrations\Twilio;

use phpmock\phpunit\PHPMock;
use phpmock\MockBuilder;
// Classes involved
use QuillBooking\Integrations\Twilio\Notifications as TwilioNotifications;
use QuillBooking\Integrations\Twilio\Integration as TwilioIntegration;
use QuillBooking\Integrations\Twilio\API as TwilioAPI;
use QuillBooking\Managers\Merge_Tags_Manager;
use QuillBooking\QuillBooking; // For QuillBooking::instance()->tasks
use QuillBooking\Tasks\Tasks; // For tasks mock
use QuillBooking\Integration\Accounts; // For accounts mock
use QuillBooking\Models\Booking_Model;
use QuillBooking\Models\Event_Model;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Tasks as QuillBookingTasks;
use QuillBooking_Base_Test_Case;
use WP_Error;

// Assuming QuillBooking_Base_Test_Case extends WP_UnitTestCase or TestCase
class Test_Integration_Notifications_Twilio extends QuillBooking_Base_Test_Case {

	use PHPMock;

	// Namespace where global functions are called from within Twilio Notifications class
	private const NOTIFICATIONS_NAMESPACE = 'QuillBooking\Integrations\Twilio';
	private const MANAGERS_NAMESPACE      = 'QuillBooking\Managers'; // For Merge_Tags_Manager
	private const CORE_NAMESPACE          = 'QuillBooking'; // For QuillBooking::instance()

	/** @var TwilioIntegration|\PHPUnit\Framework\MockObject\MockObject */
	private $integrationMock;
	/** @var TwilioAPI|\PHPUnit\Framework\MockObject\MockObject */
	private $apiMock;
	/** @var Merge_Tags_Manager|\PHPUnit\Framework\MockObject\MockObject */
	private $mergeTagsManagerMock;
	/** @var Tasks|\PHPUnit\Framework\MockObject\MockObject */
	private $tasksMock; // For QuillBooking::instance()->tasks
	/** @var Accounts|\PHPUnit\Framework\MockObject\MockObject */
	private $accountsMock; // Mocked in Integration Mock usually, or needed here if accessed directly

	// Model Mocks
	/** @var Booking_Model|\PHPUnit\Framework\MockObject\MockObject */
	private $bookingMock;
	/** @var Event_Model|\PHPUnit\Framework\MockObject\MockObject */
	private $eventMock;
	/** @var Calendar_Model|\PHPUnit\Framework\MockObject\MockObject */
	private $calendarMock;
	/** @var \PHPUnit\Framework\MockObject\MockObject */
	private $logMock;

	// Stores the instance of Notifications for testing callbacks
	private $notificationsInstance;

	public function setUp(): void {
		parent::setUp();

		// --- Mock Dependencies ---
		$this->integrationMock      = $this->createMock( TwilioIntegration::class );
		$this->apiMock              = $this->createMock( TwilioAPI::class );
		$this->mergeTagsManagerMock = $this->getMockBuilder( Merge_Tags_Manager::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'process_merge_tags' ) )
			->getMock();
		$this->tasksMock            = $this->createMock( QuillBookingTasks::class );
		$this->accountsMock         = $this->createMock( Accounts::class ); // Assume Accounts object is accessible

		// --- Mock Models ---
		$this->bookingMock = $this->getMockBuilder( Booking_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( '__get', 'logs' ) )
			->getMock();
		$this->logMock     = $this->getMockBuilder( \stdClass::class )
			->disableOriginalConstructor()
			->addMethods( array( 'create' ) )
			->getMock();
		$this->logMock->method( 'create' );
		$this->bookingMock->method( 'logs' )->willReturn( $this->logMock );
		$this->eventMock                   = $this->getMockBuilder( Event_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( '__get' ) )
			->getMock();
		$this->eventMock->id               = 456;
		$this->eventMock->name             = 'Test Event';
		$this->calendarMock                = $this->getMockBuilder( Calendar_Model::class )
			->disableOriginalConstructor()
			->onlyMethods( array( '__get' ) )
			->getMock();
		$this->calendarMock->id            = 123;
		$this->calendarMock->name          = 'TestCal';
		$this->eventMock->calendar         = $this->calendarMock;
		$this->bookingMock->event          = $this->eventMock;
		$this->bookingMock->attendee_phone = '+15005551111'; // Example phone
		$this->bookingMock->calendar       = $this->calendarMock; // Link calendar directly to booking for logs

		// Mock QuillBooking::instance()->tasks
		$qbInstanceMock        = $this->getMockBuilder( QuillBooking::class )
			->disableOriginalConstructor()
			->addMethods( array( 'tasks' ) )
			->getMock();
		$qbInstanceMock->tasks = $this->tasksMock; // Assign tasks mock

		// --- Mock Global Functions ---
		$this->getFunctionMock( self::NOTIFICATIONS_NAMESPACE, '__' )
			->expects( $this->any() )->willReturnArgument( 0 );
		// Mock error_log if needed (called in send_sms)
		$this->getFunctionMock( self::NOTIFICATIONS_NAMESPACE, 'error_log' )
			->expects( $this->any() )->willReturn( true ); // Just allow it to run
		$this->getFunctionMock( self::NOTIFICATIONS_NAMESPACE, 'wp_json_encode' )
			->expects( $this->any() )->willReturnCallback( 'json_encode' );

		// --- Mock Integration Object properties/methods needed by Notifications ---
		// Assume Notifications accesses accounts via $integration->accounts
		$this->integrationMock->accounts = $this->accountsMock;
		// Configure the connect method on the integration mock

		$this->integrationMock->method( 'connect' )->willReturn( $this->apiMock ); // Default success

		// --- Instantiate the Class Under Test ---
		// Needs to happen AFTER Merge_Tags_Manager::instance() is mocked
		$this->notificationsInstance = new TwilioNotifications( $this->integrationMock );
	}

	protected function tearDown(): void {
		// Disable static mocks
		foreach ( $this->mockStaticMethods ?? array() as $mock ) {
			$mock->disable();
		}
		$this->mockStaticMethods = array();
		parent::tearDown();
	}

	// Store static mocks to disable them in tearDown
	private $mockStaticMethods = array();

	// Helper to set up common mocks for sending messages
	private function setupMessageSendMocks( string $templateMessage, string $processedMessage, string $accountId = 'acc1' ) {
		// Mock accounts needed by send_sms/send_whatsapp
		$this->accountsMock->method( 'get_accounts' )->willReturn( array( $accountId => array( 'data' ) ) );
		// Mock connect needed by send_sms/send_whatsapp (assume success)
		$this->integrationMock->method( 'connect' )->with( $this->calendarMock->id, $accountId )->willReturn( $this->apiMock );
		// Mock merge tags processing
		// make reflection to access private method
		$reflection = new \ReflectionClass( $this->mergeTagsManagerMock );
		$method     = $reflection->getMethod( 'process_merge_tags' );
		$method->setAccessible( true );
		// Mock the process_merge_tags method
		// This is a bit tricky since we need to mock the method on the instance
		// and not the class itself. We can use a closure to do this.
		$this->mergeTagsManagerMock->method( 'process_merge_tags' )
			->willReturnCallback(
				function ( $message, $booking ) use ( $templateMessage, $processedMessage ) {
					if ( $message === $templateMessage ) {
						  return $processedMessage;
					}
					return $message; // Return original message if not matching
				}
			);
	}


	// --- Test Cases for Action Hooks ---
	// We test the public methods called by the hooks. Testing add_action itself is harder.

	public function test_send_booking_created_sms_sends_attendee_and_organizer() {
		$templateMessageAttendee   = 'Booking Confirmed: {event_name}';
		$templateMessageOrganizer  = 'New Booking: {attendee_name}';
		$processedMessageAttendee  = 'Booking Confirmed: Test Event';
		$processedMessageOrganizer = 'New Booking: Attendee Name'; // Assuming merge tag processing works
		$accountId                 = 'acc_active';

		// Mock Event SMS settings
		$this->eventMock->sms_notifications = array(
			'attendee_confirmation'  => array(
				'enabled'  => true,
				'template' => array(
					'type'    => 'sms',
					'message' => $templateMessageAttendee,
				),
			),
			'organizer_confirmation' => array(
				'enabled'  => true,
				'template' => array(
					'type'    => 'sms',
					'message' => $templateMessageOrganizer,
				),
			),
		);
		// Mock booking properties needed by merge tags/send
		$this->bookingMock->method( '__get' )->willReturnMap( array( array( 'attendee_phone', '+15005551111' ) ) );

		// Setup mocks for sending
		$this->setupMessageSendMocks( $templateMessageAttendee, $processedMessageAttendee, $accountId );
		// Need second setup for organizer message (or make setupMessageSendMocks more flexible)
		$this->mergeTagsManagerMock->method( 'process_merge_tags' )
			->withConsecutive(
				array( $templateMessageAttendee, $this->bookingMock ),
				array( $templateMessageOrganizer, $this->bookingMock )
			)->willReturnOnConsecutiveCalls( $processedMessageAttendee, $processedMessageOrganizer );

		// Expect API send_sms to be called twice
		$this->apiMock->expects( $this->exactly( 2 ) )->method( 'send_sms' )
			->withConsecutive(
				array( $this->equalTo( '+15005551111' ), $this->equalTo( $processedMessageAttendee ) ),
				array( $this->equalTo( '+15005551111' ), $this->equalTo( $processedMessageOrganizer ) ) // Assuming organizer gets it too? Check logic. Sent to attendee_phone twice in current code.
			)->willReturn( array( 'success' => true ) ); // Simulate API success

		// Execute the method hooked to the action
		$this->notificationsInstance->send_booking_created_sms( $this->bookingMock );
	}

	public function test_send_booking_created_sends_whatsapp_if_type_is_whatsapp() {
		$templateMessage  = 'WhatsApp Confirm: {event_name}';
		$processedMessage = 'WhatsApp Confirm: Test Event';
		$accountId        = 'acc_whatsapp';
		$toNumber         = '+15005552222';

		$this->eventMock->sms_notifications = array(
			'attendee_confirmation'  => array(
				'enabled'  => true,
				'template' => array(
					'type'    => 'whatsapp',
					'message' => $templateMessage,
				),
			), // Type is whatsapp
			'organizer_confirmation' => array( 'enabled' => false ), // Disable organizer for simplicity
		);
		$this->bookingMock->method( '__get' )->willReturnMap( array( array( 'attendee_phone', $toNumber ) ) );

		$this->setupMessageSendMocks( $templateMessage, $processedMessage, $accountId );

		// Expect send_whatsapp_message to be called
		$this->apiMock->expects( $this->once() )->method( 'send_whatsapp_message' )
			->with( $toNumber, $processedMessage )
			->willReturn( array( 'success' => true ) );
		// Expect send_sms NOT to be called
		$this->apiMock->expects( $this->never() )->method( 'send_sms' );

		$this->notificationsInstance->send_booking_created_sms( $this->bookingMock );
	}

	public function test_send_booking_created_sms_does_nothing_if_disabled() {
		$this->eventMock->sms_notifications = array(
			'attendee_confirmation'  => array( 'enabled' => false ), // Disabled
			'organizer_confirmation' => array( 'enabled' => false ), // Disabled
		);

		// Expect API NOT to be called
		$this->apiMock->expects( $this->never() )->method( 'send_sms' );
		$this->apiMock->expects( $this->never() )->method( 'send_whatsapp_message' );

		$this->notificationsInstance->send_booking_created_sms( $this->bookingMock );
	}

	// --- Test Direct Send Methods ---

	public function test_send_sms_calls_api_correctly() {
		$toNumber         = '+15005553333';
		$rawMessage       = 'Raw message with {event_name}';
		$processedMessage = 'Raw message with Test Event';
		$accountId        = 'acc_direct';

		$this->setupMessageSendMocks( $rawMessage, $processedMessage, $accountId );

		$this->apiMock->expects( $this->once() )->method( 'send_sms' )
			->with( $toNumber, $processedMessage )
			->willReturn( array( 'success' => true ) );

		// Execute the public send_sms method
		$this->notificationsInstance->send_sms( $toNumber, $rawMessage, $this->bookingMock );
	}

	public function test_send_sms_logs_error_if_connect_fails() {
		$toNumber     = '+15005553333';
		$rawMessage   = 'Raw message';
		$accountId    = 'acc_connect_fail';
		$connectError = new WP_Error( 'conn_fail', 'Twilio Connect Failed' );

		// Mock accounts
		$this->accountsMock->method( 'get_accounts' )->willReturn( array( $accountId => array( 'data' ) ) );
		// Mock connect to FAIL
		$this->integrationMock->method( 'connect' )->with( $this->calendarMock->id, $accountId )->willReturn( $connectError );

		// Expect log create to be called
		$this->logMock->expects( $this->once() )->method( 'create' )
			->with( $this->callback( fn( $log) => $log['type'] === 'error' && str_contains( $log['message'], 'Error Connecting to Twilio' ) ) );
		// Expect API send_sms never called
		$this->apiMock->expects( $this->never() )->method( 'send_sms' );
		// Expect merge tags NOT called if connect fails before it
		$this->mergeTagsManagerMock->expects( $this->never() )->method( 'process_merge_tags' );

		$this->notificationsInstance->send_sms( $toNumber, $rawMessage, $this->bookingMock );
	}

	// --- Test Reminder Registration ---

	public function test_send_reminder_sms_registers_callbacks() {
		// Expect register_callback to be called twice on the tasks mock
		$this->tasksMock->expects( $this->exactly( 2 ) )
			->method( 'register_callback' )
			->withConsecutive(
				array( 'booking_organizer_reminder', array( $this->notificationsInstance, 'send_organizer_reminder_sms' ) ),
				array( 'booking_attendee_reminder', array( $this->notificationsInstance, 'send_attendee_reminder_sms' ) )
			);

		// Execute the method that runs on init hook
		$this->notificationsInstance->send_reminder_sms();
	}
} // End Test Class
