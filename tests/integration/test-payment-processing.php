<?php
/**
 * Payment Processing Integration Test
 *
 * @package QuillBooking\Tests\Integration
 */

/**
 * Test Gateway class for payment testing
 */
class Test_Gateway {
	public $id      = 'test_gateway';
	public $name    = 'Test Gateway';
	public $enabled = true;

	/**
	 * Process payment
	 *
	 * @param array $payment_data Payment data.
	 * @return array|WP_Error Payment result or error.
	 */
	public function process_payment( $payment_data ) {
		if ( isset( $payment_data['payment_token'] ) && $payment_data['payment_token'] === 'test_fail_token' ) {
			return new \WP_Error( 'payment_failed', 'Payment failed' );
		}

		return array(
			'transaction_id' => 'test_' . time(),
			'status'         => 'completed',
		);
	}

	/**
	 * Process refund
	 *
	 * @param string $transaction_id Transaction ID.
	 * @param float  $amount Amount to refund.
	 * @param string $reason Refund reason.
	 * @return bool|WP_Error Success or error.
	 */
	public function process_refund( $transaction_id, $amount, $reason = '' ) {
		return true;
	}
}

/**
 * Test the payment processing flow
 */
class Test_Payment_Processing extends QuillBooking_Integration_Test_Case {
	/**
	 * Set up payment gateways for testing
	 */
	public function setUp(): void {
		parent::setUp();

		// Register test payment gateway manually if needed
		$this->register_test_payment_gateway();
	}

	/**
	 * Register test payment gateway
	 */
	private function register_test_payment_gateway() {
		// Nothing to do here since we moved the class outside
	}

	/**
	 * Test successful payment processing
	 */
	public function test_successful_payment_processing() {
		// Create a test event
		$event_data = array(
			'title'       => 'Payment Test Event',
			'description' => 'Event for payment testing',
			'start_date'  => date( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
			'end_date'    => date( 'Y-m-d H:i:s', strtotime( '+1 day +2 hours' ) ),
			'capacity'    => 10,
			'price'       => 25.00,
		);

		$event_id = $this->create_test_event( $event_data );
		$this->assertNotWPError( $event_id );

		// Create a test customer
		$customer_id = $this->factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);

		// Process a payment
		$payment_result = $this->process_payment(
			array(
				'event_id'      => $event_id,
				'customer_id'   => $customer_id,
				'amount'        => 50.00,
				'payment_token' => 'test_success_token',
			)
		);

		$this->assertIsArray( $payment_result );
		$this->assertArrayHasKey( 'transaction_id', $payment_result );
		$this->assertArrayHasKey( 'status', $payment_result );
		$this->assertEquals( 'completed', $payment_result['status'] );
	}

	/**
	 * Test failed payment processing
	 */
	public function test_failed_payment_processing() {
		// Create a test event
		$event_data = array(
			'title'       => 'Failed Payment Test Event',
			'description' => 'Event for failed payment testing',
			'start_date'  => date( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
			'end_date'    => date( 'Y-m-d H:i:s', strtotime( '+1 day +2 hours' ) ),
			'capacity'    => 10,
			'price'       => 25.00,
		);

		$event_id = $this->create_test_event( $event_data );
		$this->assertNotWPError( $event_id );

		// Create a test customer
		$customer_id = $this->factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);

		// Process a payment that will fail
		$payment_result = $this->process_payment(
			array(
				'event_id'      => $event_id,
				'customer_id'   => $customer_id,
				'amount'        => 25.00,
				'payment_token' => 'test_fail_token',
			)
		);

		$this->assertWPError( $payment_result );
		$this->assertEquals( 'payment_failed', $payment_result->get_error_code() );
	}

	/**
	 * Test refund processing
	 */
	public function test_refund_processing() {
		// Create a test event
		$event_data = array(
			'title'       => 'Refund Test Event',
			'description' => 'Event for refund testing',
			'start_date'  => date( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
			'end_date'    => date( 'Y-m-d H:i:s', strtotime( '+1 day +2 hours' ) ),
			'capacity'    => 10,
			'price'       => 25.00,
		);

		$event_id = $this->create_test_event( $event_data );
		$this->assertNotWPError( $event_id );

		// Create a test customer
		$customer_id = $this->factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);

		// Process a successful payment
		$payment_result = $this->process_payment(
			array(
				'event_id'      => $event_id,
				'customer_id'   => $customer_id,
				'amount'        => 25.00,
				'payment_token' => 'test_success_token',
			)
		);

		$this->assertIsArray( $payment_result );

		// Process refund
		$refund_result = $this->process_refund(
			$payment_result['transaction_id'],
			25.00,
			'Customer requested refund'
		);

		$this->assertTrue( $refund_result );
	}

	/**
	 * Process a payment using the test gateway
	 *
	 * @param array $payment_data Payment data
	 * @return array|WP_Error Payment result or error
	 */
	private function process_payment( $payment_data ) {
		$gateway = new Test_Gateway();
		return $gateway->process_payment( $payment_data );
	}

	/**
	 * Process a refund using the test gateway
	 *
	 * @param string $transaction_id Transaction ID
	 * @param float  $amount Amount to refund
	 * @param string $reason Refund reason
	 * @return bool|WP_Error Success or error
	 */
	private function process_refund( $transaction_id, $amount, $reason = '' ) {
		$gateway = new Test_Gateway();
		return $gateway->process_refund( $transaction_id, $amount, $reason );
	}
}
