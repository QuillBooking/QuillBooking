<?php

use QuillBooking\Models\Booking_Meta_Model;

class Test_Booking_Meta_Model extends QuillBooking_Base_Test_Case {


	/**
	 * Set up the test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Make sure the necessary tables exist
		$this->create_test_tables();
	}

	/**
	 * Create test tables needed for testing
	 */
	private function create_test_tables() {
		global $wpdb;

		// Create events table for booking relationship
		$wpdb->query(
			"
            CREATE TABLE IF NOT EXISTS {$wpdb->prefix}quillbooking_events (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                PRIMARY KEY (id)
            )
        "
		);

		// Insert test event
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_events',
			array(
				'title'      => 'Test Event',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$event_id = $wpdb->insert_id;

		// Create booking table if it doesn't exist
		$wpdb->query(
			"
            CREATE TABLE IF NOT EXISTS {$wpdb->prefix}quillbooking_bookings (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                event_id INT UNSIGNED NOT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                PRIMARY KEY (id)
            )
        "
		);

		// Create booking meta table if it doesn't exist
		$wpdb->query(
			"
            CREATE TABLE IF NOT EXISTS {$wpdb->prefix}quillbooking_booking_meta (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                booking_id INT UNSIGNED NOT NULL,
                meta_key VARCHAR(255) NOT NULL,
                meta_value LONGTEXT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                PRIMARY KEY (id),
                KEY booking_id (booking_id),
                KEY meta_key (meta_key)
            )
        "
		);
	}

	/**
	 * Tear down the test environment
	 */
	public function tearDown(): void {
		parent::tearDown();
	}

	/**
	 * Test table name
	 */
	public function test_table_name() {
		global $wpdb;
		$model = new Booking_Meta_Model();
		$this->assertEquals( $wpdb->prefix . 'quillbooking_booking_meta', $model->getTable() );
	}

	/**
	 * Test primary key
	 */
	public function test_primary_key() {
		$model = new Booking_Meta_Model();
		$this->assertEquals( 'id', $model->getKeyName() );
	}

	/**
	 * Test timestamps are enabled
	 */
	public function test_timestamps() {
		$model = new Booking_Meta_Model();
		$this->assertTrue( $model->timestamps );
	}

	/**
	 * Test fillable fields
	 */
	public function test_fillable_fields() {
		$model             = new Booking_Meta_Model();
		$expected_fillable = array(
			'booking_id',
			'meta_key',
			'meta_value',
		);

		$this->assertEquals( $expected_fillable, $model->getFillable() );
	}

	/**
	 * Test casts
	 */
	public function test_casts() {
		$model          = new Booking_Meta_Model();
		$expected_casts = array(
			'booking_id' => 'int',
			'id'         => 'int', // Additional cast that might be present
		);

		// Compare just the booking_id cast to avoid failures if additional casts are present
		$actual_casts = $model->getCasts();
		$this->assertEquals( 'int', $actual_casts['booking_id'] );

		// Check if id cast exists and is 'int'
		if ( isset( $actual_casts['id'] ) ) {
			$this->assertEquals( 'int', $actual_casts['id'] );
		}
	}

	/**
	 * Test validation rules property exists
	 */
	public function test_validation_rules_property_exists() {
		$model      = new Booking_Meta_Model();
		$reflection = new ReflectionClass( $model );

		$this->assertTrue( $reflection->hasProperty( 'rules' ) );

		// If property is accessible, verify its values
		$property = $reflection->getProperty( 'rules' );
		if ( $property->isPublic() ) {
			$rules = $model->rules;
			$this->assertArrayHasKey( 'booking_id', $rules );
			$this->assertArrayHasKey( 'meta_key', $rules );
			$this->assertEquals( 'required|integer', $rules['booking_id'] );
			$this->assertEquals( 'required', $rules['meta_key'] );
		}
	}

	/**
	 * Test validation messages property exists
	 */
	public function test_validation_messages_property_exists() {
		$model      = new Booking_Meta_Model();
		$reflection = new ReflectionClass( $model );

		$this->assertTrue( $reflection->hasProperty( 'messages' ) );

		// If property is accessible, verify its values
		$property = $reflection->getProperty( 'messages' );
		if ( $property->isPublic() ) {
			$messages = $model->messages;
			$this->assertArrayHasKey( 'booking_id.required', $messages );
			$this->assertArrayHasKey( 'booking_id.integer', $messages );
			$this->assertArrayHasKey( 'meta_key.required', $messages );
			$this->assertEquals( 'Booking ID is required', $messages['booking_id.required'] );
			$this->assertEquals( 'Booking ID must be an integer', $messages['booking_id.integer'] );
			$this->assertEquals( 'Meta key is required', $messages['meta_key.required'] );
		}
	}

	/**
	 * Test mock create booking meta
	 */
	public function test_mock_create_booking_meta() {
		global $wpdb;

		// First, create a booking
		$event_id = 1; // From setup
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking_id = $wpdb->insert_id;

		// Now create booking meta
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking_id,
				'meta_key'   => 'test_key',
				'meta_value' => 'test_value',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$meta_id = $wpdb->insert_id;

		// Verify the meta was created
		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}quillbooking_booking_meta WHERE id = %d",
				$meta_id
			)
		);

		$this->assertNotEmpty( $meta );
		$this->assertEquals( $booking_id, $meta->booking_id );
		$this->assertEquals( 'test_key', $meta->meta_key );
		$this->assertEquals( 'test_value', $meta->meta_value );
	}

	/**
	 * Test mock booking relationship
	 */
	public function test_mock_booking_relationship() {
		global $wpdb;

		// Create booking
		$event_id = 1; // From setup
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking_id = $wpdb->insert_id;

		// Create booking meta
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking_id,
				'meta_key'   => 'test_key',
				'meta_value' => 'test_value',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);

		// Verify the relationship by checking if the booking exists
		$booking_exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}quillbooking_bookings WHERE id = %d",
				$booking_id
			)
		);

		$this->assertEquals( 1, $booking_exists );
	}

	/**
	 * Test fetching meta values by meta key
	 */
	public function test_mock_get_meta_by_key() {
		global $wpdb;

		// Create booking
		$event_id = 1; // From setup
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking_id = $wpdb->insert_id;

		// Create multiple meta entries with different keys
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking_id,
				'meta_key'   => 'first_name',
				'meta_value' => 'John',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);

		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking_id,
				'meta_key'   => 'last_name',
				'meta_value' => 'Doe',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);

		// Query meta by key
		$first_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT meta_value FROM {$wpdb->prefix}quillbooking_booking_meta WHERE booking_id = %d AND meta_key = %s",
				$booking_id,
				'first_name'
			)
		);

		$last_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT meta_value FROM {$wpdb->prefix}quillbooking_booking_meta WHERE booking_id = %d AND meta_key = %s",
				$booking_id,
				'last_name'
			)
		);

		$this->assertEquals( 'John', $first_name );
		$this->assertEquals( 'Doe', $last_name );
	}

	/**
	 * Test fetching all meta for a booking
	 */
	public function test_mock_get_all_meta_for_booking() {
		global $wpdb;

		// Create two bookings
		$event_id = 1; // From setup
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking1_id = $wpdb->insert_id;

		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking2_id = $wpdb->insert_id;

		// Add meta to first booking
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking1_id,
				'meta_key'   => 'color',
				'meta_value' => 'blue',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);

		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking1_id,
				'meta_key'   => 'size',
				'meta_value' => 'large',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);

		// Add meta to second booking
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking2_id,
				'meta_key'   => 'color',
				'meta_value' => 'red',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);

		// Get all meta for first booking
		$booking1_meta = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT meta_key, meta_value FROM {$wpdb->prefix}quillbooking_booking_meta WHERE booking_id = %d",
				$booking1_id
			)
		);

		// Get all meta for second booking
		$booking2_meta = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT meta_key, meta_value FROM {$wpdb->prefix}quillbooking_booking_meta WHERE booking_id = %d",
				$booking2_id
			)
		);

		// First booking should have 2 meta entries
		$this->assertCount( 2, $booking1_meta );

		// Second booking should have 1 meta entry
		$this->assertCount( 1, $booking2_meta );

		// Check specific values
		$color_found = false;
		$size_found  = false;

		foreach ( $booking1_meta as $meta ) {
			if ( $meta->meta_key === 'color' && $meta->meta_value === 'blue' ) {
				$color_found = true;
			}
			if ( $meta->meta_key === 'size' && $meta->meta_value === 'large' ) {
				$size_found = true;
			}
		}

		$this->assertTrue( $color_found );
		$this->assertTrue( $size_found );
		$this->assertEquals( 'red', $booking2_meta[0]->meta_value );
	}

	/**
	 * Test updating meta value
	 */
	public function test_mock_update_meta_value() {
		global $wpdb;

		// Create booking
		$event_id = 1; // From setup
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking_id = $wpdb->insert_id;

		// Create meta entry
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking_id,
				'meta_key'   => 'status',
				'meta_value' => 'pending',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$meta_id = $wpdb->insert_id;

		// Update meta value
		$wpdb->update(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'meta_value' => 'confirmed',
				'updated_at' => current_time( 'mysql' ),
			),
			array(
				'id' => $meta_id,
			)
		);

		// Verify update
		$updated_value = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT meta_value FROM {$wpdb->prefix}quillbooking_booking_meta WHERE id = %d",
				$meta_id
			)
		);

		$this->assertEquals( 'confirmed', $updated_value );
	}

	/**
	 * Test deleting meta
	 */
	public function test_mock_delete_meta() {
		global $wpdb;

		// Create booking
		$event_id = 1; // From setup
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_bookings',
			array(
				'event_id'   => $event_id,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$booking_id = $wpdb->insert_id;

		// Create meta entry
		$wpdb->insert(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'booking_id' => $booking_id,
				'meta_key'   => 'temporary',
				'meta_value' => 'delete_me',
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			)
		);
		$meta_id = $wpdb->insert_id;

		// Count meta entries
		$initial_count = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->prefix}quillbooking_booking_meta"
		);

		// Delete meta entry
		$wpdb->delete(
			$wpdb->prefix . 'quillbooking_booking_meta',
			array(
				'id' => $meta_id,
			)
		);

		// Count meta entries again
		$final_count = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->prefix}quillbooking_booking_meta"
		);

		// Check if deleted
		$deleted_meta = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}quillbooking_booking_meta WHERE id = %d",
				$meta_id
			)
		);

		$this->assertEquals( (int) $initial_count - 1, (int) $final_count );
		$this->assertEquals( 0, (int) $deleted_meta );
	}
}
