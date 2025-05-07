<?php
/**
 * Class Merge_Tags_Manager_Test
 *
 * @package QuillBooking
 * @group managers
 * @group merge-tags
 */

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Managers\Merge_Tags_Manager;
use QuillBooking\Models\Booking_Model;

/**
 * Mock Merge Tag implementation for testing
 */
class MockMergeTag extends Merge_Tag {
	/**
	 * Constructor
	 *
	 * @param string $slug Slug
	 * @param string $name Name
	 * @param string $group Group
	 */
	public function __construct( $slug = 'mock-tag', $name = 'Mock Tag', $group = 'mock-group' ) {
		$this->slug  = $slug;
		$this->name  = $name;
		$this->group = $group;
	}

	/**
	 * Get value
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param array         $options Options.
	 *
	 * @return string
	 */
	public function get_value( Booking_Model $booking, $options = array() ) {
		if ( isset( $options['prefix'] ) ) {
			return $options['prefix'] . 'mock-value';
		}
		return 'mock-value';
	}
}

/**
 * Test for QuillBooking\Managers\Merge_Tags_Manager class
 */
class Merge_Tags_Manager_Test extends QuillBooking_Base_Test_Case {

	/**
	 * Instance of Merge_Tags_Manager
	 *
	 * @var Merge_Tags_Manager
	 */
	private $merge_tags_manager;

	/**
	 * Set up test environment
	 */
	public function setUp(): void {
		parent::setUp();

		// Reset the Merge_Tags_Manager singleton instance
		$reflection        = new ReflectionClass( Merge_Tags_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, null );

		// Get a fresh instance
		$this->merge_tags_manager = Merge_Tags_Manager::instance();
	}

	/**
	 * Test singleton pattern
	 */
	public function test_singleton_pattern() {
		// Get the instance property using reflection
		$reflection        = new ReflectionClass( Merge_Tags_Manager::class );
		$instance_property = $reflection->getProperty( 'instance' );
		$instance_property->setAccessible( true );

		// Get two instances
		$instance1 = Merge_Tags_Manager::instance();
		$instance2 = Merge_Tags_Manager::instance();

		// They should be the same object
		$this->assertSame( $instance1, $instance2, 'Singleton should return the same instance' );

		// Register a merge tag in one instance
		$mock_merge_tag = new MockMergeTag();
		$instance1->register_merge_tag( $mock_merge_tag );

		// Get it from the other instance
		$retrieved_merge_tag = $instance2->get_merge_tag( 'mock-group_mock-tag' );

		// Should be the same merge tag
		$this->assertSame( $mock_merge_tag, $retrieved_merge_tag, 'Merge tag registered in one instance should be available in the other' );
	}

	/**
	 * Test register_merge_tag method
	 */
	public function test_register_merge_tag() {
		$mock_merge_tag = new MockMergeTag();

		// Register the merge tag
		$this->merge_tags_manager->register_merge_tag( $mock_merge_tag );

		// Check that the merge tag was registered (slug gets prefixed with group)
		$registered_merge_tag = $this->merge_tags_manager->get_merge_tag( 'mock-group_mock-tag' );

		$this->assertSame( $mock_merge_tag, $registered_merge_tag, 'The registered merge tag should be retrievable' );

		// Check that the merge tag's slug was modified to include the group
		$this->assertEquals( 'mock-group_mock-tag', $mock_merge_tag->slug, 'The slug should be prefixed with the group' );

		// Check that the group was registered
		$groups = $this->merge_tags_manager->get_groups();
		$this->assertArrayHasKey( 'mock-group', $groups, 'The group should be registered' );
		$this->assertArrayHasKey( 'mergeTags', $groups['mock-group'], 'The group should have mergeTags' );
		$this->assertArrayHasKey( 'mock-tag', $groups['mock-group']['mergeTags'], 'The merge tag should be in the group' );
		$this->assertEquals( 'Mock Tag', $groups['mock-group']['mergeTags']['mock-tag']['name'], 'The merge tag name should be set' );
		$this->assertEquals( '{{mock-group:mock-group_mock-tag}}', $groups['mock-group']['mergeTags']['mock-tag']['value'], 'The merge tag value should be formatted correctly' );
	}

	/**
	 * Test register_merge_tag with invalid object
	 */
	public function test_register_merge_tag_with_invalid_object() {
		$this->expectException( TypeError::class );

		// Create an object that is not a Merge_Tag
		$invalid_object = new stdClass();

		// Attempt to register it, should throw an exception
		$this->merge_tags_manager->register_merge_tag( $invalid_object );
	}

	/**
	 * Test the get_merge_tag method with valid slug
	 */
	public function test_get_merge_tag_with_valid_slug() {
		$mock_merge_tag = new MockMergeTag();

		// Register the merge tag
		$this->merge_tags_manager->register_merge_tag( $mock_merge_tag );

		// Get the merge tag (slug gets prefixed with group)
		$retrieved_merge_tag = $this->merge_tags_manager->get_merge_tag( 'mock-group_mock-tag' );

		$this->assertSame( $mock_merge_tag, $retrieved_merge_tag, 'The merge tag should be retrievable by slug' );
	}

	/**
	 * Test the get_merge_tag method with invalid slug
	 */
	public function test_get_merge_tag_with_invalid_slug() {
		// Try to get a merge tag that doesn't exist
		$merge_tag = $this->merge_tags_manager->get_merge_tag( 'nonexistent-merge-tag' );

		$this->assertNull( $merge_tag, 'Non-existent merge tag should return null' );
	}

	/**
	 * Test the get_merge_tags method
	 */
	public function test_get_merge_tags() {
		// Create multiple mock merge tags
		$merge_tag1 = new MockMergeTag( 'tag-1', 'Tag 1', 'group-1' );
		$merge_tag2 = new MockMergeTag( 'tag-2', 'Tag 2', 'group-2' );
		$merge_tag3 = new MockMergeTag( 'tag-3', 'Tag 3', 'group-1' );

		// Register the merge tags
		$this->merge_tags_manager->register_merge_tag( $merge_tag1 );
		$this->merge_tags_manager->register_merge_tag( $merge_tag2 );
		$this->merge_tags_manager->register_merge_tag( $merge_tag3 );

		// Get all merge tags
		$merge_tags = $this->merge_tags_manager->get_merge_tags();

		// Should have 3 merge tags
		$this->assertCount( 3, $merge_tags, 'Should have 3 registered merge tags' );

		// Check that all merge tags are in the array with their modified slugs
		$this->assertArrayHasKey( 'group-1_tag-1', $merge_tags, 'Merge tag 1 should be in the array with group prefix' );
		$this->assertArrayHasKey( 'group-2_tag-2', $merge_tags, 'Merge tag 2 should be in the array with group prefix' );
		$this->assertArrayHasKey( 'group-1_tag-3', $merge_tags, 'Merge tag 3 should be in the array with group prefix' );

		// Check that the objects are the ones we registered
		$this->assertSame( $merge_tag1, $merge_tags['group-1_tag-1'], 'Merge tag 1 should be the same object' );
		$this->assertSame( $merge_tag2, $merge_tags['group-2_tag-2'], 'Merge tag 2 should be the same object' );
		$this->assertSame( $merge_tag3, $merge_tags['group-1_tag-3'], 'Merge tag 3 should be the same object' );
	}

	/**
	 * Test the get_groups method
	 */
	public function test_get_groups() {
		// Create multiple mock merge tags in different groups
		$merge_tag1 = new MockMergeTag( 'tag-1', 'Tag 1', 'group-1' );
		$merge_tag2 = new MockMergeTag( 'tag-2', 'Tag 2', 'group-2' );
		$merge_tag3 = new MockMergeTag( 'tag-3', 'Tag 3', 'group-1' );

		// Register the merge tags
		$this->merge_tags_manager->register_merge_tag( $merge_tag1 );
		$this->merge_tags_manager->register_merge_tag( $merge_tag2 );
		$this->merge_tags_manager->register_merge_tag( $merge_tag3 );

		// Get the groups
		$groups = $this->merge_tags_manager->get_groups();

		// Should have 2 groups
		$this->assertCount( 2, $groups, 'Should have 2 groups' );

		// Check that both groups are in the array
		$this->assertArrayHasKey( 'group-1', $groups, 'Group 1 should be in the array' );
		$this->assertArrayHasKey( 'group-2', $groups, 'Group 2 should be in the array' );

		// Check that each group has the correct merge tags
		$this->assertCount( 2, $groups['group-1']['mergeTags'], 'Group 1 should have 2 merge tags' );
		$this->assertCount( 1, $groups['group-2']['mergeTags'], 'Group 2 should have 1 merge tag' );

		// Check specific merge tags in each group
		$this->assertArrayHasKey( 'tag-1', $groups['group-1']['mergeTags'], 'Tag 1 should be in group 1' );
		$this->assertArrayHasKey( 'tag-3', $groups['group-1']['mergeTags'], 'Tag 3 should be in group 1' );
		$this->assertArrayHasKey( 'tag-2', $groups['group-2']['mergeTags'], 'Tag 2 should be in group 2' );
	}

	/**
	 * Test process_merge_tags with a valid tag
	 */
	public function test_process_merge_tags_with_valid_tag() {
		// Create a mock merge tag
		$mock_merge_tag = new MockMergeTag();

		// Register the merge tag
		$this->merge_tags_manager->register_merge_tag( $mock_merge_tag );

		// Create a mock booking
		$booking = $this->createMock( Booking_Model::class );

		// Process content with the merge tag
		$content   = 'This is a {{mock-group:mock-tag}} test.';
		$processed = $this->merge_tags_manager->process_merge_tags( $content, $booking );

		// The merge tag should be replaced with its value
		$this->assertEquals( 'This is a mock-value test.', $processed, 'The merge tag should be replaced with its value' );
	}

	/**
	 * Test process_merge_tags with an invalid tag
	 */
	public function test_process_merge_tags_with_invalid_tag() {
		// Create a mock booking
		$booking = $this->createMock( Booking_Model::class );

		// Process content with an invalid merge tag
		$content   = 'This is a {{invalid-group:invalid-tag}} test.';
		$processed = $this->merge_tags_manager->process_merge_tags( $content, $booking );

		// The invalid merge tag should be replaced with an empty string
		$this->assertEquals( 'This is a  test.', $processed, 'Invalid merge tags should be replaced with an empty string' );
	}

	/**
	 * Test process_merge_tags with empty content
	 */
	public function test_process_merge_tags_with_empty_content() {
		// Create a mock booking
		$booking = $this->createMock( Booking_Model::class );

		// Process empty content
		$processed = $this->merge_tags_manager->process_merge_tags( '', $booking );

		// Should return empty string
		$this->assertEquals( '', $processed, 'Empty content should return empty string' );
	}

	/**
	 * Test process_merge_tags with options
	 */
	public function test_process_merge_tags_with_options() {
		// Create a mock merge tag
		$mock_merge_tag = new MockMergeTag();

		// Register the merge tag
		$this->merge_tags_manager->register_merge_tag( $mock_merge_tag );

		// Create a mock booking
		$booking = $this->createMock( Booking_Model::class );

		// Process content with the merge tag and options
		$content   = 'This is a {{mock-group:mock-tag prefix="test-"}} test.';
		$processed = $this->merge_tags_manager->process_merge_tags( $content, $booking );

		// The merge tag should be replaced with its value including the prefix
		$this->assertEquals( 'This is a test-mock-value test.', $processed, 'The merge tag should be replaced with its value including the prefix option' );
	}

	/**
	 * Test process_merge_tags with multiple tags
	 */
	public function test_process_merge_tags_with_multiple_tags() {
		// Create multiple mock merge tags
		$merge_tag1 = new MockMergeTag( 'tag-1', 'Tag 1', 'group-1' );
		$merge_tag2 = new MockMergeTag( 'tag-2', 'Tag 2', 'group-2' );

		// Register the merge tags
		$this->merge_tags_manager->register_merge_tag( $merge_tag1 );
		$this->merge_tags_manager->register_merge_tag( $merge_tag2 );

		// Create a mock booking
		$booking = $this->createMock( Booking_Model::class );

		// Process content with multiple merge tags
		$content   = 'This is {{group-1:tag-1}} a test with {{group-2:tag-2}}.';
		$processed = $this->merge_tags_manager->process_merge_tags( $content, $booking );

		// Both merge tags should be replaced with their values
		$this->assertEquals( 'This is mock-value a test with mock-value.', $processed, 'Multiple merge tags should all be replaced' );
	}
}
