<?php

use phpmock\phpunit\PHPMock;
use QuillBooking\Integration\Accounts;
use QuillBooking\Integration\Integration;

if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
	define( 'MINUTE_IN_SECONDS', 60 );
}

class Test_Integration_Accounts_Integration extends QuillBooking_Integration_Test_Case {
	// Or extend WP_UnitTestCase

	use PHPMock;

	/**
	 * Mock object for the Integration dependency.
	 *
	 * @var Integration|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $integrationMock;

	/**
	 * Mock object for the host object dependency (e.g., WP_Post).
	 * Needs get_meta and update_meta methods.
	 *
	 * @var \PHPUnit\Framework\MockObject\MockObject
	 */
	private $hostMock;

	/**
	 * Instance of the Accounts class under test.
	 *
	 * @var Accounts
	 */
	private $accounts;

	// Namespace where Accounts class calls global functions (like time())
	private const ACCOUNTS_NAMESPACE = 'QuillBooking\Integration';

	public function setUp(): void {
		parent::setUp();

		// 1. Mock the Integration object
		$this->integrationMock = $this->createMock( Integration::class );

		// 2. Mock the Host object
		$this->hostMock = $this->getMockBuilder( \stdClass::class ) // Use stdClass or a specific interface/class
			->addMethods( array( 'get_meta', 'update_meta' ) )
			->getMock();

		// 3. Configure Integration mock properties/methods
		$this->integrationMock->slug     = 'test_integration'; // Example slug
		$this->integrationMock->meta_key = 'test_integration_accounts'; // Example meta key
		// Make the integration mock return the host mock
		$this->integrationMock->host = $this->hostMock;

		// 4. Instantiate the class under test
		$this->accounts = new Accounts( $this->integrationMock );

		// 5. Mock necessary global functions (only time() needed here, mocked per-test for control)
		// Can mock error_log or wp_json_encode here if needed globally using getFunctionMock(...)
		// Example: Mock error_log to do nothing
		// $this->getFunctionMock(self::ACCOUNTS_NAMESPACE, 'error_log');
	}

	protected function tearDown(): void {
		// PHPMock trait handles disabling its mocks
		parent::tearDown();
	}

	// --- Tests for get_accounts() ---

	public function test_get_accounts_calls_get_meta_correctly() {
		$expectedMetaKey  = $this->integrationMock->meta_key;
		$expectedAccounts = array( 'acc1' => array( 'data' => 'value1' ) );

		$this->hostMock->expects( $this->once() )
			->method( 'get_meta' )
			->with( $expectedMetaKey, array() ) // Check key and default value
			->willReturn( $expectedAccounts );

		$result = $this->accounts->get_accounts();

		$this->assertEquals( $expectedAccounts, $result );
	}

	public function test_get_accounts_returns_empty_array_when_no_meta() {
		$expectedMetaKey = $this->integrationMock->meta_key;

		$this->hostMock->expects( $this->once() )
			->method( 'get_meta' )
			->with( $expectedMetaKey, array() )
			->willReturn( array() ); // Simulate meta not found

		$result = $this->accounts->get_accounts();

		$this->assertEquals( array(), $result );
	}


	// --- Tests for get_account() ---

	public function test_get_account_returns_correct_data() {
		$accountId       = 'acc1';
		$accountData     = array(
			'name'  => 'Account One',
			'token' => 'abc',
		);
		$allAccounts     = array(
			$accountId => $accountData,
			'acc2'     => array( 'name' => 'Account Two' ),
		);
		$expectedMetaKey = $this->integrationMock->meta_key;

		// Mock get_meta called by get_accounts()
		$this->hostMock->method( 'get_meta' )
			->with( $expectedMetaKey, array() )
			->willReturn( $allAccounts );

		$result = $this->accounts->get_account( $accountId );

		$this->assertEquals( $accountData, $result );
	}

	public function test_get_account_returns_empty_array_for_nonexistent_id() {
		$accountId       = 'nonexistent';
		$allAccounts     = array( 'acc1' => array( 'name' => 'Account One' ) );
		$expectedMetaKey = $this->integrationMock->meta_key;

		$this->hostMock->method( 'get_meta' )
			->with( $expectedMetaKey, array() )
			->willReturn( $allAccounts );

		$result = $this->accounts->get_account( $accountId );

		$this->assertEquals( array(), $result ); // Expect default empty array
	}


	// --- Tests for add_account() ---

	public function test_add_account_with_numeric_id() {
		$accountId             = 123;
		$newData               = array(
			'name' => 'Numeric Account',
			'key'  => 'xyz',
		);
		$existingAccounts      = array( '456' => array( 'name' => 'Existing' ) );
		$expectedMetaKey       = $this->integrationMock->meta_key;
		$expectedFinalAccounts = $existingAccounts + array( $accountId => $newData ); // Combine

		// Mock get_meta called by get_accounts()
		$this->hostMock->expects( $this->once() )
			->method( 'get_meta' )
			->with( $expectedMetaKey, array() )
			->willReturn( $existingAccounts );

		// Expect update_meta call
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $expectedMetaKey, $expectedFinalAccounts ); // Check key and final combined data

		$resultId = $this->accounts->add_account( $accountId, $newData );

		$this->assertEquals( $accountId, $resultId ); // Check returned ID
	}

	public function test_add_account_with_string_id_generates_numeric_id() {
		$accountIdString  = 'string-acc-id@example.com';
		$newData          = array(
			'name' => 'String Account',
			'key'  => 'abc',
		);
		$existingAccounts = array();
		$expectedMetaKey  = $this->integrationMock->meta_key;
		// Calculate expected numeric ID based on the code's logic
		$expectedNumericId     = abs( crc32( $accountIdString ) );
		$expectedFinalAccounts = array( $expectedNumericId => $newData );

		// Mock get_meta
		$this->hostMock->method( 'get_meta' )->willReturn( $existingAccounts );

		// Expect update_meta call
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $expectedMetaKey, $expectedFinalAccounts );

		$resultId = $this->accounts->add_account( $accountIdString, $newData );

		$this->assertEquals( $expectedNumericId, $resultId ); // Check returned numeric ID
	}


	// --- Tests for update_account() ---

	public function test_update_account_merges_data() {
		$accountId             = 123;
		$existingData          = array(
			'name'   => 'Old Name',
			'token'  => 'old_token',
			'config' => array( 'a' => 1 ),
		);
		$updateData            = array(
			'token'  => 'new_token',
			'config' => array( 'b' => 2 ),
		); // Update token, add new config
		$expectedMergedData    = array(
			'name'   => 'Old Name',
			'token'  => 'new_token',
			'config' => array( 'b' => 2 ),
		); // array_replace replaces entirely
		$existingAccounts      = array(
			'123' => $existingData,
			'456' => array( 'name' => 'Other' ),
		);
		$expectedMetaKey       = $this->integrationMock->meta_key;
		$expectedFinalAccounts = array(
			'123' => $expectedMergedData,
			'456' => array( 'name' => 'Other' ),
		);

		// Mock get_meta (called twice: once by get_accounts, once by get_account within update)
		$this->hostMock->expects( $this->exactly( 2 ) )
			->method( 'get_meta' )
			->with( $expectedMetaKey, array() )
			->willReturn( $existingAccounts );

		// Expect update_meta
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $expectedMetaKey, $expectedFinalAccounts );

		$resultData = $this->accounts->update_account( $accountId, $updateData );

		$this->assertEquals( $expectedMergedData, $resultData ); // Check returned merged data
	}

	public function test_update_account_adds_if_not_exists() {
		$accountId             = 789; // Non-existent
		$updateData            = array(
			'name' => 'New Account',
			'key'  => 'new_key',
		);
		$existingAccounts      = array( '123' => array( 'name' => 'Old' ) );
		$expectedMetaKey       = $this->integrationMock->meta_key;
		$expectedFinalAccounts = $existingAccounts + array( $accountId => $updateData ); // Add new one

		// Mock get_meta (called twice)
		$this->hostMock->expects( $this->exactly( 2 ) )
			->method( 'get_meta' )->willReturn( $existingAccounts );

		// Expect update_meta
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )->with( $expectedMetaKey, $expectedFinalAccounts );

		$resultData = $this->accounts->update_account( $accountId, $updateData );

		$this->assertEquals( $updateData, $resultData );
	}

	// --- Tests for delete_account() ---

	public function test_delete_account_removes_correctly() {
		$accountIdToDelete     = 123;
		$existingAccounts      = array(
			'123' => array( 'name' => 'To Delete' ),
			'456' => array( 'name' => 'To Keep' ),
		);
		$expectedMetaKey       = $this->integrationMock->meta_key;
		$expectedFinalAccounts = array( '456' => array( 'name' => 'To Keep' ) ); // Account 123 removed

		// Mock get_meta
		$this->hostMock->method( 'get_meta' )->willReturn( $existingAccounts );

		// Expect update_meta
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $expectedMetaKey, $expectedFinalAccounts ); // Check data has account removed

		$this->accounts->delete_account( $accountIdToDelete );
		// No return value to check
	}

	public function test_delete_account_nonexistent_id() {
		$accountIdToDelete = 999; // Does not exist
		$existingAccounts  = array( '123' => array( 'name' => 'Existing' ) );
		$expectedMetaKey   = $this->integrationMock->meta_key;

		// Mock get_meta
		$this->hostMock->method( 'get_meta' )->willReturn( $existingAccounts );

		// Expect update_meta to be called with the *original* data (as unset won't change it)
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $expectedMetaKey, $existingAccounts );

		$this->accounts->delete_account( $accountIdToDelete );
	}


	// --- Tests for get_cache_data() ---

	public function test_get_cache_data_cache_hit() {
		$accountId     = 1;
		$cacheKey      = 'my_data';
		$cacheMetaKey  = 'test_integration_cache_1'; // Based on slug and accountId
		$now           = 1700000000;
		$cacheTime     = 5 * MINUTE_IN_SECONDS;
		$cachedData    = array( 'value' => 'cached stuff' );
		$existingCache = array(
			$cacheKey => array(
				'time' => $now - ( $cacheTime / 2 ), // Well within cache time
				'data' => $cachedData,
			),
		);
		$callback      = fn() => $this->fail( 'Callback should not be called on cache hit' ); // Callback that fails test if called

		// Mock time() using PHPMock
		$timeMock = $this->getFunctionMock( self::ACCOUNTS_NAMESPACE, 'time' );
		$timeMock->expects( $this->once() )->willReturn( $now ); // Control current time

		// Mock host->get_meta for cache key
		$this->hostMock->expects( $this->once() )
			->method( 'get_meta' )
			->with( $cacheMetaKey, array() )
			->willReturn( $existingCache );

		// Expect update_meta NOT to be called
		$this->hostMock->expects( $this->never() )->method( 'update_meta' );

		// Execute
		$result = $this->accounts->get_cache_data( $accountId, $cacheKey, $callback, $cacheTime );

		// Assert
		$this->assertEquals( $cachedData, $result );
	}

	public function test_get_cache_data_cache_miss_expired() {
		$accountId           = 1;
		$cacheKey            = 'my_data';
		$cacheMetaKey        = 'test_integration_cache_1';
		$now                 = 1700000000;
		$cacheTime           = 5 * MINUTE_IN_SECONDS;
		$expiredCachedData   = array( 'value' => 'old stuff' );
		$newDataFromCallback = array( 'value' => 'fresh stuff' );
		$existingCache       = array( // Data exists but is too old
			$cacheKey => array(
				'time' => $now - $cacheTime - 10, // Just expired
				'data' => $expiredCachedData,
			),
		);
		$expectedFinalCache  = array(
			$cacheKey => array(
				'time' => $now, // Updated time
				'data' => $newDataFromCallback, // Updated data
			),
		);
		$callbackCalled      = false;
		$callback            = function () use ( $newDataFromCallback, &$callbackCalled ) {
			$callbackCalled = true;
			return $newDataFromCallback;
		};

		// Mock time()
		$timeMock = $this->getFunctionMock( self::ACCOUNTS_NAMESPACE, 'time' );
		$timeMock->expects( $this->exactly( 2 ) )->willReturn( $now ); // Called for check AND for update

		// Mock host->get_meta for cache key (returns expired data)
		$this->hostMock->method( 'get_meta' )->with( $cacheMetaKey, array() )->willReturn( $existingCache );

		// Expect update_meta TO BE called with new data
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $cacheMetaKey, $expectedFinalCache ); // Expect updated cache

		// Execute
		$result = $this->accounts->get_cache_data( $accountId, $cacheKey, $callback, $cacheTime );

		// Assert
		$this->assertTrue( $callbackCalled, 'Callback should have been called' );
		$this->assertEquals( $newDataFromCallback, $result );
	}

	public function test_get_cache_data_cache_miss_key_not_found() {
		$accountId           = 1;
		$cacheKey            = 'my_new_data'; // Key doesn't exist in cache
		$cacheMetaKey        = 'test_integration_cache_1';
		$now                 = 1700000000;
		$newDataFromCallback = array( 'value' => 'generated stuff' );
		$existingCache       = array( // Cache exists but without the key we want
			'other_key' => array(
				'time' => $now - 10,
				'data' => array( 'other' ),
			),
		);
		$expectedFinalCache  = $existingCache + array( // Add the new key/data
			$cacheKey => array(
				'time' => $now,
				'data' => $newDataFromCallback,
			),
		);
		$callbackCalled      = false;
		$callback            = function () use ( $newDataFromCallback, &$callbackCalled ) {
			/* ... sets flag, returns data ... */
			$callbackCalled = true;
			return $newDataFromCallback;
		};

		// Mock time()
		$timeMock = $this->getFunctionMock( self::ACCOUNTS_NAMESPACE, 'time' );
		$timeMock->expects( $this->once() )->willReturn( $now ); // Only called once for update

		// Mock get_meta
		$this->hostMock->method( 'get_meta' )->willReturn( $existingCache );

		// Expect update_meta
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )->with( $cacheMetaKey, $expectedFinalCache );

		// Execute
		$result = $this->accounts->get_cache_data( $accountId, $cacheKey, $callback );

		// Assert
		$this->assertTrue( $callbackCalled, 'Callback should have been called' );
		$this->assertEquals( $newDataFromCallback, $result );
	}

	// --- Tests for delete_cache_data() ---

	public function test_delete_cache_data_removes_key() {
		$accountId          = 1;
		$keyToDelete        = 'to_delete';
		$cacheMetaKey       = 'test_integration_cache_1';
		$existingCache      = array(
			'to_delete' => array(
				'time' => 123,
				'data' => array( 'a' ),
			),
			'to_keep'   => array(
				'time' => 456,
				'data' => array( 'b' ),
			),
		);
		$expectedFinalCache = array( // Key 'to_delete' removed
			'to_keep' => array(
				'time' => 456,
				'data' => array( 'b' ),
			),
		);

		// Mock get_meta
		$this->hostMock->method( 'get_meta' )->with( $cacheMetaKey, array() )->willReturn( $existingCache );

		// Expect update_meta
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )
			->with( $cacheMetaKey, $expectedFinalCache ); // Expect cache without deleted key

		// Execute
		$this->accounts->delete_cache_data( $accountId, $keyToDelete );
	}

	public function test_delete_cache_data_key_not_exists() {
		$accountId     = 1;
		$keyToDelete   = 'nonexistent'; // Key doesn't exist
		$cacheMetaKey  = 'test_integration_cache_1';
		$existingCache = array(
			'to_keep' => array(
				'time' => 456,
				'data' => array( 'b' ),
			),
		);

		// Mock get_meta
		$this->hostMock->method( 'get_meta' )->willReturn( $existingCache );

		// Expect update_meta with the *original* cache (as unset does nothing)
		$this->hostMock->expects( $this->once() )
			->method( 'update_meta' )->with( $cacheMetaKey, $existingCache );

		// Execute
		$this->accounts->delete_cache_data( $accountId, $keyToDelete );
	}
}
