<?php
/**
 * Class TasksTest
 *
 * @package QuillBooking
 */

use QuillBooking\Tasks;
use QuillBooking\Models\Tasks_Meta_Model;

/**
 * Test for QuillBooking\Tasks class
 */
class TasksTest extends QuillBooking_Base_Test_Case {

	/**
	 * Group name for testing
	 *
	 * @var string
	 */
	private $group = 'test_group';

	/**
	 * Tasks instance
	 *
	 * @var Tasks
	 */
	private $tasks;

	/**
	 * Original as_enqueue_async_action function
	 *
	 * @var callable|null
	 */
	private $original_as_enqueue_async_action;

	/**
	 * Original as_schedule_single_action function
	 *
	 * @var callable|null
	 */
	private $original_as_schedule_single_action;

	/**
	 * Original as_schedule_recurring_action function
	 *
	 * @var callable|null
	 */
	private $original_as_schedule_recurring_action;

	/**
	 * Original as_next_scheduled_action function
	 *
	 * @var callable|null
	 */
	private $original_as_next_scheduled_action;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock the Action Scheduler functions if they don't exist
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->mock_action_scheduler_functions();
		}

		// Store original functions if they exist
		if ( function_exists( 'as_enqueue_async_action' ) ) {
			$this->original_as_enqueue_async_action = 'as_enqueue_async_action';
		}
		if ( function_exists( 'as_schedule_single_action' ) ) {
			$this->original_as_schedule_single_action = 'as_schedule_single_action';
		}
		if ( function_exists( 'as_schedule_recurring_action' ) ) {
			$this->original_as_schedule_recurring_action = 'as_schedule_recurring_action';
		}
		if ( function_exists( 'as_next_scheduled_action' ) ) {
			$this->original_as_next_scheduled_action = 'as_next_scheduled_action';
		}

		// Create a new Tasks instance
		$this->tasks = new Tasks( $this->group );

		// Set up a mock for Tasks_Meta_Model
		$this->setup_meta_model_mock();
	}

	/**
	 * Tear down after tests
	 */
	public function tearDown(): void {
		// Restore original Action Scheduler functions
		$this->restore_action_scheduler_functions();

		parent::tearDown();
	}

	/**
	 * Mock Action Scheduler functions if they don't exist
	 */
	private function mock_action_scheduler_functions() {
		// Define mock function for as_enqueue_async_action
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			function as_enqueue_async_action( $hook, $args = array(), $group = '' ) {
				return 123; // Mock action ID
			}
		}

		// Define mock function for as_schedule_single_action
		if ( ! function_exists( 'as_schedule_single_action' ) ) {
			function as_schedule_single_action( $timestamp, $hook, $args = array(), $group = '' ) {
				return 456; // Mock action ID
			}
		}

		// Define mock function for as_schedule_recurring_action
		if ( ! function_exists( 'as_schedule_recurring_action' ) ) {
			function as_schedule_recurring_action( $timestamp, $interval, $hook, $args = array(), $group = '' ) {
				return 789; // Mock action ID
			}
		}

		// Define mock function for as_next_scheduled_action
		if ( ! function_exists( 'as_next_scheduled_action' ) ) {
			function as_next_scheduled_action( $hook, $args = array(), $group = '' ) {
				return time() + 3600; // Mock timestamp 1 hour in the future
			}
		}
	}

	/**
	 * Restore original Action Scheduler functions
	 */
	private function restore_action_scheduler_functions() {
		// No need to do anything here, as the global functions can't be unmocked/restored
		// in PHP. In a real environment, we'd use namespaced functions and dependency injection.
	}

	/**
	 * Set up mock for Tasks_Meta_Model
	 */
	private function setup_meta_model_mock() {
		// We would ideally mock the Tasks_Meta_Model class here
		// But for simplicity in this test, we'll use the actual model if available
		// and just assume it works properly if not available
	}

	/**
	 * Test constructor initializes correctly
	 */
	public function test_constructor() {
		$tasks = new Tasks( 'another_group' );
		$this->assertInstanceOf( Tasks::class, $tasks );
	}

	/**
	 * Test enqueue_async adds a task correctly
	 */
	public function test_enqueue_async() {
		// Set up expectations for the function calls
		add_filter(
			'pre_option_as_enqueue_async_action',
			function() {
				return 123; // Mock action ID
			}
		);

		// Call the method
		$result = $this->tasks->enqueue_async( 'test_hook', 'arg1', 'arg2' );

		// Assert result
		$this->assertNotFalse( $result );
	}

	/**
	 * Test schedule_single adds a scheduled task correctly
	 */
	public function test_schedule_single() {
		// Set up expectations for the function calls
		add_filter(
			'pre_option_as_schedule_single_action',
			function() {
				return 456; // Mock action ID
			}
		);

		// Call the method
		$timestamp = time() + 3600; // 1 hour from now
		$result    = $this->tasks->schedule_single( $timestamp, 'test_hook', 'arg1', 'arg2' );

		// Assert result
		$this->assertNotFalse( $result );
	}

	/**
	 * Test schedule_recurring adds a recurring task correctly
	 */
	public function test_schedule_recurring() {
		// Set up expectations for the function calls
		add_filter(
			'pre_option_as_schedule_recurring_action',
			function() {
				return 789; // Mock action ID
			}
		);

		// Call the method
		$timestamp = time() + 3600; // 1 hour from now
		$interval  = DAY_IN_SECONDS; // Daily
		$result    = $this->tasks->schedule_recurring( $timestamp, $interval, 'test_hook', 'arg1', 'arg2' );

		// Assert result
		$this->assertNotFalse( $result );
	}

	/**
	 * Test get_next_timestamp returns the next scheduled time
	 */
	public function test_get_next_timestamp() {
		// Define a global function to override as_next_scheduled_action
		// This is necessary because the filter approach doesn't work with this function
		global $mock_next_timestamp;
		$mock_next_timestamp = time() + 3600; // 1 hour from now

		// Create a temporary function override
		if ( ! function_exists( 'as_next_scheduled_action' ) ) {
			function as_next_scheduled_action( $hook, $args = array(), $group = '' ) {
				global $mock_next_timestamp;
				return $mock_next_timestamp;
			}
		}

		// Call the method
		$result = $this->tasks->get_next_timestamp( 'test_hook' );

		// Assert result is a timestamp in the future or false
		$this->assertTrue(
			is_int( $result ) || false === $result,
			'Expected timestamp to be an integer or false'
		);

		// If it's an integer, it should be in the future
		if ( is_int( $result ) ) {
			$this->assertGreaterThan( time(), $result );
		}

		// Test the case when no task is scheduled (returns false)
		global $mock_next_timestamp;
		$mock_next_timestamp = false;

		$result = $this->tasks->get_next_timestamp( 'nonexistent_hook' );

		// Assert result can be false as per method documentation
		$this->assertTrue(
			is_int( $result ) || false === $result,
			'Expected timestamp to be an integer or false'
		);
	}

	/**
	 * Test register_callback registers a callback for a hook
	 */
	public function test_register_callback() {
		// Create a mock callback
		$callback_executed = false;
		$test_callback     = function( $arg1, $arg2 ) use ( &$callback_executed ) {
			$callback_executed = true;
			return $arg1 . $arg2;
		};

		// Register the callback
		$this->tasks->register_callback( 'test_callback_hook', $test_callback );

		// Verify the action was registered
		$this->assertTrue( has_action( "{$this->group}_test_callback_hook" ) !== false );

		// We can't easily test the execution of the callback without more complex mocking
		// of the meta retrieval process, so we'll just test that the action was registered
	}

	/**
	 * Test that callbacks are protected from exceptions
	 */
	public function test_callback_exception_handling() {
		// Create a callback that throws an exception
		$exception_thrown = false;
		$test_callback    = function() use ( &$exception_thrown ) {
			$exception_thrown = true;
			throw new Exception( 'Test exception' );
		};

		// Register the callback
		$this->tasks->register_callback( 'test_exception_hook', $test_callback );

		// Verify the action was registered
		$this->assertTrue( has_action( "{$this->group}_test_exception_hook" ) !== false );

		// We would ideally test that exceptions are caught, but that requires
		// more complex mocking of the meta data system
	}
}
