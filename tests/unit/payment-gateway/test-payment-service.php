<?php
/**
 * Class Payment_Service Test
 *
 * @package QuillBooking
 */


use QuillBooking\Models\Booking_Model;
use QuillBooking\Tests\Mocks\Mock_Payment_Gateway;
use QuillBooking\Tests\Mocks\Mock_Payment_Service;

/**
 * Test for QuillBooking Payment Service
 */
class PaymentServiceTest extends QuillBooking_Base_Test_Case {

	/**
	 * Mock Payment Service implementation
	 */
	private $payment_service;

	/**
	 * Mock Payment Gateway
	 */
	private $payment_gateway;

	/**
	 * Mock Booking Model
	 */
	private $booking;

	/**
	 * Event object
	 */
	private $event;

	/**
	 * Setup the test
	 */
	public function setUp(): void {
		parent::setUp();

		// Make sure our mock classes are autoloaded
		require_once __DIR__ . '/test-mock-payment-gateway.php';
		require_once __DIR__ . '/test-mock-payment-service.php';

		// Create mock payment gateway
		$this->payment_gateway = new Mock_Payment_Gateway(
			true,
			array(
				'mode'    => 'test',
				'api_key' => 'test_key',
			)
		);

		// Create event object with payment settings
		$this->event                    = new stdClass();
		$this->event->payments_settings = array(
			'type'                                   => 'native',
			'enable_payment'                         => true,
			'enable_' . $this->payment_gateway->slug => true,
		);

		// Create mock booking with proper method expectation for event property
		$this->booking = $this->getMockBuilder( Booking_Model::class )
			->disableOriginalConstructor()
			->getMock();

		// Set up the mock to return our event object when event property is accessed
		$this->booking->expects( $this->any() )
			->method( '__get' )
			->with( 'event' )
			->willReturn( $this->event );

		// Create mock payment service
		$this->payment_service = new Mock_Payment_Service( $this->payment_gateway );
	}

	/**
	 * Test that payment service is initialized correctly
	 */
	public function test_initialization() {
		// Test that hooks are registered
		$this->assertEquals(
			10,
			has_action( 'quillbooking_after_booking_created', array( $this->payment_service, 'after_booking_created' ) )
		);
	}

	/**
	 * Test after_booking_created with matching payment method
	 */
	public function test_after_booking_created_with_matching_payment_method() {
		// Reset the payment service
		$this->payment_service->reset();

		// Call after_booking_created with matching payment method
		$args = array( 'payment_method' => $this->payment_gateway->slug );
		$this->payment_service->after_booking_created( $this->booking, $args );

		// Verify process_payment was called
		$this->assertTrue( $this->payment_service->process_payment_called );
		$this->assertSame( $this->booking, $this->payment_service->last_booking );
		$this->assertEquals( $this->payment_gateway->get_mode_settings(), $this->payment_service->last_mode_settings );
	}

	/**
	 * Test after_booking_created with non-matching payment method
	 */
	public function test_after_booking_created_with_non_matching_payment_method() {
		// Reset the payment service
		$this->payment_service->reset();

		// Call after_booking_created with non-matching payment method
		$args = array( 'payment_method' => 'other_gateway' );
		$this->payment_service->after_booking_created( $this->booking, $args );

		// Verify process_payment was not called
		$this->assertFalse( $this->payment_service->process_payment_called );
		$this->assertNull( $this->payment_service->last_booking );
	}

	/**
	 * Test after_booking_created with payments disabled for event
	 */
	public function test_after_booking_created_with_payments_disabled() {
		// Reset the payment service
		$this->payment_service->reset();

		// Set enable_payment to false
		$this->event->payments_settings['enable_payment'] = false;

		// Call after_booking_created with matching payment method
		$args = array( 'payment_method' => $this->payment_gateway->slug );
		$this->payment_service->after_booking_created( $this->booking, $args );

		// Verify process_payment was not called
		$this->assertFalse( $this->payment_service->process_payment_called );
	}

	/**
	 * Test after_booking_created with gateway disabled for event
	 */
	public function test_after_booking_created_with_gateway_disabled() {
		// Reset the payment service
		$this->payment_service->reset();

		// Set enable_test_gateway to false
		$this->event->payments_settings[ 'enable_' . $this->payment_gateway->slug ] = false;

		// Call after_booking_created with matching payment method
		$args = array( 'payment_method' => $this->payment_gateway->slug );
		$this->payment_service->after_booking_created( $this->booking, $args );

		// Verify process_payment was not called
		$this->assertFalse( $this->payment_service->process_payment_called );
	}

	/**
	 * Test after_booking_created with non-native payment type
	 */
	public function test_after_booking_created_with_non_native_payment_type() {
		// Reset the payment service
		$this->payment_service->reset();

		// Set type to non-native
		$this->event->payments_settings['type'] = 'external';

		// Call after_booking_created with matching payment method
		$args = array( 'payment_method' => $this->payment_gateway->slug );
		$this->payment_service->after_booking_created( $this->booking, $args );

		// Verify process_payment was not called
		$this->assertFalse( $this->payment_service->process_payment_called );
	}

	/**
	 * Test after_booking_created with unconfigured payment gateway
	 */
	public function test_after_booking_created_with_unconfigured_gateway() {
		// Create mock payment gateway that's not configured
		$unconfigured_gateway = new Mock_Payment_Gateway( false );

		// Create mock payment service with unconfigured gateway
		$payment_service = new Mock_Payment_Service( $unconfigured_gateway );

		// Call after_booking_created with matching payment method
		$args = array( 'payment_method' => $unconfigured_gateway->slug );
		$payment_service->after_booking_created( $this->booking, $args );

		// Verify process_payment was not called
		$this->assertFalse( $payment_service->process_payment_called );
	}

	/**
	 * Test initialization with unconfigured gateway
	 */
	public function test_initialization_with_unconfigured_gateway() {
		// Create mock payment gateway that's not configured
		$unconfigured_gateway = new Mock_Payment_Gateway( false );

		// Create mock payment service with unconfigured gateway
		$payment_service = new Mock_Payment_Service( $unconfigured_gateway );

		// Check that the action was not registered
		$this->assertFalse(
			has_action( 'quillbooking_after_booking_created', array( $payment_service, 'after_booking_created' ) )
		);
	}

	/**
	 * Test availability test method
	 */
	public function test_availability_check() {
		// Reset booking and payment service
		$this->payment_service->reset();
		$this->event->payments_settings = array(
			'type'                                   => 'native',
			'enable_payment'                         => true,
			'enable_' . $this->payment_gateway->slug => true,
		);

		// Test with all conditions satisfied
		$this->assertTrue( $this->payment_service->test_availability( $this->booking ) );

		// Test with payment disabled
		$this->payment_service->reset();
		$this->event->payments_settings['enable_payment'] = false;
		$this->assertFalse( $this->payment_service->test_availability( $this->booking ) );

		// Test with gateway disabled
		$this->payment_service->reset();
		$this->event->payments_settings['enable_payment']                           = true;
		$this->event->payments_settings[ 'enable_' . $this->payment_gateway->slug ] = false;
		$this->assertFalse( $this->payment_service->test_availability( $this->booking ) );

		// Test with non-native payment type
		$this->payment_service->reset();
		$this->event->payments_settings['type']                                     = 'external';
		$this->event->payments_settings['enable_payment']                           = true;
		$this->event->payments_settings[ 'enable_' . $this->payment_gateway->slug ] = true;
		$this->assertFalse( $this->payment_service->test_availability( $this->booking ) );
	}
}
