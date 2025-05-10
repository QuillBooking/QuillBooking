<?php
/**
 * Integration Test Data Setup
 *
 * @package QuillBooking\Tests\Integration
 */

namespace QuillBooking\Tests\Integration;

/**
 * Initialize integration test environment
 */
function initialize_integration_test_environment() {
	// Register test payment gateway
	register_test_payment_gateway();

	// Create test locations
	create_test_locations();

	// Create initial test users
	create_test_users();
}

/**
 * Register a test payment gateway for integration testing
 */
function register_test_payment_gateway() {
	if ( class_exists( '\QuillBooking\Payment\Payment_Gateway_Registry' ) ) {
		// Define a test gateway class if it doesn't exist
		if ( ! class_exists( '\QuillBooking\Payment\Gateways\Test_Gateway' ) ) {
			/**
			 * Test Payment Gateway for testing
			 */
			class Test_Gateway extends \QuillBooking\Payment\Gateway {
				/**
				 * Gateway constructor
				 */
				public function __construct() {
					$this->id      = 'test_gateway';
					$this->name    = 'Test Gateway';
					$this->enabled = true;
				}

				/**
				 * Process payment
				 *
				 * @param array $payment_data Payment data
				 * @return array|WP_Error Payment result or error
				 */
				public function process_payment( $payment_data ) {
					// Simulate payment processing
					if ( isset( $payment_data['payment_token'] ) && $payment_data['payment_token'] === 'test_fail_token' ) {
						return new \WP_Error( 'payment_failed', 'Payment failed' );
					}

					// Success response
					return array(
						'transaction_id' => 'test_' . time(),
						'status'         => 'completed',
					);
				}

				/**
				 * Process refund
				 *
				 * @param string $transaction_id Transaction ID
				 * @param float  $amount Amount to refund
				 * @param string $reason Refund reason
				 * @return bool|WP_Error Success or error
				 */
				public function process_refund( $transaction_id, $amount, $reason = '' ) {
					// Always succeed in test environment
					return true;
				}
			}
		}

		// Register the test gateway
		$registry = \QuillBooking\Payment\Payment_Gateway_Registry::instance();

		if ( method_exists( $registry, 'register_gateway' ) ) {
			$registry->register_gateway( 'test_gateway', '\QuillBooking\Payment\Gateways\Test_Gateway' );
		}
	}
}

/**
 * Create test locations for integration testing
 */
function create_test_locations() {
	if ( class_exists( '\QuillBooking\Locations\Location_Service' ) ) {
		$location_service = new \QuillBooking\Locations\Location_Service();

		$test_locations = array(
			array(
				'name'     => 'Test Location 1',
				'address'  => '123 Test Street',
				'city'     => 'Test City',
				'state'    => 'TS',
				'zip'      => '12345',
				'country'  => 'US',
				'capacity' => 50,
			),
			array(
				'name'     => 'Test Location 2',
				'address'  => '456 Integration Avenue',
				'city'     => 'Example City',
				'state'    => 'EX',
				'zip'      => '67890',
				'country'  => 'US',
				'capacity' => 100,
			),
		);

		foreach ( $test_locations as $location_data ) {
			if ( method_exists( $location_service, 'create_location' ) ) {
				$location_service->create_location( $location_data );
			}
		}
	}
}

/**
 * Create test users with different roles
 */
function create_test_users() {
	// Create an admin user if needed
	if ( ! username_exists( 'test_admin' ) ) {
		$admin_id   = wp_create_user( 'test_admin', 'test_password', 'admin@example.com' );
		$admin_user = new \WP_User( $admin_id );
		$admin_user->set_role( 'administrator' );

		// Add additional capabilities if needed
		if ( function_exists( '\QuillBooking\add_quillbooking_caps' ) ) {
			\QuillBooking\add_quillbooking_caps( $admin_user );
		}
	}

	// Create organizer user
	if ( ! username_exists( 'test_organizer' ) ) {
		$organizer_id   = wp_create_user( 'test_organizer', 'test_password', 'organizer@example.com' );
		$organizer_user = new \WP_User( $organizer_id );
		$organizer_user->set_role( 'editor' );

		// Add organizer capabilities if needed
		if ( function_exists( '\QuillBooking\add_organizer_caps' ) ) {
			\QuillBooking\add_organizer_caps( $organizer_user );
		}
	}

	// Create customer user
	if ( ! username_exists( 'test_customer' ) ) {
		$customer_id   = wp_create_user( 'test_customer', 'test_password', 'customer@example.com' );
		$customer_user = new \WP_User( $customer_id );
		$customer_user->set_role( 'subscriber' );
	}
}
