<?php

use QuillBooking\Abstracts\Location;
use QuillBooking\Event_Locations\Attendee_Address;
use QuillBooking\Managers\Fields_Manager;
use QuillBooking\Managers\Locations_Manager;


class AttendeeAddressTest extends QuillBooking_Base_Test_Case
{
    /** @var Attendee_Address */
    private $location;

    /** @var Locations_Manager */
    private $locations_manager;

    /** @var Fields_Manager */
    private $fields_manager;

    public function setUp(): void
    {
        parent::setUp();

        // Initialize mocks
        $this->locations_manager = $this->createMock(Locations_Manager::class);
        $this->fields_manager = $this->createMock(Fields_Manager::class);

        // Create test instance
        $this->location = Attendee_Address::instance();
    }

    public function tearDown(): void
    {
        // Reset singleton instances
        $reflection = new \ReflectionClass(Location::class);
        $instances = $reflection->getProperty('instances');
        $instances->setAccessible(true);
        $instances->setValue([]);

        parent::tearDown();
    }

    public function test_singleton_pattern()
    {
        $instance1 = Attendee_Address::instance();
        $instance2 = Attendee_Address::instance();

        $this->assertInstanceOf(Attendee_Address::class, $instance1);
        $this->assertSame($instance1, $instance2);
    }

    public function test_location_properties()
    {
        $this->assertEquals('Attendee Address', $this->location->title);
        $this->assertEquals('attendee_address', $this->location->slug);
        $this->assertFalse($this->location->is_integration);
    }

    public function test_get_fields()
    {
        $fields = $this->location->get_fields();

        $this->assertIsArray($fields);
        $this->assertArrayHasKey('address', $fields);
        $this->assertEquals([
            'label' => 'Your Address',
            'type' => 'text',
            'required' => true,
            'group' => 'system',
            'placeholder' => 'Enter your address',
            'order' => 4
        ], $fields['address']);
    }

    public function test_get_admin_fields()
    {
        $this->assertEmpty($this->location->get_admin_fields());
    }

    public function test_validate_fields_with_empty_admin_fields()
    {
        $data = ['fields' => ['test' => 'value']];
        $result = $this->location->validate_fields($data);

        $this->assertEquals($data, $result);
    }

    public function test_validate_fields_with_required_field_missing()
    {
        // Create a test double that extends Location with public constructor
        // Specify that we want to mock get_admin_fields
        $location = $this->getMockBuilder(Location::class)
            ->disableOriginalConstructor()
            ->setMethods(['get_admin_fields'])  // Specify method to mock
            ->getMockForAbstractClass();

        // Set required properties
        $reflection = new \ReflectionClass($location);
        $titleProp = $reflection->getProperty('title');
        $titleProp->setAccessible(true);
        $titleProp->setValue($location, 'Test');

        $slugProp = $reflection->getProperty('slug');
        $slugProp->setAccessible(true);
        $slugProp->setValue($location, 'test');

        // Now we can mock the method
        $location->expects($this->any())
            ->method('get_admin_fields')
            ->willReturn([
                'required_field' => [
                    'label' => 'Required Field',
                    'type' => 'text',
                    'required' => true
                ]
            ]);

        $result = $location->validate_fields(['fields' => []]);
        $this->assertInstanceOf(WP_Error::class, $result);
        $this->assertEquals('field_required', $result->get_error_code());
    }
    
    // For test_register_location
    public function test_register_location()
    {
        $locations_manager = $this->createMock(Locations_Manager::class);

        // Set expectations for the locations_manager
        $locations_manager->expects($this->once())
            ->method('register_location')
            ->with($this->isInstanceOf(Location::class));

        // Create an anonymous class that exposes the register method
        $location = new class($locations_manager) extends Location {
            protected $locations_manager;
            public $title = 'Test';
            public $slug = 'test';

            public function __construct($locations_manager)
            {
                $this->locations_manager = $locations_manager;
            }

            public function do_register()
            {
                return $this->register();
            }

            protected function register()
            {
                $this->locations_manager->register_location($this);
                return true;
            }
        };

        $this->assertTrue($location->do_register());
    }
}
