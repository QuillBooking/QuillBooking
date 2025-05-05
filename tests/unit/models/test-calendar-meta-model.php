<?php
/**
 * Calendar Meta Model Tests
 *
 * @package QuillBooking\Tests\Unit\Models
 */

use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Calendar_Meta_Model;

/**
 * Class Test_Calendar_Meta_Model
 */
class Test_Calendar_Meta_Model extends QuillBooking_Base_Test_Case {

	/**
	 * Test user ID
	 *
	 * @var int
	 */
	protected $user_id;

	/**
	 * Test calendar ID
	 *
	 * @var int
	 */
	protected $calendar_id;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Clean tables before starting
		global $wpdb;
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}quillbooking_calendars" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}quillbooking_calendars_meta" );

		// Create a test user
		$this->user_id = $this->factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		// Create a test calendar
		$calendar              = new Calendar_Model();
		$calendar->user_id     = $this->user_id;
		$calendar->name        = 'Test Calendar';
		$calendar->description = 'Test Calendar Description';
		$calendar->type        = 'personal';
		$calendar->save();

		$this->calendar_id = $calendar->id;
	}

	/**
	 * Tear down after test
	 */
	public function tearDown(): void {
		// Clear test data
		global $wpdb;
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}quillbooking_calendars" );
		$wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}quillbooking_calendars_meta" );

		parent::tearDown();
	}

	/**
	 * Test meta creation
	 */
	public function test_create_meta() {
		$meta              = new Calendar_Meta_Model();
		$meta->calendar_id = $this->calendar_id;
		$meta->meta_key    = 'test_key';
		$meta->meta_value  = 'test_value';
		$meta->save();

		$this->assertNotEmpty( $meta->id );
		$this->assertEquals( $this->calendar_id, $meta->calendar_id );
		$this->assertEquals( 'test_key', $meta->meta_key );
		$this->assertEquals( 'test_value', $meta->meta_value );
	}

	/**
	 * Test meta retrieval
	 */
	public function test_get_meta() {
		// Create a test meta
		$meta              = new Calendar_Meta_Model();
		$meta->calendar_id = $this->calendar_id;
		$meta->meta_key    = 'test_key';
		$meta->meta_value  = 'test_value';
		$meta->save();

		$saved_id = $meta->id;

		// Retrieve the meta
		$retrieved_meta = Calendar_Meta_Model::find( $saved_id );

		$this->assertNotNull( $retrieved_meta );
		$this->assertEquals( $saved_id, $retrieved_meta->id );
		$this->assertEquals( $this->calendar_id, $retrieved_meta->calendar_id );
		$this->assertEquals( 'test_key', $retrieved_meta->meta_key );
		$this->assertEquals( 'test_value', $retrieved_meta->meta_value );
	}

	/**
	 * Test meta update
	 */
	public function test_update_meta() {
		// Create a test meta
		$meta              = new Calendar_Meta_Model();
		$meta->calendar_id = $this->calendar_id;
		$meta->meta_key    = 'test_key';
		$meta->meta_value  = 'test_value';
		$meta->save();

		$saved_id = $meta->id;

		// Update the meta
		$meta->meta_value = 'updated_value';
		$meta->save();

		// Retrieve the meta again to verify changes
		$updated_meta = Calendar_Meta_Model::find( $saved_id );

		$this->assertEquals( 'updated_value', $updated_meta->meta_value );
	}

	/**
	 * Test meta deletion
	 */
	public function test_delete_meta() {
		// Create a test meta
		$meta              = new Calendar_Meta_Model();
		$meta->calendar_id = $this->calendar_id;
		$meta->meta_key    = 'test_key';
		$meta->meta_value  = 'test_value';
		$meta->save();

		$saved_id = $meta->id;

		// Delete the meta
		$meta->delete();

		// Try to retrieve the deleted meta
		$deleted_meta = Calendar_Meta_Model::find( $saved_id );

		$this->assertNull( $deleted_meta );
	}

	/**
	 * Test retrieving meta via calendar relationship
	 */
	public function test_meta_via_calendar_relationship() {
		// Create multiple meta entries for the calendar
		$meta1              = new Calendar_Meta_Model();
		$meta1->calendar_id = $this->calendar_id;
		$meta1->meta_key    = 'key1';
		$meta1->meta_value  = 'value1';
		$meta1->save();

		$meta2              = new Calendar_Meta_Model();
		$meta2->calendar_id = $this->calendar_id;
		$meta2->meta_key    = 'key2';
		$meta2->meta_value  = 'value2';
		$meta2->save();

		// Retrieve the calendar
		$calendar = Calendar_Model::find( $this->calendar_id );

		// Get meta through relationship
		$meta_collection = $calendar->meta;

		$this->assertNotEmpty( $meta_collection );
		$this->assertEquals( 2, $meta_collection->count() );

		// Check specific meta entries
		$key1_meta = $meta_collection->firstWhere( 'meta_key', 'key1' );
		$key2_meta = $meta_collection->firstWhere( 'meta_key', 'key2' );

		$this->assertNotNull( $key1_meta );
		$this->assertNotNull( $key2_meta );
		$this->assertEquals( 'value1', $key1_meta->meta_value );
		$this->assertEquals( 'value2', $key2_meta->meta_value );
	}

	/**
	 * Test serialized meta values
	 */
	public function test_serialized_meta_values() {
		// Array value to be serialized
		$array_value = array( 'item1', 'item2', 'item3' );

		// Create meta with serialized value
		$meta              = new Calendar_Meta_Model();
		$meta->calendar_id = $this->calendar_id;
		$meta->meta_key    = 'serialized_key';
		$meta->meta_value  = maybe_serialize( $array_value );
		$meta->save();

		// Retrieve the meta
		$retrieved_meta = Calendar_Meta_Model::where( 'calendar_id', $this->calendar_id )
			->where( 'meta_key', 'serialized_key' )
			->first();

		// Unserialize the value
		$unserialized_value = maybe_unserialize( $retrieved_meta->meta_value );

		$this->assertIsArray( $unserialized_value );
		$this->assertEquals( $array_value, $unserialized_value );
		$this->assertContains( 'item2', $unserialized_value );
	}

	/**
	 * Test calendar relationship from meta
	 */
	public function test_calendar_relationship() {
		// Create a test meta
		$meta              = new Calendar_Meta_Model();
		$meta->calendar_id = $this->calendar_id;
		$meta->meta_key    = 'test_key';
		$meta->meta_value  = 'test_value';
		$meta->save();

		// Get the calendar through the relationship
		$calendar = $meta->calendar;

		$this->assertInstanceOf( Calendar_Model::class, $calendar );
		$this->assertEquals( $this->calendar_id, $calendar->id );
		$this->assertEquals( 'Test Calendar', $calendar->name );
	}
}
