<?php

/**
 * Base Model class that implements common functionality
 */
abstract class FakeBaseModel {


	protected $attributes      = array();
	protected $whereConditions = array();

	public function __construct( array $attributes = array() ) {
		$this->fill( $attributes );
	}

	public function __get( $key ) {
		return $this->attributes[ $key ] ?? null;
	}

	public function __set( $key, $value ) {
		$this->attributes[ $key ] = $value;
	}

	public function fill( array $attributes ) {
		foreach ( $attributes as $key => $value ) {
			$this->attributes[ $key ] = $value;
		}
		return $this;
	}

	public static function where( $column, $value ) {
		$instance                             = new static();
		$instance->whereConditions[ $column ] = $value;
		return $instance;
	}

	public function first() {
		// Check if this instance matches its own where conditions
		foreach ( $this->whereConditions as $column => $value ) {
			if ( $this->$column != $value ) {
				return null; // Simulate no match found
			}
		}
		return $this; // Return self if all conditions match
	}

	public function toArray() {
		return $this->attributes;
	}

	public function update( array $data ) {
		return $this->fill( $data );
	}

	public function save() {
		return true;
	}
}

/**
 * Booking Model
 */
/**
 * Booking Model
 */
class FakeBookingModel extends FakeBaseModel {

	public $id;
	public $status;
	public $hash_id;
	public $event;
	public $logs;

	private static $instances = array();

	public function __construct( array $attributes = array() ) {
		$this->id         = $attributes['id'] ?? null;
		$this->status     = $attributes['status'] ?? 'pending';
		$this->start_date = $attributes['start_date'] ?? '2023-10-01 10:00:00';
		$this->start_time = $attributes['start_time'] ?? '10:00';
		$this->guest      = $attributes['guest'] ?? new stdClass();
		$this->calendar   = $attributes['calendar'] ?? new FakeCalendarModel();
		$this->duration   = $attributes['duration'] ?? 60;
		$this->hash_id    = $attributes['hash_id'] ?? null;
		$this->event      = $attributes['event'] ?? new FakeEventModel();
		$this->logs       = $attributes['logs'] ?? array();

		parent::__construct( $attributes );

		if ( $this->id ) {
			self::$instances[ $this->id ] = $this;
		}
	}

	public static function getByHashId( $hash_id ) {
		foreach ( self::$instances as $instance ) {
			if ( $instance->id == $hash_id || $instance->hash_id == $hash_id ) {
				return $instance;
			}
		}
		return null;
	}

	public function isCompleted() {
		return $this->status === 'completed';
	}

	public function isCancelled() {
		return $this->status === 'cancelled';
	}

	public function update( $data ) {
		foreach ( $data as $key => $value ) {
			$this->$key               = $value;
			$this->attributes[ $key ] = $value;
		}

		if ( $this->id ) {
			self::$instances[ $this->id ] = $this;
		}

		return true;
	}

	public function save() {
		if ( $this->id ) {
			self::$instances[ $this->id ] = $this;
		}
		return true;
	}

	public function logs() {
		return new class($this) {
			private $booking;

			public function __construct( $booking ) {
				$this->booking = $booking;
			}

			public function create( $data ) {
				// Add log data to the logs array
				$this->booking->logs[] = $data;
				return true;
			}
		};
	}

	public function resetLogs() {
		$this->logs = array();
		return true;
	}
}



/**
 * Calendar Model
 */
class FakeCalendarModel extends FakeBaseModel {


	public function __construct( array $attributes = array() ) {
		$this->id   = $attributes['id'] ?? 1;
		$this->slug = $attributes['slug'] ?? 'test-calendar';
		$this->name = $attributes['name'] ?? 'Test Calendar';
		$this->user = $attributes['user'] ?? new stdClass();

		parent::__construct( $attributes );

	}
}

/**
 * Event Model
 */
class FakeEventModel extends FakeBaseModel {


	public static $instances          = array();
	public static $mockAvailableSlots = 1;

	public $payments_settings = array( 'enabled' => true );
	public $id;
	public $hash_id;

	public function __construct( array $attributes = array() ) {
		$this->id                = $attributes['id'] ?? null;
		$this->slug              = $attributes['slug'] ?? 'test-event';
		$this->calendar_id       = $attributes['calendar_id'] ?? 1;
		$this->payments_settings = $attributes['payments_settings'] ?? array( 'enabled' => true );
		$this->hash_id           = $attributes['hash_id'] ?? 'test-event-hash';

		parent::__construct( $attributes );

		if ( $this->id ) {
			self::$instances[ $this->id ] = $this;
		}
	}

	public function requirePayment() {
		return $this->payments_settings['enabled'] ?? false;
	}

	public function get_booking_available_slots( $start_date, $duration, $timezone ) {
		return self::$mockAvailableSlots;
	}

	public function get_available_slots( $start_date, $timezone, $duration, $calendar_id ) {
		return 1;
	}


	public static function find( $id ) {
		foreach ( self::$instances as $instance ) {
			if ( $instance->id == $id || $instance->hash_id == $id ) {
				return $instance;
			}
		}

		return null;
	}


	public static function getByHashId( $hash_id ) {

		if ( isset( self::$instances[ $hash_id ] ) ) {
			return self::$instances[ $hash_id ];
		}

		throw new \Exception( 'Invalid event' );
	}
}


// Mock class for BookingService
class FakeBookingService {


	public function book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $invitee, $location ) {
		// Mock implementation
		return new FakeBookingModel();
	}

	public function validate_invitee( $event, $invitee ) {
		// Mock implementation
		return $invitee;
	}
}
