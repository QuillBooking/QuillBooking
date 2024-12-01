<?php
/**
 * Class Events_Model
 *
 * This class is responsible for handling the calendar events model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use Illuminate\Support\Arr;
use QuillBooking\Abstracts\Model;
use Illuminate\Support\Str;
use QuillBooking\Utils;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Event_Fields\Event_Fields;
use QuillBooking\Managers\Fields_Manager;
use QuillBooking\Availabilities;

/**
 * Calendar Events Model class
 */
class Event_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_events';

	/**
	 * Primary key
	 *
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * Timestamps
	 *
	 * @var boolean
	 */
	public $timestamps = true;

	/**
	 * Fillable columns
	 *
	 * @var array
	 */
	protected $fillable = array(
		'hash_id',
		'calendar_id',
		'user_id',
		'name',
		'description',
		'slug',
		'status',
		'type',
		'duration',
		'color',
		'visibility',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'user_id'     => 'integer',
		'calendar_id' => 'integer',
	);

	/**
	 * The attributes that should be appended to the model's array form.
	 *
	 * @var array
	 */
	protected $appends = array( 'fields', 'availability', 'location', 'limits', 'email_notifications', 'additional_settings', 'group_settings', 'event_range' );

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'calendar_id' => 'required|integer',
		'user_id'     => 'integer',
		'name'        => 'required',
		'type'        => 'required',
		'duration'    => 'required',
		'color'       => 'regex:/^#[a-fA-F0-9]{6}$/',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'calendar_id.required'       => 'Calendar ID is required',
		'calendar_id.integer'        => 'Calendar ID must be an integer',
		'calendar_id.exists'         => 'Calendar ID does not exist',
		'user_id.integer'            => 'User ID must be an integer',
		'name.required'              => 'Event name is required',
		'type.required'              => 'Event type is required',
		'duration.required'          => 'Event duration is required',
		'settings.location.required' => 'Event location is required',
		'color.regex'                => 'Color must be a valid hex color',
	);

	/**
	 * Relationship with calendar
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function calendar() {
		return $this->belongsTo( Calendar_Model::class, 'calendar_id', 'id' );
	}

	/**
	 * Relationship with meta
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function meta() {
		return $this->hasMany( Event_Meta_Model::class, 'event_id' );
	}

	/**
	 * Relationship with bookings
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function bookings() {
		return $this->hasMany( Booking_Model::class, 'event_id' );
	}

	/**
	 * Relationship with user
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id' );
	}

	/**
	 * Get the fields meta value.
	 *
	 * @return string|null
	 */
	public function getFieldsAttribute() {
		$value = $this->meta()->where( 'meta_key', 'fields' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Get the availability meta value.
	 *
	 * @return string|null
	 */
	public function getAvailabilityAttribute() {
		$value = $this->meta()->where( 'meta_key', 'availability' )->value( 'meta_value' );
		$value = $value ? maybe_unserialize( $value ) : null;

		if ( is_array( $value ) ) {
			return $value;
		}

		$availability = Availabilities::get_availability( $value );
		return $availability;
	}

	/**
	 * Set the event availability
	 *
	 * @param array $value
	 * @return void
	 */
	public function setAvailabilityAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'availability',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Set the event location
	 *
	 * @param array $location
	 *
	 * @return void
	 */
	public function setLocationAttribute( array $value ) {
		$event_location = $value ?? null;
		if ( ! $event_location ) {
			return;
		}

		if ( ! is_array( $event_location ) ) {
			throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
		}

		foreach ( $event_location as $index => $location ) {
			$location_type = Locations_Manager::instance()->get_location( $location['type'] );
			if ( ! $location_type ) {
				throw new \Exception( __( 'Location does not exist', 'quillbooking' ) );
			}

			$validation = $location_type->validate_fields( $location );
			if ( is_wp_error( $validation ) ) {
				throw new \Exception( $validation->get_error_message() );
			}

			$event_location[ $index ] = $validation;
		}

		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'location',
			)
		);

		$meta->meta_value = maybe_serialize( $event_location );
		$meta->save();
	}

	/**
	 * Get the event location
	 *
	 * @return array
	 */
	public function getLocationAttribute() {
		$value = $this->meta()->where( 'meta_key', 'location' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Get the event limits
	 *
	 * @return array
	 */
	public function getLimitsAttribute() {
		$value = $this->meta()->where( 'meta_key', 'limits' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Set the event limits
	 *
	 * @param array $value
	 * @return void
	 */
	public function setLimitsAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'limits',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Get the event email notifications
	 *
	 * @return array
	 */
	public function getEmailNotificationsAttribute() {
		$value = $this->meta()->where( 'meta_key', 'email_notifications' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Set the event email notifications
	 *
	 * @param array $value
	 * @return void
	 */
	public function setEmailNotificationsAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'email_notifications',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Get the event additional settings
	 *
	 * @return array
	 */
	public function getAdditionalSettingsAttribute() {
		$value = $this->meta()->where( 'meta_key', 'additional_settings' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Set the event additional settings
	 *
	 * @param array $value
	 * @return void
	 */
	public function setAdditionalSettingsAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'additional_settings',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Get the event group settings
	 *
	 * @return array
	 */
	public function getGroupSettingsAttribute() {
		$value = $this->meta()->where( 'meta_key', 'group' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Set the event group settings
	 *
	 * @param array $value
	 * @return void
	 */
	public function setGroupSettingsAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'group',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Get the event range
	 *
	 * @return array
	 */
	public function getEventRangeAttribute() {
		$value   = $this->meta()->where( 'meta_key', 'event_range' )->value( 'meta_value' );
		$default = array(
			'type' => 'days',
			'days' => 60,
		);

		return $value ? maybe_unserialize( $value ) : $default;
	}

	/**
	 * Set the event range
	 *
	 * @param array $value
	 * @return void
	 */
	public function setEventRangeAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'event_range',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Process fields based on event location
	 *
	 * @param array $event_location
	 * @param array $existing_fields
	 *
	 * @return array Processed fields
	 */
	private function processLocationFields( $event_location, $existing_fields = array() ) {
		$fields = array();
		if ( 1 <= count( $event_location ) ) {
			$fields['location-select'] = array(
				'type'     => 'radio',
				'label'    => __( 'Location', 'quillbooking' ),
				'required' => true,
				'group'    => 'system',
				'options'  => array(),
			);
		}

		if ( 1 === count( $event_location ) && isset( $fields['location-select'] ) ) {
			unset( $fields['location-select'] );
		}

		foreach ( $event_location as $location ) {
			$location_type = Locations_Manager::instance()->get_location( $location['type'] );
			if ( ! $location_type ) {
				throw new \Exception( __( 'Location does not exist', 'quillbooking' ) );
			}

			$validation = $location_type->validate_fields( $location );
			if ( is_wp_error( $validation ) ) {
				throw new \Exception( $validation->get_error_message() );
			}

			if ( 1 <= count( $event_location ) ) {
				$fields['location-select']['options'][] = array(
					'label' => $location_type->title,
					'value' => $location['type'],
				);
			}

			$location_fields = $location_type->get_fields();
			if ( ! empty( $location_fields ) ) {
				$location_fields = array_map(
					function ( $field ) use ( $location ) {
						$field['event_location'] = $location['type'];
						$field['hidden']         = isset( $fields['location-select'] );
						return $field;
					},
					$location_fields
				);

				foreach ( $location_fields as $field_key => $location_field ) {
					$existing_field_key = array_search( $field_key, array_column( $existing_fields, 'key' ) );
					if ( $existing_field_key === false ) {
						$fields[ $field_key ] = $location_field;
					} else {
						$fields[ $existing_field_key ] = Arr::add( $existing_fields[ $existing_field_key ], 'hidden', isset( $fields['location-select'] ) );
					}
				}
			}
		}

		return array_merge( $fields, $existing_fields );
	}

	/**
	 * Set fields
	 *
	 * @return void
	 */
	public function setSystemFields() {
		$event_location = $this->location ?? null;

		if ( ! $event_location || ! is_array( $event_location ) ) {
			throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
		}

		$system_fields   = Event_Fields::instance()->get_system_fields();
		$location_fields = $this->processLocationFields( $event_location );

		$fields = array(
			'system'   => $system_fields,
			'location' => $location_fields,
		);

		$this->meta()->create(
			array(
				'meta_key'   => 'fields',
				'meta_value' => maybe_serialize( $fields ),
			)
		);
	}

	/**
	 * Update fields
	 *
	 * @return void
	 */
	public function updateSystemFields() {
		$event_location = $this->settings['location'] ?? null;

		if ( ! $event_location || ! is_array( $event_location ) ) {
			throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
		}

		$fields             = $this->fields ?? array();
		$location_fields    = $this->processLocationFields( $event_location, $this->fields['location'] ?? array() );
		$fields['location'] = $location_fields;

		$this->meta()->updateOrCreate(
			array( 'meta_key' => 'fields' ),
			array( 'meta_value' => maybe_serialize( $fields ) )
		);
	}

	/**
	 * Update fields
	 *
	 * @param array $fields
	 *
	 * @return void
	 */
	public function updateFields( $fields ) {
		foreach ( $fields as $group => $group_fields ) {
			foreach ( $group_fields as $field_key => $field ) {
				$field_type = Fields_Manager::instance()->get_field_type( $field['type'] );
				$field_type = new $field_type();
				if ( $field_type->has_options && ! isset( $field['options'] ) ) {
					throw new \Exception( sprintf( __( 'Options are required for %s field', 'quillbooking' ), $field['label'] ) );
				}

				$fields[ $group ][ $field_key ] = $field;
			}
		}

		$this->meta()->updateOrCreate(
			array( 'meta_key' => 'fields' ),
			array( 'meta_value' => maybe_serialize( $fields ) )
		);
	}

	/**
	 * Get available slots
	 *
	 * @param int    $start_date Start date (Unix timestamp)
	 * @param string $timezone   Timezone
	 * @param int    $duration   Duration of each slot in minutes
	 *
	 * @return array
	 */
	public function get_available_slots( $start_date, $timezone, $duration ) {
		$availability = $this->availability;
		if ( ! $availability ) {
			throw new \Exception( __( 'Availability not set', 'quillbooking' ) );
		}

		$weekly_hours = $availability['weekly_hours'] ?? array();
		if ( empty( $weekly_hours ) ) {
			throw new \Exception( __( 'Weekly hours are not set', 'quillbooking' ) );
		}

		// $lock_timezone = Arr::get( $this->limits, 'timezone_lock.enable', false );
		// if ( $lock_timezone ) {
		// $timezone = Arr::get( $this->limits, 'timezone_lock.timezone', false ) ?? $this->availability['timezone'];
		// }

		// $event_duration = Arr::get( $this->additional_settings, 'duration.allow_attendees_to_select_duration', false );
		// if ( !$event_duration ) {
		// $duration = $this->duration;
		// }
		$start_date = new \DateTime( $start_date );
		$start_date->setTimezone( new \DateTimeZone( $timezone ) );
		$start_date       = $start_date->getTimestamp();
		$event_start_date = $this->get_start_date( $timezone );
		$today            = new \DateTime( 'now' );
		$today->setTimezone( new \DateTimeZone( $timezone ) );
		$current_time = $today->getTimestamp();

		if ( $start_date < $event_start_date ) {
			$start_date = $event_start_date;
		}
		if ( $start_date < $current_time ) {
			$next_slot_time = $current_time;
			$next_slot_time = ceil( $next_slot_time / ( $duration * 60 ) ) * ( $duration * 60 );
			$start_date     = max( $next_slot_time, $start_date );
		}

		// End date should be the last for start date month
		$end_date       = strtotime( 'last day of this month', $start_date );
		$event_end_date = $this->get_end_date( $timezone );
		if ( $start_date > $event_end_date ) {
			throw new \Exception( __( 'Event is not available', 'quillbooking' ) );
		} else {
			$end_date = min( $end_date, $event_end_date );
		}

		$slots = array();

		for ( $current_date = $start_date; $current_date <= $end_date; $current_date = strtotime( '+1 day', $current_date ) ) {
			$day_of_week = strtolower( date( 'l', $current_date ) ); // Get the day of the week (e.g., Monday, Tuesday)

			if ( ! $weekly_hours[ $day_of_week ]['off'] ) {
				foreach ( $weekly_hours[ $day_of_week ]['times'] as $time_block ) {
					$day_start = new \DateTime( date( 'Y-m-d', $current_date ) . ' ' . $time_block['start'], new \DateTimeZone( $this->availability['timezone'] ) );
					$day_end   = new \DateTime( date( 'Y-m-d', $current_date ) . ' ' . $time_block['end'], new \DateTimeZone( $this->availability['timezone'] ) );

					$day_start->setTimezone( new \DateTimeZone( $timezone ) );
					$day_end->setTimezone( new \DateTimeZone( $timezone ) );

					$slots = $this->generate_slots_for_time_block( $day_start, $day_end, $duration, $timezone, $current_date, $slots );
				}
			}
		}

		return apply_filters( 'quillbooking_get_available_slots', $slots, $this, $start_date, $end_date, $timezone );
	}

	/**
	 * Generate slots for a specific time block, considering buffers, minimum notices, and current day adjustments.
	 *
	 * @param \DateTime $day_start Start time of the time block.
	 * @param \DateTime $day_end End time of the time block.
	 * @param int       $duration Slot duration in minutes.
	 * @param string    $timezone User timezone.
	 * @param int       $current_date Unix timestamp of the current day.
	 * @param array     $slots Existing slots to append new slots.
	 * @return array Updated slots with new time block slots.
	 */
	private function generate_slots_for_time_block( $day_start, $day_end, $duration, $timezone, $current_date, $slots ) {
		// Get current time in user timezone
		$current_time = new \DateTime( 'now', new \DateTimeZone( $timezone ) );

		// Calculate minimum notice limit
		$min_notice_limit = clone $current_time;
		$min_notice       = Arr::get( $this->limits, 'general.minimum_notices', 4 );
		$min_notice_unit  = Arr::get( $this->limits, 'general.minimum_notice_unit', 'hours' );
		$min_notice_limit->modify( "+{$min_notice} {$min_notice_unit}" );

		$current_day      = date( 'Y-m-d', $current_date );
		$current_time_day = $current_time->format( 'Y-m-d' );
		// Adjust start time if generating slots for today
		if ( $current_day === $current_time_day ) {
			if ( $current_time > $day_start ) {
				$day_start = clone $current_time; // Start from the current time
			}

			if ( $min_notice_limit >= $day_start ) {
				$day_start = clone $min_notice_limit; // Start from the minimum notice limit
			}
		}

		// Check if time like 10:48:12 go to the next valid slot 11:00:00 depending on the duration
		$day_start->setTime( $day_start->format( 'H' ), ceil( $day_start->format( 'i' ) / $duration ) * $duration, 0 );

		$current_slot_start = clone $day_start;

		while ( $current_slot_start < $day_end ) {
			$slot_start = clone $current_slot_start;
			$slot_end   = clone $slot_start;
			$slot_end->modify( "+{$duration} minutes" );

			if ( $slot_end > $day_end ) {
				break; // End of time block
			}

			// Check availability of the slot
			$availabile_slots = $this->check_available_slots( $slot_start, $slot_end );

			if ( 0 === $availabile_slots ) {
				$current_slot_start->modify( "+{$duration} minutes" );
				error_log( 'No available slots' . $current_slot_start->format( 'Y-m-d H:i:s' ) );
				continue;
			}

			$day             = $current_slot_start->format( 'Y-m-d' );
			$slots[ $day ][] = array(
				'start'     => $slot_start->format( 'Y-m-d H:i:s' ),
				'end'       => $slot_end->format( 'Y-m-d H:i:s' ),
				'remaining' => $availabile_slots,
			);

			$current_slot_start = clone $slot_end;
		}

		return $slots;
	}

	/**
	 * Get the end date of the event
	 *
	 * @param string $timezone Timezone
	 *
	 * @return int
	 */
	public function get_end_date( $timezone ) {
		// Event should end after 60 days from the created date
		$created_date = new \DateTime( $this->created_at, new \DateTimeZone( $this->availability['timezone'] ) );
		$created_date->setTimezone( new \DateTimeZone( $timezone ) );
		$event_date_type = Arr::get( $this->event_range, 'type', 'days' );

		switch ( $event_date_type ) {
			case 'days':
				$end_event_value = Arr::get( $this->event_range, 'days', 60 );
				$created_date->modify( "+{$end_event_value} days" );
				break;
			case 'date_range':
				$end_event_value = Arr::get( $this->event_range, 'end_date', null );
				if ( ! $end_event_value ) {
					throw new \Exception( __( 'End date is required', 'quillbooking' ) );
				}

				$end_event_value = new \DateTime( $end_event_value, new \DateTimeZone( $this->availability['timezone'] ) );
				$end_event_value->setTimezone( new \DateTimeZone( $timezone ) );
				if ( $end_event_value < $created_date ) {
					throw new \Exception( __( 'End date should be after the created date', 'quillbooking' ) );
				}

				$created_date = $end_event_value;
				break;
		}

		$created_date->format( 'Y-m-d' );

		return $created_date->getTimestamp();
	}

	/**
	 * Get event start date
	 *
	 * @param string $timezone Timezone
	 *
	 * @return int
	 */
	public function get_start_date( $timezone ) {
		$event_date_type = Arr::get( $this->event_range, 'type', 'days' );

		// Convert the created_at timestamp to the user's timezone
		$start_date = new \DateTime( $this->created_at, new \DateTimeZone( $this->availability['timezone'] ) );
		$start_date->setTimezone( new \DateTimeZone( $timezone ) ); // Adjust to user timezone
		$start_date = $start_date->getTimestamp(); // Convert to timestamp

		if ( 'date_range' === $event_date_type ) {
			$start_date_value = Arr::get( $this->event_range, 'start_date', null );
			if ( ! $start_date_value ) {
				throw new \Exception( __( 'Start date is required', 'quillbooking' ) );
			}

			$start_date = new \DateTime( $start_date_value, new \DateTimeZone( $this->availability['timezone'] ) );
			$start_date->setTimezone( new \DateTimeZone( $timezone ) ); // Adjust to user timezone
			$start_date = $start_date->getTimestamp();
		}

		return $start_date;
	}

	/**
	 * Check available slots
	 *
	 * @param \DateTime $day_start Start date
	 * @param \DateTime $day_end End date
	 *
	 * @return int
	 */
	public function check_available_slots( $day_start, $day_end ) {
		$day_start = clone $day_start;
		$day_end   = clone $day_end;

		$buffer_before = Arr::get( $this->limits, 'general.buffer_before', 0 );
		$buffer_after  = Arr::get( $this->limits, 'general.buffer_after', 0 );

		$day_start->modify( "-{$buffer_before} minutes" );
		$day_end->modify( "+{$buffer_after} minutes" );

		$day_start->setTimezone( new \DateTimeZone( 'UTC' ) );
		$day_end->setTimezone( new \DateTimeZone( 'UTC' ) );

		$slots_query = Booking_Model::query();

		$event_spots = 1;
		switch ( $this->type ) {
			case 'one-to-one':
			case 'group':
				$slots_query->where( 'calendar_id', $this->calendar_id )
					->where( 'start_time', '>=', $day_start->format( 'Y-m-d H:i:s' ) )
					->where( 'end_time', '<=', $day_end->format( 'Y-m-d H:i:s' ) );
				$event_spots = 'one-to-one' === $this->type ? 1 : Arr::get( $this->group_settings, 'max_invites', 2 );
				break;
			case 'round-robin':
				$team_members = $this->calendar->getTeamMembers();
				$slots_query->whereIn( 'calendar_id', $team_members )
					->where( 'start_time', '>=', $day_start->format( 'Y-m-d H:i:s' ) )
					->where( 'end_time', '<=', $day_end->format( 'Y-m-d H:i:s' ) );
				$event_spots = count( $team_members );
				break;
			case 'collective':
				$team_members = $this->calendar->getTeamMembers();
				$slots_query->whereIn( 'calendar_id', $team_members )
					->where( 'start_time', '>=', $day_start->format( 'Y-m-d H:i:s' ) )
					->where( 'end_time', '<=', $day_end->format( 'Y-m-d H:i:s' ) );
				break;
		}

		$slots = $slots_query->count();

		return $event_spots > $slots ? $event_spots - $slots : 0;
	}

	/**
	 * Is slot available
	 *
	 * @param \DateTime $start_time Start time
	 * @param int       $duration Duration of the slot
	 *
	 * @return int
	 */
	public function get_booking_available_slots( $start_time, $duration ) {
		$end_time = clone $start_time;
		$end_time->modify( "+{$duration} minutes" );

		return $this->is_slot_available( $start_time, $end_time );
	}

	/**
	 * Check slot availability
	 *
	 * @param \DateTime $start_time Start time
	 * @param \DateTime $end_time End time
	 *
	 * @return bool
	 */
	public function is_slot_available( $start_time, $end_time ) {
		$availability = $this->availability;
		$weekly_hours = $availability['weekly_hours'] ?? array();
		$day_of_week  = strtolower( date( 'l', $start_time->getTimestamp() ) ); // Get the day of the week (e.g., Monday, Tuesday)

		if ( ! $weekly_hours[ $day_of_week ]['off'] ) {
			foreach ( $weekly_hours[ $day_of_week ]['times'] as $time_block ) {
				$day_start = new \DateTime( date( 'Y-m-d', $start_time->getTimestamp() ) . ' ' . $time_block['start'], new \DateTimeZone( $this->availability['timezone'] ) );
				$day_end   = new \DateTime( date( 'Y-m-d', $start_time->getTimestamp() ) . ' ' . $time_block['end'], new \DateTimeZone( $this->availability['timezone'] ) );

				if ( $start_time >= $day_start && $end_time <= $day_end ) {
					$slots = $this->check_available_slots( $start_time, $end_time );
					return $slots;
				}
			}
		}

		return 0;
	}

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		// Check if calendar exists
		$calendar = Calendar_Model::find( $this->calendar_id );
		if ( ! $calendar ) {
			throw new \Exception( __( 'Calendar does not exist', 'quillbooking' ) );
		}

		// Check if user is team member
		$user = Team_Model::find( $this->calendar->user_id );
		if ( ! $user->is_team_member() ) {
			throw new \Exception( __( 'User is not a team member', 'quillbooking' ) );
		}

		return parent::save( $options );
	}

	/**
	 * Boot
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $event ) {
				$event->hash_id = Utils::generate_hash_key();
				$originalSlug   = $slug = Str::slug( $event->name );
				$count          = 1;

				while ( static::where( 'slug', $slug )->exists() ) {
					  $slug = $originalSlug . '-' . $count++;
				}

				$event->slug    = $slug;
				$event->user_id = $event->calendar->user_id;

				if ( ! $event->status ) {
					$event->status = 'active';
				}

				if ( ! $event->color ) {
					$event->color = '#ffffff';
				}

				if ( ! $event->visibility ) {
					$event->visibility = 'public';
				}
			}
		);

		static::deleted(
			function ( $event ) {
				$event->meta()->delete();
				$event->bookings()->delete();
			}
		);

		static::updating(
			function ( $event ) {
				$event->updateSystemFields();
			}
		);
	}
}
