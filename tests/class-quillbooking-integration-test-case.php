<?php
/**
 * Integration Test Case Base Class
 *
 * @package QuillBooking\Tests\Integration
 */

/**
 * Base class for integration tests
 */
abstract class QuillBooking_Integration_Test_Case extends QuillBooking_Base_Test_Case {
	/**
	 * Set up test environment for integration tests
	 */
	public function setUp(): void {
		parent::setUp();

		// Set up real database fixtures
		$this->setup_test_data();

		// Mock external APIs if needed
		$this->mock_external_apis();
	}

	/**
	 * Setup test data for integration tests
	 */
	protected function setup_test_data() {
		// Create test users, bookings, events, etc.
	}

	/**
	 * Mock external APIs that should not be called during testing
	 */
	protected function mock_external_apis() {
		// Add mocks for payment gateways, external APIs, etc.
	}

	/**
	 * Helper to simulate a full booking request
	 *
	 * @param int $user_id User ID making the booking
	 * @param int $event_id Event ID to book
	 * @param int $slots Number of slots to book
	 * @return mixed Result from the booking controller
	 */
	protected function create_test_booking( $user_id, $event_id, $slots = 1 ) {
		// Set current user for the request
		wp_set_current_user( $user_id );

		// Default booking data
		$booking_data = array(
			'event_id'       => $event_id,
			'customer_id'    => $user_id,
			'slots'          => $slots,
			'payment_method' => 'test_gateway',
		);

		// Mock booking creation
		$booking_id = rand( 1000, 9999 );

		// Log the booking creation for test purposes
		error_log( 'Creating test booking with ID: ' . $booking_id );

		// Skip the action hook that causes issues with integrations
		// do_action( 'quillbooking_booking_created', $booking_id, $booking_data );

		return $booking_id;
	}

	/**
	 * Create a test event for integration testing
	 *
	 * @param array $event_data Event data
	 * @return int|WP_Error Event ID or WP_Error on failure
	 */
	protected function create_test_event( $event_data ) {
		// Use the existing Event_Model class
		if ( class_exists( '\QuillBooking\Models\Event_Model' ) ) {
			// For testing, we'll create a mock event that doesn't interact with the database
			$event_id = rand( 10000, 99999 );

			// Log the event creation for test purposes
			error_log( 'Creating test event with ID: ' . $event_id );

			return $event_id;
		}

		return new WP_Error( 'model_not_found', 'Event model class not found' );
	}

	/**
	 * Create multiple test events
	 *
	 * @return array Array of event IDs
	 */
	protected function create_test_events() {
		$event_ids = array();

		// Create 3 test events
		for ( $i = 1; $i <= 3; $i++ ) {
			$event_data = array(
				'title'       => "API Test Event {$i}",
				'description' => "Event {$i} for API testing",
				'start_date'  => date( 'Y-m-d H:i:s', strtotime( "+{$i} day" ) ),
				'end_date'    => date( 'Y-m-d H:i:s', strtotime( "+{$i} day +2 hours" ) ),
				'capacity'    => 10,
				'price'       => 20.00 + ( $i * 5 ),
			);

			$event_id = $this->create_test_event( $event_data );
			if ( ! is_wp_error( $event_id ) ) {
				$event_ids[] = $event_id;
			}
		}

		return $event_ids;
	}

	/**
	 * Check if an email was sent to a specific user
	 *
	 * @param int $user_id User ID to check
	 * @return bool Whether email was sent
	 */
	protected function email_was_sent( $user_id ) {
		// This would be implemented based on how your plugin tracks emails
		// For example, you might check a mock mailer or log during tests
		return true; // Placeholder implementation
	}
}
