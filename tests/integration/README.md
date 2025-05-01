# QuillBooking Integration Tests

This directory contains integration tests for the QuillBooking WordPress plugin. Integration tests verify that different components of the system work correctly together in a real-world scenario.

## Running Integration Tests

You can run the integration tests using either PHPUnit directly or Composer scripts:

### Using PHPUnit directly:

```bash
# Run all tests (unit and integration)
./vendor/bin/phpunit

# Run only integration testsi
./vendor/bin/phpunit --testsuite integration

# Run a specific integration test file
./vendor/bin/phpunit tests/integration/test-booking-flow.php
```

### Using Composer scripts:

```bash
# Run all tests (unit and integration)
composer test

# Run only unit tests
composer test:unit

# Run only integration tests
composer test:integration

# Run specific integration test files
composer test:booking    # Runs booking flow tests
composer test:payment    # Runs payment processing tests
composer test:api        # Runs API endpoint tests
```

## Creating New Integration Tests

1. Create a new test file in the `tests/integration` directory with a name that starts with `test-` and ends with `.php`
2. Extend the `QuillBooking_Integration_Test_Case` class
3. Implement test methods that test complete workflows, not just isolated components
4. (Optional) Add a composer script for the new test file in composer.json

Example:

```php
<?php
/**
 * Example Integration Test
 *
 * @package QuillBooking\Tests\Integration
 */

class Test_Example_Integration extends QuillBooking_Integration_Test_Case {
    /**
     * Test a complete workflow
     */
    public function test_example_workflow() {
        // Create test data
        $user_id = $this->factory->user->create();
        
        // Test a complete workflow
        $result = $this->some_workflow_method($user_id);
        
        // Verify the outcome
        $this->assertNotWPError($result);
        $this->assertEquals('expected_value', $result['some_key']);
    }
}
```

## Integration Test Structure

Integration tests should test complete workflows that involve multiple components. Focus on testing:

1. End-to-end user flows (booking creation, cancellation, etc.)
2. API endpoint functionality
3. Payment processing workflows
4. Admin functionalities
5. Event management workflows

## Test Data

The integration test environment automatically sets up:

1. Test users (admin, organizer, customer)
2. Test locations
3. Test payment gateway

You can use these in your tests, or create additional test data as needed for specific test cases.

## Mocking External Services

For external services like payment gateways, use the included test implementations instead of making real API calls:

```php
// Example of using the test payment gateway
$result = $this->create_booking_with_payment($user_id, $event_id, 1, [
    'gateway' => 'test_gateway',
    'payment_token' => 'test_success_token', // Will succeed
    // 'payment_token' => 'test_fail_token', // Will fail
]);
``` 