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
use WPEloquent\Eloquent\Model;
use Illuminate\Support\Str;
use QuillBooking\Utils;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Event_Fields\Event_Fields;
use QuillBooking\Managers\Fields_Manager;
use QuillBooking\Availabilities;
use QuillBooking\Managers\Integrations_Manager;
use QuillBooking\Payment_Gateway\Payment_Validator;

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
		'is_disabled',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'user_id'     => 'integer',
		'calendar_id' => 'integer',
		'is_disabled' => 'boolean',
		'reserve'     => 'boolean',
	);

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
	 * Appends
	 *
	 * @var array
	 */
	protected $appends = array(
		'dynamic_duration',
		'location',
		'additional_settings',
		'booking_count',
		'connected_integrations',
		'price',
		'payments_settings',
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
		return $this->get_meta( 'fields' );
	}

	/**
	 * Get the availability meta value.
	 *
	 * @return string|null
	 */
	public function getAvailabilityAttribute() {
		$value = $this->get_meta( 'availability' );

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
		$this->update_meta( 'availability', $value );
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

		$this->update_meta( 'location', $event_location );
	}

	/**
	 * Get the event location
	 *
	 * @return array
	 */
	public function getLocationAttribute() {
		return $this->get_meta( 'location', array() );
	}

	/**
	 * Set the event limits
	 *
	 * @param array $value
	 * @return void
	 */
	public function setLimitsAttribute( $value ) {
		$this->update_meta( 'limits', $value );
	}

	/**
	 * Get the event limits
	 *
	 * @return array
	 */
	public function getLimitsAttribute() {
		return $this->get_meta( 'limits', array() );
	}

	/**
	 * Set the event reserve times
	 *
	 * @param array $value
	 * @return void
	 */
	public function setReserveTimesAttribute( $value ) {
		$this->update_meta( 'reserve_times', $value );
	}


	/**
	 * Get the event reserve times
	 *
	 * @return array
	 */
	public function getReserveTimesAttribute() {
		return $this->get_meta( 'reserve_times', array() );
	}


	/**
	 * Get the event team members
	 *
	 * @return array
	 */
	public function getTeamMembersAttribute() {
		return $this->get_meta( 'team_members', array() );
	}

	/**
	 * Set the event team members
	 *
	 * @param array $value
	 * @return void
	 */
	public function setTeamMembersAttribute( $value ) {
		$this->update_meta( 'team_members', $value );
	}


	/**
	 * Get the event email notifications
	 *
	 * @return array
	 */
	public function getEmailNotificationsAttribute() {
		return $this->get_meta( 'email_notifications', array() );
	}

	/**
	 * Set the event email notifications
	 *
	 * @param array $value
	 * @return void
	 */
	public function setEmailNotificationsAttribute( $value ) {
		$this->update_meta( 'email_notifications', $value );
	}

	/**
	 * Get the event SMS notifications
	 *
	 * @return array
	 */
	public function getSmsNotificationsAttribute() {
		return $this->get_meta( 'sms_notifications', array() );
	}

	/**
	 * Set the event SMS notifications
	 *
	 * @param array $value
	 * @return void
	 */
	public function setSmsNotificationsAttribute( $value ) {
		$this->update_meta( 'sms_notifications', $value );
	}

	/**
	 * Get the event additional settings
	 *
	 * @return array
	 */
	public function getAdditionalSettingsAttribute() {
		return $this->get_meta( 'additional_settings', array() );
	}

	/**
	 * Set the event additional settings
	 *
	 * @param array $value
	 * @return void
	 */
	public function setAdditionalSettingsAttribute( $value ) {
		$this->update_meta( 'additional_settings', $value );
	}

	/**
	 * Get the event group settings
	 *
	 * @return array
	 */
	public function getGroupSettingsAttribute() {
		return $this->get_meta( 'group', array() );
	}

	/**
	 * Set the event group settings
	 *
	 * @param array $value
	 * @return void
	 */
	public function setGroupSettingsAttribute( $value ) {
		$this->update_meta( 'group', $value );
	}

	/**
	 * Get the event range
	 *
	 * @return array
	 */
	public function getEventRangeAttribute() {
		return $this->get_meta( 'event_range', array() );
	}

	/**
	 * Set the event range
	 *
	 * @param array $value
	 * @return void
	 */
	public function setEventRangeAttribute( $value ) {
		$this->update_meta( 'event_range', $value );
	}

	/**
	 * Get the event advanced settings
	 *
	 * @return array
	 */
	public function getAdvancedSettingsAttribute() {
		return $this->get_meta( 'advanced_settings', array() );
	}

	/**
	 * Set the event advanced settings
	 *
	 * @param array $value
	 * @return void
	 */
	public function setAdvancedSettingsAttribute( $value ) {
		$this->update_meta( 'advanced_settings', $value );
	}

	/**
	 * Get the event payments settings
	 *
	 * @return array
	 */
	public function getPaymentsSettingsAttribute() {
		return $this->get_meta( 'payments_settings', array() );
	}

	/**
	 * Set the event payments settings
	 *
	 * @param array $value
	 * @return void
	 */
	public function setPaymentsSettingsAttribute( $value ) {
		$this->update_meta( 'payments_settings', $value );
	}

	/**
	 * Get the event webhook feeds
	 *
	 * @return array
	 */
	public function getWebhookFeedsAttribute() {
		return $this->get_meta( 'webhook_feeds', array() );
	}

	/**
	 * Set the event webhook feeds
	 *
	 * @param array $value
	 * @return void
	 */
	public function setWebhookFeedsAttribute( $value ) {
		$this->update_meta( 'webhook_feeds', $value );
	}

	/**
	 * Get dynamic duration
	 *
	 * @return bool
	 */
	public function getDynamicDurationAttribute() {
		return $this->get_meta( 'dynamic_duration', false );
	}

	/**
	 * Set dynamic duration
	 *
	 * @param bool $value
	 * @return void
	 */
	public function setDynamicDurationAttribute( $value ) {
		$this->update_meta( 'dynamic_duration', $value );
	}

	/**
	 * Get booking count
	 *
	 * @return int
	 */
	public function getBookingCountAttribute() {
		return $this->bookings()
			->where( 'status', '!=', 'cancelled' )
			->count();
	}

	/**
	 * Get Price attribute
	 *
	 * @return float
	 */
	public function getPriceAttribute() {
		$payments_enabled = $this->requirePayment();
		if ( ! $payments_enabled ) {
			return 0;
		}

		$items = $this->getItems();
		if ( empty( $items ) ) {
			return 0;
		}

		$total_price    = 0;
		$multi_duration = Arr::get( $this->additional_settings, 'allow_attendees_to_select_duration', false );
		if ( $multi_duration ) {
			$total_price = Arr::get( $this->payments, 'multi_duration_items.0.price', 0 );
		} else {
			foreach ( $items as $item ) {
				$total_price += $item['price'];
			}
		}

		return $total_price;
	}

	/**
	 * Get Connected Integrations
	 *
	 * @return array
	 */
	public function getConnectedIntegrationsAttribute() {
		$connected_integrations = array();
		$integrations           = Integrations_Manager::instance()->get_integrations();

		$calendar_ids = array( $this->calendar_id );
		if ( in_array( $this->type, array( 'round-robin', 'collective' ) ) ) {
			$team_members = $this->calendar->getTeamMembers();
			$calendar_ids = $team_members;
		}

		foreach ( $integrations as $integration_class ) {
			/** @var \QuillBooking\Abstracts\Integration $integration */
			$integration   = new $integration_class();
			$all_connected = true;

			foreach ( $calendar_ids as $calendar_id ) {
				$integration->set_host( $calendar_id );
				$accounts = $integration->accounts->get_accounts();

				if ( empty( $accounts ) ) {
					$all_connected = false;
					break;
				}
			}

			$connected_integrations[ $integration->slug ] = array(
				'name'      => $integration->name,
				'connected' => $all_connected,
			);
		}

		return $connected_integrations;
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

			if ( 1 < count( $event_location ) ) {
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
		$other_fields    = Event_Fields::instance()->get_other_fields();
		$location_fields = $this->processLocationFields( $event_location );
		$fields          = array(
			'system'   => $system_fields,
			'location' => $location_fields,
			'other'    => $other_fields,
		);

		$this->update_meta( 'fields', $fields );
	}

	/**
	 * Update fields
	 *
	 * @return void
	 */
	public function updateSystemFields() {
		$event_location = $this->location ?? null;

		if ( ! $event_location || ! is_array( $event_location ) ) {
			throw new \Exception( __( 'Invalid location', 'quillbooking' ) );
		}

		$fields             = $this->fields ?? array();
		$location_fields    = $this->processLocationFields( $event_location, $this->fields['location'] ?? array() );
		$fields['location'] = $location_fields;

		$this->update_meta( 'fields', $fields );
	}

	/**
	 * Update fields
	 *
	 * @param array $fields
	 *
	 * @return void
	 */
	public function updateFields( $fields ) {
		$current_fields = $this->fields ?? array();

		foreach ( $fields as $group => $group_fields ) {
			foreach ( $group_fields as $field_key => $field ) {
				if ( in_array( $group, array( 'system', 'location' ), true ) ) {
					// Keep existing fields and update only label, helper_text, and placeholder
					if ( isset( $current_fields[ $group ][ $field_key ] ) ) {
						$current_fields[ $group ][ $field_key ] = array_merge(
							$current_fields[ $group ][ $field_key ],
							array_intersect_key(
								$field,
								array_flip( array( 'label', 'helper_text', 'placeholder', 'hidden' ) )
							)
						);
					}
				} else {
					$field_type = Fields_Manager::instance()->get_item( $field['type'] );
					$field_type = new $field_type();

					if ( $field_type->has_options && ! isset( $field['settings']['options'] ) ) {
						throw new \Exception( sprintf( __( 'Options are required for %s field', 'quillbooking' ), $field['label'] ) );
					}

					$current_fields[ $group ][ $field_key ] = $field;
				}
			}
		}

		$this->update_meta( 'fields', $current_fields );
	}

	/**
	 * Get meta value
	 *
	 * @param string $key Meta key.
	 * @param mixed  $default Default value.
	 *
	 * @return mixed
	 */
	public function get_meta( $key, $default = null ) {
		$meta = $this->meta()->where( 'meta_key', $key )->first();
		$meta = $meta ? maybe_unserialize( $meta->meta_value ) : $default;

		return $meta;
	}

	/**
	 * Update meta value
	 *
	 * @param string $key Meta key.
	 * @param mixed  $value Meta value.
	 *
	 * @return void
	 */
	public function update_meta( $key, $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => $key,
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Duplicate event
	 *
	 * @return Event_Model
	 */
	public function duplicate() {
		$event          = $this->replicate();
		$event->name    = $event->name . ' - ' . __( 'Copy', 'quillbooking' );
		$event->hash_id = Str::random( 32 );
		$event->save();

		$meta = $this->meta()->get();
		foreach ( $meta as $meta_item ) {
			$event->meta()->create(
				array(
					'meta_key'   => $meta_item->meta_key,
					'meta_value' => $meta_item->meta_value,
				)
			);
		}

		return $event;
	}

	/**
	 * Check if reached minimum notice
	 *
	 * @param string $start_date Booking start date
	 *
	 * @return bool
	 */
	public function requireConfirmation( $start_date ) {
		$require_confirmation = Arr::get( $this->advanced_settings, 'require_confirmation', false );
		if ( ! $require_confirmation ) {
			return false;
		}

		$confirmation_time = Arr::get( $this->advanced_settings, 'confirmation_time', 'always' );
		if ( 'always' === $confirmation_time ) {
			return true;
		}

		$confirmation_time_value = Arr::get( $this->advanced_settings, 'confirmation_time_value', 20 );
		$confirmation_time_unit  = Arr::get( $this->advanced_settings, 'confirmation_time_unit', 'minutes' );

		$start_date = new \DateTime( $start_date, new \DateTimeZone( 'UTC' ) );
		$now        = new \DateTime( 'now', new \DateTimeZone( 'UTC' ) );

		if ( 'hours' === $confirmation_time_unit ) {
			$confirmation_time_value *= 60;
		}

		return $start_date->getTimestamp() - $now->getTimestamp() >= $confirmation_time_value;
	}

	/**
	 * Require payment
	 *
	 * @return bool
	 * @throws \Exception If payments are enabled but no gateway is selected.
	 */
	public function requirePayment() {
		$payments_settings = $this->payments_settings;
		if ( ! $payments_settings ) {
			return false;
		}

		$enabled = Arr::get( $payments_settings, 'enable_payment', false );
		if ( ! $enabled ) {
			return false;
		}

		$items = Arr::get( $payments_settings, 'items', array() );
		if ( empty( $items ) ) {
			return false;
		}

		// Validate payment gateway selection
		$validation_result = Payment_Validator::validate_payment_gateways( $payments_settings );
		if ( is_wp_error( $validation_result ) ) {
			throw new \Exception( $validation_result->get_error_message() );
		}

		return true;
	}

	/**
	 * Get total price
	 *
	 * @return float
	 */
	public function getTotalPrice() {
		$payments_settings = $this->payments_settings;
		if ( ! $payments_settings ) {
			return 0;
		}

		$items = Arr::get( $payments_settings, 'items', array() );
		if ( empty( $items ) ) {
			return 0;
		}

		$total_price = 0;
		foreach ( $items as $item ) {
			$total_price += $item['price'];
		}

		return $total_price;
	}

	/**
	 * Get items
	 *
	 * @return array
	 */
	public function getItems() {
		$payments_settings = $this->payments_settings;
		if ( ! $payments_settings ) {
			return array();
		}

		$items = Arr::get( $payments_settings, 'items', array() );
		if ( empty( $items ) ) {
			return array();
		}

		return $items;
	}

	/**
	 * Fetch available slots based on provided parameters.
	 *
	 * @param int    $start_date Start date (Unix timestamp).
	 * @param string $timezone   Timezone.
	 * @param int    $duration   Duration of each slot in minutes.
	 * @return array List of available slots.
	 */
	public function get_available_slots( $start_date, $timezone, $duration, $calendar_id ) {
		$this->validate_availability();
		$this->apply_frequency_limits( $start_date );
		$this->apply_duration_limits( $start_date );

		$start_date = $this->adjust_start_date( $start_date, $timezone, $duration );
		$end_date   = $this->calculate_end_date( $start_date, $timezone );

		$slots = $this->generate_daily_slots( $start_date, $end_date, $timezone, $duration, $calendar_id );

		return apply_filters( 'quillbooking_get_available_slots', $slots, $this, $start_date, $end_date, $timezone );
	}

	/**
	 * Validate availability data and weekly hours.
	 */
	private function validate_availability() {
		$availability = $this->availability;
		if ( ! $availability ) {
			throw new \Exception( __( 'Availability not set', 'quillbooking' ) );
		}

		$weekly_hours = $availability['weekly_hours'] ?? array();
		if ( empty( $weekly_hours ) ) {
			throw new \Exception( __( 'Weekly hours are not set', 'quillbooking' ) );
		}
	}

	/**
	 * Apply frequency limits to ensure booking constraints are respected.
	 *
	 * @param int $start_date Start date timestamp.
	 */
	private function apply_frequency_limits( $start_date ) {
		if ( ! Arr::get( $this->limits, 'frequency.enable', false ) ) {
			return;
		}

		$frequency_limit      = Arr::get( $this->limits, 'frequency.limit', 5 );
		$frequency_unit       = Arr::get( $this->limits, 'frequency.unit', 'days' );
		$frequency_start_time = strtotime( 'midnight', $start_date );
		$frequency_end_time   = strtotime( 'tomorrow', $frequency_start_time ) - 1;

		$this->validate_limit( $frequency_limit, $frequency_unit, $frequency_start_time, $frequency_end_time, 'Event reached the frequency limit' );
	}

	/**
	 * Apply duration limits to ensure total booking time is within allowed constraints.
	 *
	 * @param int $start_date Start date timestamp.
	 */
	private function apply_duration_limits( $start_date ) {
		if ( ! Arr::get( $this->limits, 'duration.enable', false ) ) {
			return;
		}

		$duration_limit      = Arr::get( $this->limits, 'duration.limit', 60 );
		$duration_unit       = Arr::get( $this->limits, 'duration.unit', 'days' );
		$duration_start_time = strtotime( 'midnight', $start_date );
		$duration_end_time   = strtotime( 'tomorrow', $duration_start_time ) - 1;

		$this->validate_limit( $duration_limit, $duration_unit, $duration_start_time, $duration_end_time, 'Event reached the duration limit', true );
	}

	/**
	 * Validate booking limits (frequency or duration).
	 *
	 * @param int    $limit      Limit value.
	 * @param string $unit       Unit of the limit (days, weeks, months).
	 * @param int    $start_time Start timestamp.
	 * @param int    $end_time   End timestamp.
	 * @param string $message    Error message to display if the limit is exceeded.
	 * @param bool   $sum        Whether to sum bookings (for duration limits).
	 */
	private function validate_limit( $limit, $unit, $start_time, $end_time, $message, $sum = false ) {
		$unit_multiplier = array(
			'weeks'  => 7,
			'months' => 30,
		);
		$limit          *= $unit_multiplier[ $unit ] ?? 1;

		$query = Booking_Model::where( 'event_id', $this->id )
			->where( 'start_date', '>=', $start_time )
			->where( 'start_date', '<=', $end_time )
			->whereNot( 'status', 'cancelled' );

		$result = $sum ? $query->sum( 'duration' ) : $query->count();

		if ( $result >= $limit ) {
			throw new \Exception( __( $message, 'quillbooking' ) );
		}
	}

	/**
	 * Adjust start date based on event and current date.
	 *
	 * @param int    $start_date Start date timestamp.
	 * @param string $timezone   Timezone.
	 * @param int    $duration   Slot duration in minutes.
	 * @return int Adjusted start date timestamp.
	 */
	private function adjust_start_date( $start_date, $timezone, $duration ) {
		$start_date       = new \DateTime( $start_date, new \DateTimeZone( $timezone ) );
		$event_start_date = $this->get_start_date( $timezone );
		$current_time     = ( new \DateTime( 'now', new \DateTimeZone( $timezone ) ) )->getTimestamp();

		$start_date = max( $event_start_date, $start_date->getTimestamp(), $current_time );

		return ceil( $start_date / ( $duration * 60 ) ) * ( $duration * 60 );
	}

	/**
	 * Calculate the end date for the event.
	 *
	 * @param int    $start_date Start date timestamp.
	 * @param string $timezone   Timezone.
	 * @return int End date timestamp.
	 */
	private function calculate_end_date( $start_date, $timezone ) {
		$event_end_date = $this->get_end_date( $timezone );

		if ( $start_date > $event_end_date ) {
			throw new \Exception( __( 'Event is not available', 'quillbooking' ) );
		}

		return min( strtotime( 'last day of this month', $start_date ), $event_end_date );
	}

	/**
	 * Generate slots for each day within the given range.
	 *
	 * @param int    $start_date Start date timestamp.
	 * @param int    $end_date   End date timestamp.
	 * @param string $timezone   Timezone.
	 * @param int    $duration   Slot duration in minutes.
	 * @return array Generated slots.
	 */
	private function generate_daily_slots( $start_date, $end_date, $timezone, $duration, $calendar_id ) {
		$slots = array();

		for ( $current_date = $start_date; $current_date <= $end_date; $current_date = strtotime( '+1 day', $current_date ) ) {
			$day_of_week = strtolower( date( 'l', $current_date ) );

			if ( empty( $this->availability['weekly_hours'][ $day_of_week ]['off'] ) ) {
				foreach ( $this->availability['weekly_hours'][ $day_of_week ]['times'] as $time_block ) {
					$day_start = new \DateTime( date( 'Y-m-d', $current_date ) . ' ' . $time_block['start'], new \DateTimeZone( $this->availability['timezone'] ) );
					$day_end   = new \DateTime( date( 'Y-m-d', $current_date ) . ' ' . $time_block['end'], new \DateTimeZone( $this->availability['timezone'] ) );

					$day_start->setTimezone( new \DateTimeZone( $timezone ) );
					$day_end->setTimezone( new \DateTimeZone( $timezone ) );

					$slots = $this->generate_slots_for_time_block( $day_start, $day_end, $duration, $timezone, $current_date, $slots, $calendar_id );
				}
			}
		}

		return $slots;
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
	private function generate_slots_for_time_block( $day_start, $day_end, $duration, $timezone, $current_date, $slots, $calendar_id ) {
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

			// Check if time like 10:48:12 go to the next valid slot 11:00:00 depending on the duration
			$day_start->setTime( $day_start->format( 'H' ), ceil( $day_start->format( 'i' ) / $duration ) * $duration, 0 );
		}

		$current_slot_start = clone $day_start;

		while ( $current_slot_start < $day_end ) {
			$slot_start = clone $current_slot_start;
			$slot_end   = clone $slot_start;
			$slot_end->modify( "+{$duration} minutes" );

			if ( $slot_end > $day_end ) {
				break; // End of time block
			}

			// Check availability of the slot
			$availabile_slots = $this->check_available_slots( $slot_start, $slot_end, $calendar_id );

			if ( 0 === $availabile_slots ) {
				$current_slot_start->modify( "+{$duration} minutes" );
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
	public function check_available_slots( $day_start, $day_end, $calendar_id ) {
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
			case 'collective':
					$team_members = $calendar_id ? array( $calendar_id ) : $this->calendar->getTeamMembers();

					$slots_query->whereIn( 'calendar_id', $team_members )
							->where( 'start_time', '>=', $day_start->format( 'Y-m-d H:i:s' ) )
							->where( 'end_time', '<=', $day_end->format( 'Y-m-d H:i:s' ) );

					// For round-robin, set the number of event spots.
				if ( 'round-robin' === $this->type ) {
							$event_spots = count( $team_members );
				}
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
	public function get_booking_available_slots( $start_time, $duration, $calendar_id ) {
		$end_time = clone $start_time;
		$end_time->modify( "+{$duration} minutes" );

		return $this->get_slot_availability_count( $start_time, $end_time, $calendar_id );
	}

	/**
	 * Check slot availability
	 *
	 * @param \DateTime $start_time Start time
	 * @param \DateTime $end_time End time
	 *
	 * @return bool
	 */
	public function get_slot_availability_count( $start_time, $end_time, $calendar_id ) {
		$availability = $this->availability;
		$weekly_hours = $availability['weekly_hours'] ?? array();
		$day_of_week  = strtolower( date( 'l', $start_time->getTimestamp() ) ); // Get the day of the week (e.g., Monday, Tuesday)

		if ( ! $weekly_hours[ $day_of_week ]['off'] ) {
			foreach ( $weekly_hours[ $day_of_week ]['times'] as $time_block ) {
				$day_start = new \DateTime( date( 'Y-m-d', $start_time->getTimestamp() ) . ' ' . $time_block['start'], new \DateTimeZone( $this->availability['timezone'] ) );
				$day_end   = new \DateTime( date( 'Y-m-d', $start_time->getTimestamp() ) . ' ' . $time_block['end'], new \DateTimeZone( $this->availability['timezone'] ) );

				if ( $start_time >= $day_start && $end_time <= $day_end ) {
					$slots = $this->check_available_slots( $start_time, $end_time, $calendar_id );
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
