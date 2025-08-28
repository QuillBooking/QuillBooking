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
use SebastianBergmann\CodeCoverage\Driver\Xdebug;
use WPEloquent\Eloquent\Model;
use Illuminate\Support\Str;
use QuillBooking\Utils;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Event_Fields\Event_Fields;
use QuillBooking\Managers\Fields_Manager;
use QuillBooking\Availabilities;
use QuillBooking\Managers\Integrations_Manager;
use QuillBooking\Payment_Gateway\Payment_Validator;
use QuillBooking\Helpers\Integrations_Helper;

/**
 * Calendar Events Model class
 */
class Event_Model extends Model {

	/**
	 * Cached processed availability to avoid database updates during computation
	 *
	 * @var array|null
	 */
	private $processed_availability = null;

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
		'availability_id',
		'availability_meta',
		'availability_type',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'calendar_id'       => 'integer',
		'is_disabled'       => 'boolean',
		'reserve'           => 'boolean',
		'availability_id'   => 'integer',
		'availability_type' => 'string',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'calendar_id'       => 'required|integer',
		'name'              => 'required',
		'type'              => 'required',
		'duration'          => 'required',
		'color'             => 'regex:/^#[a-fA-F0-9]{6}$/',
		'availability_id'   => 'required|integer',
		'availability_meta' => 'required|array',
		'availability_type' => 'required|string',
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
		'name.required'              => 'Event name is required',
		'type.required'              => 'Event type is required',
		'duration.required'          => 'Event duration is required',
		'settings.location.required' => 'Event location is required',
		'color.regex'                => 'Color must be a valid hex color',
		'availability_id.required'   => 'Availability ID is required',
		'availability_id.integer'    => 'Availability ID must be an integer',
		'availability_meta.required' => 'Availability meta is required',
		'availability_type.required' => 'Availability type is required',
		'availability_type.string'   => 'Availability type must be a string',
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
		'group_settings',
		'booking_count',
		'connected_integrations',
		'price',
		'payments_settings',
		'advanced_settings',
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
	 * Relationship with availability
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function availability() {
		return $this->belongsTo( Availability_Model::class, 'availability_id', 'id' );
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
	public function getAvailabilityMetaAttribute() {
		return $this->attributes['availability_meta'] ? maybe_unserialize( $this->attributes['availability_meta'] ) : array();
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
			if ( \is_wp_error( $validation ) ) {
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
	 * Check if integrations are available
	 *
	 * @return bool
	 */
	private function has_integrations() {
		return Integrations_Helper::has_integrations();
	}

	/**
	 * Get Connected Integrations
	 *
	 * @return array
	 */
	public function getConnectedIntegrationsAttribute() {
		$connected_integrations = array();

		if ( ! Integrations_Helper::has_integrations() ) {
			return Integrations_Helper::get_default_integrations();
		}

		$integrations = Integrations_Manager::instance()->get_integrations();

		$calendar_ids = array( $this->calendar_id );
		if ( in_array( $this->calendar->type, array( 'team' ) ) ) {
			$team_members = $this->calendar->getTeamMembers();
			$calendar_ids = $team_members;
		}

		foreach ( $integrations as $integration_key => $integration_class ) {
			// It's a class name, instantiate it
			$integration = new $integration_class();
			$slug        = $integration->slug;
			$name        = $integration->name;

			$all_connected       = true;
			$has_accounts        = false;
			$global_settings     = $integration->get_settings();
			$set_global_settings = false;
			$teams_enabled       = false;
			$has_get_started     = false;
			$has_pro_version     = true;
			$team_members_setup  = true;

			if ( $slug == 'zoom' ) {
				$app_credentials = Arr::get( $global_settings, 'app_credentials', null );
				if ( $app_credentials && is_array( $app_credentials ) && ! empty( $app_credentials['client_id'] ) && ! empty( $app_credentials['client_secret'] ) ) {
					$set_global_settings = true;
				} else {
					$set_global_settings = false;
				}
			} elseif ( $slug == 'twilio' ) {
				$app_credentials = Arr::get( $global_settings, 'credentials', null );
				if ( $app_credentials && is_array( $app_credentials ) && ! empty( $app_credentials['auth_token'] ) && ! empty( $app_credentials['account_sid'] ) ) {
					$set_global_settings = true;
				} else {
					$set_global_settings = false;
				}
			} else {
				$app = Arr::get( $global_settings, 'app', null );
				if ( $app && is_array( $app ) && ! empty( $app['cache_time'] ) ) {
					$set_global_settings = true;
				} else {
					$set_global_settings = false;
				}
			}

			foreach ( $calendar_ids as $calendar_id ) {
				$is_host_calendar = false;
				if ( $this->calendar->type === 'team' ) {
					$calendar = Calendar_Model::where( 'user_id', $calendar_id )->where( 'type', 'host' )->first();
					if ( $calendar->user_id == $this->calendar->user_id ) {
						$is_host_calendar = true;
					}
				} else {
					$is_host_calendar = true;
					$calendar         = Calendar_Model::find( $calendar_id );
				}

				if ( $calendar ) {
					$integration->set_host( $calendar );

					$accounts = $integration->accounts->get_accounts();

					if ( empty( $accounts ) ) {
						$all_connected = false;
						// For team calendars, if any member doesn't have integration setup, mark as not setup
						if ( in_array( $this->calendar->type, array( 'team' ) ) && $slug !== 'zoom' ) {
							$team_members_setup = false;
						}

						if ( $slug === 'zoom' ) {
							if ( $is_host_calendar ) {
								$has_default_calendar = false;
								foreach ( $accounts as $account ) {
									if ( isset( $account['app_credentials']['account_id'] ) && isset( $account['app_credentials']['client_id'] ) && isset( $account['app_credentials']['client_secret'] ) ) {
										$has_default_calendar = true;
										break;
									}
								}
							}
							if ( ! $has_default_calendar && $is_host_calendar ) {
								$team_members_setup = false;
							}
						}
					} else {
						$has_accounts = true;
						// Check if this is the default account and has Teams enabled
						if ( $slug === 'outlook' && ! in_array( $this->calendar->type, array( 'team' ) ) ) {
							foreach ( $accounts as $account ) {
								if ( isset( $account['config']['default_calendar'] ) ) {
									// Check if Teams is explicitly enabled in the account settings
									$teams_enabled = isset( $account['config']['settings']['enable_teams'] ) &&
									$account['config']['settings']['enable_teams'] === true;
									break;
								}
							}
						}

						// For Google integration, check if member has proper configuration
						if ( in_array( $this->calendar->type, array( 'team' ) ) ) {
							if ( $slug === 'zoom' ) {
								if ( $is_host_calendar ) {
									$has_default_calendar = false;
									foreach ( $accounts as $account ) {
										if ( isset( $account['app_credentials']['account_id'] ) && isset( $account['app_credentials']['client_id'] ) && isset( $account['app_credentials']['client_secret'] ) ) {
											$has_default_calendar = true;
											break;
										}
									}
								}
								if ( ! $has_default_calendar && $is_host_calendar ) {
									$team_members_setup = false;
								}
							} else {
								$has_default_calendar = false;
								foreach ( $accounts as $account ) {
									if ( isset( $account['config']['default_calendar'] ) &&
									 ! empty( $account['config']['default_calendar']['calendar_id'] ) ) {
										$has_default_calendar = true;
										break;
									}
								}
								if ( ! $has_default_calendar ) {
									$team_members_setup = false;
								}
							}
						}
					}
				} else {
					$all_connected = false;
				}
			}

			if ( $this->calendar->type === 'team' ) {
					$teams_enabled = true;
			}

			$connected_integrations[ $slug ] = array(
				'name'               => $name,
				'connected'          => $all_connected,
				'has_accounts'       => $has_accounts,
				'has_settings'       => $set_global_settings,
				'teams_enabled'      => $teams_enabled,
				'has_get_started'    => $has_get_started,
				'has_pro_version'    => $has_pro_version,
				'team_members_setup' => $team_members_setup,
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
	private function processLocationFields( $event_location ) {
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

		foreach ( $event_location as $location ) {
			$location_manager = Locations_Manager::instance();
			$location_type    = $location_manager->get_location( $location['type'] );

			if ( ! $location_type ) {
				throw new \Exception( __( 'Location does not exist', 'quillbooking' ) );
			}

			$validation = $location_type->validate_fields( $location );
			if ( \is_wp_error( $validation ) ) {
				throw new \Exception( $validation->get_error_message() );
			}

			$fields['location-select']['options'][] = array(
				'label'  => $location_manager->get_location_label( $location ),
				'value'  => $location['type'] === 'custom' ? $location['id'] : $location['type'],
				'fields' => $location_type->get_fields( $location['fields'] ?? array() ),
			);
		}

		return $fields;
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
		$location_fields    = $this->processLocationFields( $event_location );
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
		$current_fields = $fields ?? array();

		foreach ( $fields as $group => $group_fields ) {
			foreach ( $group_fields as $field_key => $field ) {
				if ( in_array( $group, array( 'system', 'location' ), true ) ) {
					// Keep existing fields and update only label, helpText, and placeholder
					if ( isset( $current_fields[ $group ][ $field_key ] ) ) {
						$current_fields[ $group ][ $field_key ] = array_merge(
							$current_fields[ $group ][ $field_key ],
							array_intersect_key(
								$field,
								array_flip( array( 'label', 'helpText', 'placeholder', 'hidden' ) )
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
	 * Check if payment is required
	 *
	 * @return boolean
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

		// Check payment type - WooCommerce or native
		$payment_type = Arr::get( $payments_settings, 'type', 'native' );

		// If WooCommerce is the payment type
		if ( $payment_type === 'woocommerce' ) {
			$woo_product_set = Arr::get( $payments_settings, 'woo_product', false );

			// Check if WooCommerce is active and a product is set
			if ( $woo_product_set && class_exists( 'WooCommerce' ) ) {
				// Check if payment is available via filter
				return apply_filters( 'quillbooking_payment_available', true );
			} else {
				// Log appropriate error
				if ( ! class_exists( 'WooCommerce' ) ) {
					error_log( 'QuillBooking: Payment is enabled with WooCommerce but WooCommerce plugin is not active.' );
				} elseif ( ! $woo_product_set ) {
					error_log( 'QuillBooking: Payment is enabled with WooCommerce but no product is selected.' );
				}
				return false;
			}
		}

		// For native payment type, check payment gateways
		// Check if payment gateways are registered in the system
		$payment_gateways_manager = \QuillBooking\Managers\Payment_Gateways_Manager::instance();
		$payment_gateways         = $payment_gateways_manager->get_items();

		// If no payment gateways are registered or available, we can't require payment
		if ( empty( $payment_gateways ) ) {
			// Log this issue since it's a configuration problem
			error_log( 'QuillBooking: Payment is enabled but no payment gateways are registered in the system.' );
			return false;
		}

		if ( ! defined( 'QUILLBOOKING_PRO_VERSION' ) ) {
			error_log( 'QuillBooking: Payment is enabled but Pro plugin is not active.' );
			return false;
		}

		// Check if at least one payment gateway is enabled for this event
		$gateway_enabled = false;
		foreach ( $payment_gateways as $gateway ) {
			if ( Arr::get( $payments_settings, 'enable_' . $gateway->slug, false ) ) {
				$gateway_enabled = true;
				break;
			}
		}

		if ( ! $gateway_enabled ) {
			// Instead of throwing an exception, we'll just log and return false
			error_log( 'QuillBooking: Payment is enabled but no payment gateway is selected for this event.' );
			return false;
		}

		// Check if payment is available via filter
		return apply_filters( 'quillbooking_payment_available', true );
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
	 * @param int    $calendar_id Calendar ID to check availability for.
	 * @param int    $time_slot  Optional. Time slot interval in minutes. Default 0.
	 * @return array List of available slots.
	 */
	public function get_available_slots( $start_date, $timezone, $duration, $user_id = null ) {
		$this->validate_availability( $user_id );

		$start_date = $this->adjust_start_date( $start_date, $timezone, $duration );
		$end_date   = $this->calculate_end_date( $start_date, $timezone );

		$event_date_type = Arr::get( $this->event_range, 'type', 'days' );
		if ( 'infinity' === $event_date_type ) {
			// If user is browsing future months, start from the requested month
			$requested_date = new \DateTime( date( 'Y-m-d', $start_date ), new \DateTimeZone( $timezone ) );

			// Get first day of next month from the requested date
			$month_end = clone $requested_date;
			$month_end->modify( 'last day of +2 month' );
			$month_end->setTime( 23, 59, 59 );

			// Use the smaller of the calculated end date or two months ahead
			$month_end_timestamp = $month_end->getTimestamp();
			if ( $month_end_timestamp < $end_date ) {
				$end_date = $month_end_timestamp;
			}
		}

		$slots = $this->generate_daily_slots( $start_date, $end_date, $timezone, $duration, $user_id );

		return \apply_filters( 'quillbooking_get_available_slots', $slots, $this, $start_date, $end_date, $timezone );
	}

	/**
	 * Validate availability data and weekly hours.
	 */
	private function validate_availability( $user_id = null ) {
		// Use cached processed availability if available
		if ( $this->processed_availability !== null ) {
			$availability = $this->processed_availability;
		} else {
			$availability = $this->getTeamAvailability( $this->availability, $user_id );
			// Cache the processed availability to avoid repeated processing
			$this->processed_availability = $availability;
		}

		if ( ! $availability ) {
			// Try to get a system default availability as fallback
			$default_availability = Availabilities::get_system_availability();
			if ( $default_availability ) {
				// Only save to database if we're in a context where this is appropriate
				// For now, we'll just use it without saving to avoid unintended database updates
				$this->processed_availability = $default_availability;
				$availability                 = $default_availability;
			} else {
				throw new \Exception( __( 'Availability not set', 'quillbooking' ) );
			}
		}

		$weekly_hours = $availability['weekly_hours'] ?? array();
		if ( empty( $weekly_hours ) ) {
			// Try to get system default availability as fallback
			$default_availability = Availabilities::get_system_availability();
			if ( $default_availability && ! empty( $default_availability['weekly_hours'] ) ) {
				// Only save to database if we're in a context where this is appropriate
				// For now, we'll just use it without saving to avoid unintended database updates
				$this->processed_availability = $default_availability;
			} else {
				throw new \Exception( __( 'Weekly hours are not set', 'quillbooking' ) );
			}
		}
	}

	/**
	 * Get the effective availability (processed if available, otherwise original)
	 *
	 * @return array The availability array to use
	 */
	private function get_effective_availability() {
		 return $this->processed_availability !== null ? $this->processed_availability : $this->availability;
	}

	/**
	 * Clear the processed availability cache
	 * This should be called when the availability data changes
	 *
	 * @return void
	 */
	public function clear_availability_cache() {
		$this->processed_availability = null;
	}

	/**
	 * Set the event availability and clear cache
	 *
	 * @param array $value
	 * @return void
	 */
	public function setAvailabilityAttribute( $value ) {
		$this->clear_availability_cache();
		$this->update_meta( 'availability', $value );
	}

	private function getTeamAvailability( $availability, $user_id = null ) {
		$type          = $this->availability_type;
		$is_common     = $this->availability_meta['is_common'];
		$calendar_type = $this->calendar->type;
		if ( $calendar_type === 'team' ) {
			$availabilities[] = $availability;

			if ( $type === 'existing' && $is_common == false ) {
				$availabilities  = array();
				$hosts_schedules = $this->availability_meta['hosts_schedules'];
				// key and value
				foreach ( $hosts_schedules as $host_schedule ) {
					$user_avail = Availabilities::get_availability( $host_schedule );
					if ( $user_avail ) {
						$availabilities[] = $user_avail;
					} else {
						continue;
					}
				}

				if ( $user_id && $this->type === 'round-robin' ) {
					$availabilities = array_filter(
						$availabilities,
						function ( $availability ) use ( $user_id ) {
							return isset( $availability['user_id'] ) && $availability['user_id'] == $user_id;
						}
					);
					// get first availability from availabilities
					$first_availability           = array_values( $availabilities )[0];
					$availability['weekly_hours'] = $first_availability['weekly_hours'];
					$availability['override']     = $first_availability['override'];
					$availability['timezone']     = $first_availability['timezone'];
				}
				// If we have multiple availabilities, merge them to find common slots
				elseif ( count( $availabilities ) > 0 ) {
					$merged_availability = $this->findCommonTeamAvailability( $availabilities );
					// Preserve the original structure but use merged data
					$availability['weekly_hours'] = $merged_availability['weekly_hours'];
					// IMPORTANT: Keep the original timezone to avoid validation errors
					if ( ! empty( $merged_availability['timezone'] ) ) {
						$availability['timezone'] = $merged_availability['timezone'];
					}
					$availability['override'] = $merged_availability['override'] ?? array();
				}
				$availability['users_availability'] = $availabilities;
			} else {
				$availabilities = array();
				if ( $type === 'existing' ) {
					$availability = Availabilities::get_availability( $this->availability_id );
				} else {
					$availability_meta                 = array();
					$availability_meta['name']         = $this->availability_meta['custom_availability']['name'];
					$availability_meta['weekly_hours'] = $this->availability_meta['custom_availability']['value']['weekly_hours'];
					$availability_meta['override']     = $this->availability_meta['custom_availability']['value']['override'];
					$availability_meta['timezone']     = $this->calendar->get_meta( 'timezone' );
					$availability_meta['is_common']    = $this->availability_meta['is_common'];
					$availability                      = $availability_meta;
				}
			}
		} else {
			if ( $type === 'existing' ) {
				$availability = Availabilities::get_availability( $this->availability_id );
			} else {
				$availability_meta                 = array();
				$availability_meta['name']         = $this->availability_meta['custom_availability']['name'];
				$availability_meta['weekly_hours'] = $this->availability_meta['custom_availability']['value']['weekly_hours'];
				$availability_meta['override']     = $this->availability_meta['custom_availability']['value']['override'];
				$availability_meta['timezone']     = $this->calendar->get_meta( 'timezone' );
				$availability                      = $availability_meta;
			}
		}
		return $availability;
	}

	/**
	 * Parse availability value
	 *
	 * @param array $value
	 * @return array
	 */
	private function parseAvailabilityValue( $value ) {
		if ( is_array( $value ) ) {
			return $value;
		}
		return json_decode( $value, true );
	}

	/**
	 * Merge team member availabilities using union logic (combine all available slots).
	 *
	 * @param array $availabilities Array of user availabilities to merge
	 * @return array Merged availability structure
	 */
	private function findCommonTeamAvailability( $availabilities ) {
		if ( empty( $availabilities ) ) {
			return array();
		}

		// Initialize merged structure
		$first_availability = $availabilities[0];
		$merged             = array(
			'weekly_hours' => array(),
			'timezone'     => $first_availability['timezone'] ?? 'UTC',
			'override'     => array(),
		);

		// Days of the week
		$days = array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' );

		// For each day, combine availability from all users (union)
		foreach ( $days as $day ) {
			$merged['weekly_hours'][ $day ] = array(
				'times' => array(),
				'off'   => true, // Start as off, will be set to false if ANY user is available
			);

			$all_time_blocks    = array();
			$any_user_available = false;

			foreach ( $availabilities as $user_availability ) {
				$day_schedule = $user_availability['weekly_hours'][ $day ] ?? array();

				// If user is available this day (off = false), collect their time blocks
				if ( empty( $day_schedule['off'] ) ) {
					$any_user_available = true;
					$times              = $day_schedule['times'] ?? array();

					foreach ( $times as $time_block ) {
						$all_time_blocks[] = array(
							'start' => $time_block['start'],
							'end'   => $time_block['end'],
						);
					}
				}
			}

			// If any user is available, merge their time blocks
			if ( $any_user_available ) {
				$merged['weekly_hours'][ $day ]['off']   = false;
				$merged['weekly_hours'][ $day ]['times'] = $this->mergeTimeBlocks( $all_time_blocks );
			}
		}

		// Merge override dates from all users (union)
		foreach ( $availabilities as $user_availability ) {
			$user_overrides = $user_availability['override'] ?? array();
			foreach ( $user_overrides as $date => $time_blocks ) {
				if ( ! isset( $merged['override'][ $date ] ) ) {
					$merged['override'][ $date ] = array();
				}
				foreach ( $time_blocks as $block ) {
					$merged['override'][ $date ][] = $block;
				}
			}
		}

		// Clean up merged overrides by merging overlapping blocks
		foreach ( $merged['override'] as $date => $blocks ) {
			$merged['override'][ $date ] = $this->mergeTimeBlocks( $blocks );
		}

		return $merged;
	}

	/**
	 * Find common time blocks where ALL users are available (intersection).
	 *
	 * @param array $user_time_blocks Array of arrays, each containing time blocks for a user
	 * @return array Common time blocks
	 */
	private function findCommonTimeBlocks( $user_time_blocks ) {
		if ( empty( $user_time_blocks ) ) {
			return array();
		}

		// Start with the first user's time blocks
		$common_blocks = $user_time_blocks[0];

		// For each subsequent user, find intersections
		for ( $i = 1; $i < count( $user_time_blocks ); $i++ ) {
			$common_blocks = $this->intersectTimeBlocks( $common_blocks, $user_time_blocks[ $i ] );

			// If no common blocks remain, no point continuing
			if ( empty( $common_blocks ) ) {
				break;
			}
		}

		return $common_blocks;
	}

	/**
	 * Find intersection between two sets of time blocks.
	 *
	 * @param array $blocks1 First set of time blocks
	 * @param array $blocks2 Second set of time blocks
	 * @return array Intersecting time blocks
	 */
	private function intersectTimeBlocks( $blocks1, $blocks2 ) {
		$intersections = array();

		foreach ( $blocks1 as $block1 ) {
			foreach ( $blocks2 as $block2 ) {
				$intersection = $this->getTimeBlockIntersection( $block1, $block2 );
				if ( $intersection ) {
					$intersections[] = $intersection;
				}
			}
		}

		// Merge any overlapping intersections
		return $this->mergeTimeBlocks( $intersections );
	}

	/**
	 * Get intersection between two time blocks.
	 *
	 * @param array $block1 First time block
	 * @param array $block2 Second time block
	 * @return array|null Intersection block or null if no overlap
	 */
	private function getTimeBlockIntersection( $block1, $block2 ) {
		$start1 = strtotime( $block1['start'] );
		$end1   = strtotime( $block1['end'] );
		$start2 = strtotime( $block2['start'] );
		$end2   = strtotime( $block2['end'] );

		// Find the overlap
		$overlap_start = max( $start1, $start2 );
		$overlap_end   = min( $end1, $end2 );

		// Check if there's actual overlap
		if ( $overlap_start >= $overlap_end ) {
			return null; // No overlap
		}

		return array(
			'start' => date( 'H:i', $overlap_start ),
			'end'   => date( 'H:i', $overlap_end ),
		);
	}

	/**
	 * Merge overlapping time blocks into consolidated blocks.
	 *
	 * @param array $time_blocks Array of time blocks with 'start' and 'end' keys
	 * @return array Merged time blocks
	 */
	private function mergeTimeBlocks( $time_blocks ) {
		if ( empty( $time_blocks ) ) {
			return array();
		}

		// Sort blocks by start time
		usort(
			$time_blocks,
			function ( $a, $b ) {
				return strcmp( $a['start'], $b['start'] );
			}
		);

		$merged        = array();
		$current_block = $time_blocks[0];

		for ( $i = 1; $i < count( $time_blocks ); $i++ ) {
			$next_block = $time_blocks[ $i ];

			// Check if blocks overlap or are adjacent
			if ( $this->timeBlocksOverlapOrAdjacent( $current_block, $next_block ) ) {
				// Merge blocks by extending the end time
				$current_block['end'] = max( $current_block['end'], $next_block['end'] );
			} else {
				// No overlap, add current block to merged array and move to next
				$merged[]      = $current_block;
				$current_block = $next_block;
			}
		}

		// Add the last block
		$merged[] = $current_block;

		return $merged;
	}

	/**
	 * Check if two time blocks overlap or are adjacent.
	 *
	 * @param array $block1 First time block
	 * @param array $block2 Second time block
	 * @return bool True if blocks overlap or are adjacent
	 */
	private function timeBlocksOverlapOrAdjacent( $block1, $block2 ) {
		$start1 = strtotime( $block1['start'] );
		$end1   = strtotime( $block1['end'] );
		$start2 = strtotime( $block2['start'] );
		$end2   = strtotime( $block2['end'] );

		// Check for overlap or adjacent blocks (end of one equals start of another)
		return ( $start1 <= $end2 && $end1 >= $start2 );
	}

	/**
	 * Apply frequency limits to ensure booking constraints are respected.
	 *
	 * @param \DateTime|string|int $start_date Start date (DateTime object, timestamp or string).
	 */
	private function apply_frequency_limits( $start_date ) {
		if ( ! Arr::get( $this->limits, 'frequency.enable', false ) ) {
			return;
		}

		$frequency_limits = Arr::get( $this->limits, 'frequency.limits', array() );
		foreach ( $frequency_limits as $frequency ) {
			if ( ! $frequency['limit'] || ! $frequency['unit'] ) {
				throw new \Exception( __( 'Frequency limit or unit is not set', 'quillbooking' ) );
			}

			$this->validate_frequency_limits( $frequency['limit'], $frequency['unit'], $start_date, 'Event reached the frequency limit' );
		}
	}

	/**
	 *  Validate booking frequency limits.
	 */
	private function validate_frequency_limits( $limit, $unit, $start_date, $message ) {
		if ( ! in_array( $unit, array( 'days', 'weeks', 'months' ), true ) ) {
			throw new \Exception( __( 'Invalid frequency unit', 'quillbooking' ) );
		}

		switch ( $unit ) {
			case 'days':
				$start = clone $start_date;
				$start->setTime( 0, 0, 0 );  // Start of the day
				$end = clone $start;
				$end->setTime( 23, 59, 59 );  // End of the day
				break;
			case 'weeks':
				$start = clone $start_date;

				// Get user's preferred start of week from settings
				$settings   = get_option( 'quillbooking_settings', array() );
				$start_from = isset( $settings['general']['start_from'] ) ?
					$settings['general']['start_from'] : 'Monday';
				$start_from = ucfirst( strtolower( $start_from ) );

				// Get the current day of week (0 = Sunday, 1 = Monday, etc.)
				$current_day_num = (int) $start_date->format( 'w' );

				// Convert start_from to a day number (0-6)
				$day_map = array(
					'Sunday'    => 0,
					'Monday'    => 1,
					'Tuesday'   => 2,
					'Wednesday' => 3,
					'Thursday'  => 4,
					'Friday'    => 5,
					'Saturday'  => 6,
				);

				$start_from_num = isset( $day_map[ $start_from ] ) ? $day_map[ $start_from ] : 1; // Default to Monday (1)

				// Calculate days to subtract to get to the start of the week
				$days_to_subtract = ( $current_day_num - $start_from_num ) % 7;
				if ( $days_to_subtract < 0 ) {
					$days_to_subtract += 7;
				}

				// Set to start of the week based on user preference
				$start->modify( "-{$days_to_subtract} days" );
				$start->setTime( 0, 0, 0 );

				// Set to end of week (7 days from start)
				$end = clone $start;
				$end->modify( '+6 days' );  // End of the week (6 days after start)
				$end->setTime( 23, 59, 59 );
				break;
			case 'months':
				$start = clone $start_date;
				// Set to first day of the month
				$start->modify( 'first day of this month' );
				$start->setTime( 0, 0, 0 );

				// Set to last day of the month
				$end = clone $start;
				$end->modify( 'last day of this month' );
				$end->setTime( 23, 59, 59 );
				break;
		}

		$start_time = $start->format( 'Y-m-d H:i:s' );
		$end_time   = $end->format( 'Y-m-d H:i:s' );

		$query = Booking_Model::where( 'event_id', $this->id )
			->where( 'start_time', '>=', $start_time )
			->where( 'end_time', '<=', $end_time )
			->where( 'status', '!=', 'cancelled' );

		$result = $query->count();

		if ( $result >= $limit ) {
			throw new \Exception( __( $message, 'quillbooking' ) );
		}
	}

	/**
	 * Apply duration limits to ensure total booking time is within allowed constraints.
	 *
	 * @param \DateTime|string|int $start_date Start date (DateTime object, timestamp or string).
	 */
	private function apply_duration_limits( $start_date ) {
		if ( ! Arr::get( $this->limits, 'duration.enable', false ) ) {
			return;
		}

		$duration_limits = Arr::get( $this->limits, 'duration.limits', array() );
		foreach ( $duration_limits as $duration ) {
			if ( ! $duration['limit'] || ! $duration['unit'] ) {
				throw new \Exception( __( 'Duration limit or unit is not set', 'quillbooking' ) );
			}

			$this->validate_duration_limit( $duration['limit'], $duration['unit'], $start_date, 'Event reached the duration limit', true );
		}
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
	private function validate_duration_limit( $limit, $unit, $start_date, $message, $sum = false ) {
		switch ( $unit ) {
			case 'days':
				$start = clone $start_date;
				$start->setTime( 0, 0, 0 );  // Start of the day
				$end = clone $start;
				$end->setTime( 23, 59, 59 );  // End of the day
				break;
			case 'weeks':
				$start = clone $start_date;

				// Get user's preferred start of week from settings
				$settings   = get_option( 'quillbooking_settings', array() );
				$start_from = isset( $settings['general']['start_from'] ) ?
					$settings['general']['start_from'] : 'Monday';
				$start_from = ucfirst( strtolower( $start_from ) );

				// Get the current day of week (0 = Sunday, 1 = Monday, etc.)
				$current_day_num = (int) $start_date->format( 'w' );

				// Convert start_from to a day number (0-6)
				$day_map = array(
					'Sunday'    => 0,
					'Monday'    => 1,
					'Tuesday'   => 2,
					'Wednesday' => 3,
					'Thursday'  => 4,
					'Friday'    => 5,
					'Saturday'  => 6,
				);

				$start_from_num = isset( $day_map[ $start_from ] ) ? $day_map[ $start_from ] : 1; // Default to Monday (1)

				// Calculate days to subtract to get to the start of the week
				$days_to_subtract = ( $current_day_num - $start_from_num ) % 7;
				if ( $days_to_subtract < 0 ) {
					$days_to_subtract += 7;
				}

				// Set to start of the week based on user preference
				$start->modify( "-{$days_to_subtract} days" );
				$start->setTime( 0, 0, 0 );

				// Set to end of week (7 days from start)
				$end = clone $start;
				$end->modify( '+6 days' );  // End of the week (6 days after start)
				$end->setTime( 23, 59, 59 );
				break;
			case 'months':
				$start = clone $start_date;
				// Set to first day of the month
				$start->modify( 'first day of this month' );
				$start->setTime( 0, 0, 0 );

				// Set to last day of the month
				$end = clone $start;
				$end->modify( 'last day of this month' );
				$end->setTime( 23, 59, 59 );
				break;
		}

		$start_time = $start->format( 'Y-m-d H:i:s' );
		$end_time   = $end->format( 'Y-m-d H:i:s' );

		$query = Booking_Model::where( 'event_id', $this->id )
			->where( 'start_time', '>=', $start_time )
			->where( 'end_time', '<=', $end_time )
			->where( 'status', '!=', 'cancelled' );

		$duration = 0;
		foreach ( $query->get() as $booking ) {
			$duration += $booking->slot_time;
		}

		if ( $duration >= $limit ) {
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

		return $event_end_date;
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
	private function generate_daily_slots( $start_date, $end_date, $timezone, $duration, $user_id = null ) {
		$slots = array();
		for ( $current_date = $start_date; $current_date <= $end_date; $current_date = strtotime( '+1 day', $current_date ) ) {
			$current_date_formatted = date( 'Y-m-d', $current_date );
			$day_of_week            = strtolower( date( 'l', $current_date ) );

			// Check for date-specific override first
			$has_override = false;
			$time_blocks  = array();

			$effective_availability = $this->get_effective_availability();

			if ( isset( $effective_availability['override'][ $current_date_formatted ] ) ) {
				// We have a date-specific override for this day
				$has_override = true;
				$time_blocks  = $effective_availability['override'][ $current_date_formatted ];
			} elseif ( empty( $effective_availability['weekly_hours'][ $day_of_week ]['off'] ) ) {
				// Fall back to regular weekly hours if no override exists
				$time_blocks = $effective_availability['weekly_hours'][ $day_of_week ]['times'];
			}

			// If we have time blocks (either from override or weekly hours), process them
			if ( ! empty( $time_blocks ) ) {
				foreach ( $time_blocks as $time_block ) {
					$day_start = new \DateTime( $current_date_formatted . ' ' . $time_block['start'], new \DateTimeZone( $effective_availability['timezone'] ) );
					$day_end   = new \DateTime( $current_date_formatted . ' ' . $time_block['end'], new \DateTimeZone( $effective_availability['timezone'] ) );
					try {
						$this->apply_frequency_limits( $day_start );
						$this->apply_duration_limits( $day_start );
					} catch ( \Exception $e ) {
						continue; // Skip this time block if frequency limits are exceeded
					}
					$day_start->setTimezone( new \DateTimeZone( $timezone ) );
					$day_end->setTimezone( new \DateTimeZone( $timezone ) );

					$slots = $this->generate_slots_for_time_block( $day_start, $day_end, $duration, $timezone, $current_date, $slots, $user_id );
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
	 * @param int       $calendar_id The calendar ID.
	 * @return array Updated slots with new time block slots.
	 */
	private function generate_slots_for_time_block( $day_start, $day_end, $duration, $timezone, $current_date, $slots, $user_id = null ) {
		// Get current time in user timezone
		$current_time = new \DateTime( 'now', new \DateTimeZone( $this->get_effective_availability()['timezone'] ) );
		$current_time->setTimezone( new \DateTimeZone( $timezone ) );

		// Get minimum notice settings
		$min_notice      = Arr::get( $this->limits, 'general.minimum_notices', 4 );
		$min_notice_unit = Arr::get( $this->limits, 'general.minimum_notice_unit', 'hours' );

		// Get time slot interval from event limits data
		$time_slot_interval = Arr::get( $this->limits, 'general.time_slot', 0 );

		// If time slot interval is set and valid, use it instead of duration for slot generation
		$slot_step = ( $time_slot_interval > 0 ) ? $time_slot_interval : $duration;

		// Convert all dates to timestamps for easier comparison
		$current_timestamp   = $current_time->getTimestamp();
		$day_start_timestamp = $day_start->getTimestamp();

		// Calculate the minimum notice period in seconds
		$min_notice_seconds = 0;
		if ( $min_notice > 0 ) {
			switch ( $min_notice_unit ) {
				case 'days':
					$min_notice_seconds = $min_notice * 24 * 60 * 60;
					break;
				case 'hours':
					$min_notice_seconds = $min_notice * 60 * 60;
					break;
				case 'minutes':
					$min_notice_seconds = $min_notice * 60;
					break;
			}
		}

		// Calculate the earliest allowed booking time
		$min_allowed_timestamp = $current_timestamp + $min_notice_seconds;

		// If day_start is before the minimum allowed time, adjust it
		if ( $day_start_timestamp < $min_allowed_timestamp ) {
			// Create a new DateTime object from the minimum allowed timestamp
			$day_start = new \DateTime( '@' . $min_allowed_timestamp );
			$day_start->setTimezone( new \DateTimeZone( $timezone ) );
		}

		// Round up to the next valid slot based on the slot_step
		// Get the current hour and minute from the (potentially adjusted) day_start
		$current_hour   = (int) $day_start->format( 'H' );
		$current_minute = (int) $day_start->format( 'i' );

		// Calculate the total minutes from midnight for the current day_start
		$total_minutes_from_midnight = ( $current_hour * 60 ) + $current_minute;

		// Calculate the next rounded total minutes
		$rounded_total_minutes = ceil( $total_minutes_from_midnight / $slot_step ) * $slot_step;

		// Apply the rounded time, handling day rollovers automatically.
		// First, reset the time to 00:00:00 for the current day to ensure consistent modification.
		$day_start->setTime( 0, 0, 0 );
		// Then add the rounded total minutes. This will advance the day if necessary.
		$day_start->modify( "+{$rounded_total_minutes} minutes" );

		// If after adjustments, day_start is now after day_end, there are no available slots
		if ( $day_start >= $day_end ) {
			return $slots;
		}

		$current_slot_start = clone $day_start;

		// Track original slots to help with synthetic slot generation
		$original_slots = array();

		// First pass: generate slots based on the slot_step interval
		while ( $current_slot_start < $day_end ) {
			$slot_start = clone $current_slot_start;
			$slot_end   = clone $slot_start;
			$slot_end->modify( "+{$duration} minutes" ); // End time is always based on the actual duration

			if ( $slot_end > $day_end ) {
				break; // End of time block
			}

			// Check availability of the slot
			$available_slots = $this->check_available_slots( $slot_start, $slot_end, $user_id );

			if ( $available_slots['slots'] === 0 ) {
				// Move to the next interval
				$current_slot_start->modify( "+{$slot_step} minutes" );
				continue;
			}

			$day       = $current_slot_start->format( 'Y-m-d' );
			$slot_data = array(
				'start'     => $slot_start->format( 'Y-m-d H:i:s' ),
				'end'       => $slot_end->format( 'Y-m-d H:i:s' ),
				'remaining' => $available_slots['slots'],
				'hosts_ids' => $available_slots['hosts_ids'],
			);

			// Store in original slots array for reference
			$original_slots[] = $slot_data;

			// Add to the slots array
			if ( ! isset( $slots[ $day ] ) ) {
				$slots[ $day ] = array();
			}
			$slots[ $day ][] = $slot_data;

			// Move to the next interval
			$current_slot_start->modify( "+{$slot_step} minutes" );
		}

		// If time_slot_interval is set and smaller than duration, we need to generate synthetic slots
		if ( $time_slot_interval > 0 && $time_slot_interval < $duration && ! empty( $original_slots ) ) {
			// Second pass: generate synthetic slots at the specified interval
			$day = $day_start->format( 'Y-m-d' );

			// Start from the earliest time aligned to the interval
			$synthetic_start = clone $day_start;
			$synthetic_end   = clone $day_end;

			// Create a map of existing slots by start time for quick lookup
			$existing_slots = array();
			if ( isset( $slots[ $day ] ) ) {
				foreach ( $slots[ $day ] as $slot ) {
					$start_time                    = ( new \DateTime( $slot['start'] ) )->format( 'H:i:s' );
					$existing_slots[ $start_time ] = true;
				}
			}

			$current_time = clone $synthetic_start;

			while ( $current_time < $synthetic_end ) {
				$current_time_str = $current_time->format( 'H:i:s' );

				// Skip if this exact time already exists as a slot
				if ( isset( $existing_slots[ $current_time_str ] ) ) {
					$current_time->modify( "+{$time_slot_interval} minutes" );
					continue;
				}

				// Check if this time falls within any existing slot's duration
				$is_within_existing_slot = false;
				$reference_slot          = null;

				foreach ( $original_slots as $original_slot ) {
					$original_start = new \DateTime( $original_slot['start'] );
					$original_end   = new \DateTime( $original_slot['end'] );

					// If current time is within this slot's range, use it as reference
					if ( $current_time >= $original_start && $current_time < $original_end ) {
						$is_within_existing_slot = true;
						$reference_slot          = $original_slot;
						break;
					}
				}

				// If we found a reference slot, create a synthetic slot
				if ( $is_within_existing_slot && $reference_slot ) {
					$synthetic_slot_start = clone $current_time;
					$synthetic_slot_end   = clone $synthetic_slot_start;
					$synthetic_slot_end->modify( "+{$duration} minutes" );

					// Only create the synthetic slot if it ends before the day_end
					if ( $synthetic_slot_end <= $day_end ) {
						// Check if this synthetic slot is available
						$available_slots = $this->check_available_slots( $synthetic_slot_start, $synthetic_slot_end, $user_id );

						if ( $available_slots['slots'] > 0 ) {
							// Mark this as a synthetic slot
							$synthetic_slot = array(
								'start'     => $synthetic_slot_start->format( 'Y-m-d H:i:s' ),
								'end'       => $synthetic_slot_end->format( 'Y-m-d H:i:s' ),
								'remaining' => $reference_slot['remaining'],
								'hosts_ids' => $available_slots['hosts_ids'],
								'synthetic' => true, // Flag to identify synthetic slots in frontend
							);

							if ( ! isset( $slots[ $day ] ) ) {
								$slots[ $day ] = array();
							}
							$slots[ $day ][] = $synthetic_slot;
						}
					}
				}

				// Move to the next interval
				$current_time->modify( "+{$time_slot_interval} minutes" );
			}

			// Sort slots by start time
			if ( isset( $slots[ $day ] ) && count( $slots[ $day ] ) > 1 ) {
				usort(
					$slots[ $day ],
					function ( $a, $b ) {
						return strcmp( $a['start'], $b['start'] );
					}
				);
			}
		}

		return $slots;
	}

	/**
	 * Get the end date of the event
	 *
	 * @param string $timezone Timezone
	 *
	 * @return int
	 * @throws \Exception
	 */
	public function get_end_date( $timezone ) {
		// Validate required data
		if ( empty( $this->created_at ) || empty( $this->get_effective_availability()['timezone'] ) ) {
			throw new \Exception( __( 'Invalid event data: missing created_at or timezone', 'quillbooking' ) );
		}

		// Validate timezone strings
		try {
			$original_tz = new \DateTimeZone( $this->get_effective_availability()['timezone'] );
			$target_tz   = new \DateTimeZone( $timezone );
		} catch ( \Exception $e ) {
			throw new \Exception( __( 'Invalid timezone provided', 'quillbooking' ) );
		}

		// Create the base date from creation time
		try {
			$created_date = new \DateTime( $this->created_at, $original_tz );
			$created_date->setTimezone( $target_tz );
		} catch ( \Exception $e ) {
			throw new \Exception( __( 'Invalid created_at date format', 'quillbooking' ) );
		}

		$event_date_type = Arr::get( $this->event_range, 'type', 'days' );
		$end_date        = null;

		switch ( $event_date_type ) {
			case 'days':
				$end_event_value = Arr::get( $this->event_range, 'days', 60 );

				// Validate days value
				if ( ! is_numeric( $end_event_value ) || $end_event_value < 0 || $end_event_value > 3650 ) {
					throw new \Exception( __( 'Invalid days value. Must be between 0 and 3650', 'quillbooking' ) );
				}

				// Clone to avoid modifying original date
				$end_date = clone $created_date;
				$end_date->modify( "+{$end_event_value} days" );
				// Set to end of day for consistency
				$end_date->setTime( 23, 59, 59 );
				break;

			case 'infinity':
				// Clone to avoid modifying original date
				$end_date = clone $created_date;
				$end_date->modify( '+5 years' );
				// Set to end of day for consistency
				$end_date->setTime( 23, 59, 59 );
				break;

			case 'date_range':
				$end_event_value = Arr::get( $this->event_range, 'end_date', null );
				if ( empty( $end_event_value ) ) {
					throw new \Exception( __( 'End date is required for date_range type', 'quillbooking' ) );
				}

				try {
					// Create DateTime with UTC timezone to avoid DST issues
					$end_date = new \DateTime( $end_event_value, new \DateTimeZone( 'UTC' ) );
					$end_date->setTime( 23, 59, 59 );
					// Convert to the target timezone
					$end_date->setTimezone( $target_tz );
				} catch ( \Exception $e ) {
					throw new \Exception( __( 'Invalid end_date format', 'quillbooking' ) );
				}

				// Validate that end date is after creation date
				// For fair comparison, set created_date to start of day
				$created_date_start = clone $created_date;
				$created_date_start->setTime( 0, 0, 0 );

				if ( $end_date <= $created_date_start ) {
					throw new \Exception( __( 'End date must be after the created date', 'quillbooking' ) );
				}
				break;

			default:
				throw new \Exception( __( 'Invalid event date type', 'quillbooking' ) );
		}

		return $end_date->getTimestamp();
	}

	/**
	 * Get event start date
	 *
	 * @param string $timezone Timezone
	 *
	 * @return int
	 * @throws \Exception
	 */
	public function get_start_date( $timezone ) {
		// Validate required data
		if ( empty( $this->created_at ) || empty( $this->get_effective_availability()['timezone'] ) ) {
			throw new \Exception( __( 'Invalid event data: missing created_at or timezone', 'quillbooking' ) );
		}

		// Validate timezone strings
		try {
			$original_tz = new \DateTimeZone( $this->get_effective_availability()['timezone'] );
			$target_tz   = new \DateTimeZone( $timezone );
		} catch ( \Exception $e ) {
			throw new \Exception( __( 'Invalid timezone provided', 'quillbooking' ) );
		}

		$event_date_type = Arr::get( $this->event_range, 'type', 'days' );
		$start_date      = null;

		try {
			// Create the base date from creation time
			$start_date = new \DateTime( $this->created_at, $original_tz );
			$start_date->setTimezone( $target_tz );

			// For non-date_range types, set to start of day for consistency
			if ( 'date_range' !== $event_date_type ) {
				$start_date->setTime( 0, 0, 0 );
			}
		} catch ( \Exception $e ) {
			throw new \Exception( __( 'Invalid created_at date format', 'quillbooking' ) );
		}

		// Handle date_range type with custom start date
		if ( 'date_range' === $event_date_type ) {
			$start_date_value = Arr::get( $this->event_range, 'start_date', null );
			if ( empty( $start_date_value ) ) {
				throw new \Exception( __( 'Start date is required for date_range type', 'quillbooking' ) );
			}

			try {
				// Create DateTime with UTC timezone to avoid DST issues
				$start_date = new \DateTime( $start_date_value, new \DateTimeZone( 'UTC' ) );
				$start_date->setTime( 0, 0, 0 );
				// Convert to the target timezone
				$start_date->setTimezone( $target_tz );
			} catch ( \Exception $e ) {
				throw new \Exception( __( 'Invalid start_date format', 'quillbooking' ) );
			}

			// Validate that start date is not in the past relative to creation date
			$created_date_check = new \DateTime( $this->created_at, $original_tz );
			$created_date_check->setTimezone( $target_tz );
			$created_date_check->setTime( 0, 0, 0 );

			if ( $start_date < $created_date_check ) {
				throw new \Exception( __( 'Start date cannot be before the created date', 'quillbooking' ) );
			}
		}

		return $start_date->getTimestamp();
	}

	/**
	 * Check available slots
	 *
	 * @param \DateTime $day_start Start date
	 * @param \DateTime $day_end End date
	 *
	 * @return int
	 */
	public function check_available_slots( $day_start, $day_end, $user_id = null ) {
		$day_start = clone $day_start;
		$day_end   = clone $day_end;

		$buffer_before = Arr::get( $this->limits, 'general.buffer_before', 0 );
		$buffer_after  = Arr::get( $this->limits, 'general.buffer_after', 0 );

		$day_start->setTimezone( new \DateTimeZone( 'UTC' ) );
		$day_end->setTimezone( new \DateTimeZone( 'UTC' ) );

		switch ( $this->type ) {
			case 'one-to-one':
			case 'group':
				$slots_query = Booking_Model::query()
					->whereHas(
						'hosts',
						function ( $q ) {
							$q->where( 'user_id', $this->user_id );
						}
					)
					->where( 'status', '!=', 'cancelled' )
					->where(
						function ( $query ) use ( $day_start, $day_end, $buffer_before, $buffer_after ) {
							$query->where(
								function ( $q ) use ( $day_start, $day_end, $buffer_before, $buffer_after ) {
									$q->where(
										function ( $subq ) use ( $day_start, $buffer_after ) {
											$subq->whereRaw( 'DATE_ADD(end_time, INTERVAL ? MINUTE) > ?', array( $buffer_after, $day_start->format( 'Y-m-d H:i:s' ) ) );
										}
									)
										->where(
											function ( $subq ) use ( $day_end, $buffer_before ) {
												$subq->whereRaw( 'DATE_SUB(start_time, INTERVAL ? MINUTE) < ?', array( $buffer_before, $day_end->format( 'Y-m-d H:i:s' ) ) );
											}
										);
								}
							);
						}
					);
				$event_spots = 'one-to-one' === $this->type ? 1 : Arr::get( $this->group_settings, 'max_invites', 2 );
				$slots       = $slots_query->count();
				return array(
					'slots'     => $event_spots > $slots ? $event_spots - $slots : 0,
					'hosts_ids' => array(),
				);

			case 'round-robin':
				$team_members   = $this->calendar->getTeamMembers();
				$availabilities = $this->get_effective_availability()['users_availability'];

				// For round-robin, check if ANY team member is available
				$available_members   = 0;
				$available_hosts_ids = array();
				foreach ( $team_members as $team_member_id ) {
					if ( $this->get_effective_availability()['is_common'] ) {
						$is_member_available = true;
					} else {
						$is_member_available = false;

						// First, check team member's individual availability schedule
						if ( ! empty( $availabilities ) ) {
							// Find this team member's availability from the collected availabilities
							$member_availability = null;
							foreach ( $availabilities as $avail ) {
								if ( isset( $avail['user_id'] ) && $avail['user_id'] == $team_member_id ) {
									$member_availability = $avail;
									break;
								}
							}

							// If we found the member's availability, check if they're available during this time
							if ( $member_availability ) {
								$is_member_available = $this->checkMemberAvailabilitySchedule( $member_availability, $day_start, $day_end );
							}
						} else {
							// Fallback: get team member's default availability
							$member_default_availability = Availabilities::get_user_default_availability( $team_member_id );
							if ( $member_default_availability ) {
								$is_member_available = $this->checkMemberAvailabilitySchedule( $member_default_availability, $day_start, $day_end );
							}
						}
					}

					// If member is available according to their schedule, check for booking conflicts
					if ( $is_member_available ) {
						$member_slots_query = Booking_Model::query()
							->whereHas(
								'hosts',
								function ( $q ) use ( $team_member_id ) {
									$q->where( 'user_id', $team_member_id );
								}
							)
							->where( 'status', '!=', 'cancelled' )
							->where(
								function ( $query ) use ( $day_start, $day_end, $buffer_before, $buffer_after ) {
									$query->where(
										function ( $q ) use ( $day_start, $day_end, $buffer_before, $buffer_after ) {
											$q->where(
												function ( $subq ) use ( $day_start, $buffer_after ) {
													$subq->whereRaw( 'DATE_ADD(end_time, INTERVAL ? MINUTE) > ?', array( $buffer_after, $day_start->format( 'Y-m-d H:i:s' ) ) );
												}
											)
												->where(
													function ( $subq ) use ( $day_end, $buffer_before ) {
														$subq->whereRaw( 'DATE_SUB(start_time, INTERVAL ? MINUTE) < ?', array( $buffer_before, $day_end->format( 'Y-m-d H:i:s' ) ) );
													}
												);
										}
									);
								}
							);
						$member_slots       = $member_slots_query->count();

						// If this member has no conflicting bookings and is available according to schedule
						if ( $member_slots === 0 ) {
							$available_members++;
							$available_hosts_ids[] = $team_member_id;
						}
					}
				}

				// For round-robin, return 1 if ANY team member is available
				return array(
					'slots'     => $available_members,
					'hosts_ids' => $available_hosts_ids,
				);

			case 'collective':
				$team_members   = $this->calendar->getTeamMembers();
				$availabilities = $this->get_effective_availability()['users_availability'];

				// For collective, ALL team members must be available
				$total_members       = count( $team_members );
				$available_members   = 0;
				$available_hosts_ids = array();

				foreach ( $team_members as $team_member_id ) {
					if ( $this->get_effective_availability()['is_common'] ) {
						$is_member_available = true;
					} else {

						// First, check team member's individual availability schedule
						if ( ! empty( $availabilities ) ) {
							// Find this team member's availability from the collected availabilities
							$member_availability = null;
							foreach ( $availabilities as $avail ) {
								if ( isset( $avail['user_id'] ) && $avail['user_id'] == $team_member_id ) {
									$member_availability = $avail;
									break;
								}
							}

							// If we found the member's availability, check if they're available during this time
							if ( $member_availability ) {
								$is_member_available = $this->checkMemberAvailabilitySchedule( $member_availability, $day_start, $day_end );
							}
						} else {
							// Fallback: get team member's default availability
							$member_default_availability = Availabilities::get_user_default_availability( $team_member_id );
							if ( $member_default_availability ) {
								$is_member_available = $this->checkMemberAvailabilitySchedule( $member_default_availability, $day_start, $day_end );
							}
						}
					}

					// If member is available according to their schedule, check for booking conflicts
					if ( $is_member_available ) {
						$member_slots_query = Booking_Model::query()
							->whereHas(
								'hosts',
								function ( $q ) use ( $team_member_id ) {
									$q->where( 'user_id', $team_member_id );
								}
							)
							->where( 'status', '!=', 'cancelled' )
							->where(
								function ( $query ) use ( $day_start, $day_end, $buffer_before, $buffer_after ) {
									$query->where(
										function ( $q ) use ( $day_start, $day_end, $buffer_before, $buffer_after ) {
											$q->where(
												function ( $subq ) use ( $day_start, $buffer_after ) {
													$subq->whereRaw( 'DATE_ADD(end_time, INTERVAL ? MINUTE) > ?', array( $buffer_after, $day_start->format( 'Y-m-d H:i:s' ) ) );
												}
											)
												->where(
													function ( $subq ) use ( $day_end, $buffer_before ) {
														$subq->whereRaw( 'DATE_SUB(start_time, INTERVAL ? MINUTE) < ?', array( $buffer_before, $day_end->format( 'Y-m-d H:i:s' ) ) );
													}
												);
										}
									);
								}
							);
						$member_slots       = $member_slots_query->count();

						// If this member has no conflicting bookings and is available according to schedule
						if ( $member_slots === 0 ) {
							$available_members++;
							$available_hosts_ids[] = $team_member_id;
						}
					}
				}

				// For collective, return 1 only if ALL team members are available
				$slots_available = ( $available_members === $total_members ) ? 1 : 0;
				return array(
					'slots'     => $slots_available,
					'hosts_ids' => $slots_available ? $available_hosts_ids : array(),
				);
			default:
				error_log( 'DEBUG: Unknown event type: ' . $this->type );
				return array(
					'slots'     => 0,
					'hosts_ids' => array(),
				);
		}
	}

	/**
	 * Is slot available
	 *
	 * @param \DateTime $start_time Start time
	 * @param int       $duration Duration of the slot
	 *
	 * @return int
	 */
	public function get_booking_available_slots( $start_time, $duration, $timezone, $user_id = null ) {
		$end_time = clone $start_time;
		$end_time->modify( "+{$duration} minutes" );

		return $this->get_slot_availability_count( $start_time, $end_time, $timezone, $user_id );
	}

	/**
	 * Check slot availability
	 *
	 * @param \DateTime $start_time Start time
	 * @param \DateTime $end_time End time
	 *
	 * @return bool
	 */
	public function get_slot_availability_count( $start_time, $end_time, $timezone, $user_id = null ) {
		$availability         = $this->getTeamAvailability( $this->get_effective_availability(), $user_id );
		$start_date_formatted = $start_time->format( 'Y-m-d' );

		// Check for date-specific override first
		if ( isset( $availability['override'][ $start_date_formatted ] ) ) {
			// We have a date-specific override for this day
			foreach ( $availability['override'][ $start_date_formatted ] as $time_block ) {
				$day_start = new \DateTime( $start_date_formatted . ' ' . $time_block['start'], new \DateTimeZone( $availability['timezone'] ) );
				$day_end   = new \DateTime( $start_date_formatted . ' ' . $time_block['end'], new \DateTimeZone( $this->availability['timezone'] ) );

				if ( $start_time >= $day_start && $end_time <= $day_end ) {
					$slots = $this->check_available_slots( $start_time, $end_time, $user_id );
					return $slots['slots'];
				}
			}
		} else {
			// Fall back to regular weekly hours
			$weekly_hours = $availability['weekly_hours'] ?? array();
			$day_of_week  = strtolower( date( 'l', $start_time->getTimestamp() ) ); // Get the day of the week (e.g., Monday, Tuesday)

			if ( ! $weekly_hours[ $day_of_week ]['off'] ) {
				foreach ( $weekly_hours[ $day_of_week ]['times'] as $time_block ) {
					$day_start = new \DateTime( date( 'Y-m-d', $start_time->getTimestamp() ) . ' ' . $time_block['start'], new \DateTimeZone( $availability['timezone'] ) );
					$day_end   = new \DateTime( date( 'Y-m-d', $start_time->getTimestamp() ) . ' ' . $time_block['end'], new \DateTimeZone( $availability['timezone'] ) );

					if ( $start_time >= $day_start && $end_time <= $day_end ) {
						$slots = $this->check_available_slots( $start_time, $end_time, $user_id );
						return $slots['slots'];
					}
				}
			}
		}

		return 0;
	}

	/**
	 * Check if a team member is available according to their availability schedule
	 *
	 * @param array     $member_availability The team member's availability data
	 * @param \DateTime $day_start           Start time to check
	 * @param \DateTime $day_end             End time to check
	 *
	 * @return bool True if member is available during the specified time
	 */
	private function checkMemberAvailabilitySchedule( $member_availability, $day_start, $day_end ) {
		$start_date_formatted = $day_start->format( 'Y-m-d' );
		$member_timezone      = $member_availability['timezone'] ?? 'UTC';

		// Check for date-specific override first
		if ( isset( $member_availability['override'][ $start_date_formatted ] ) ) {
			foreach ( $member_availability['override'][ $start_date_formatted ] as $time_block ) {
				$block_start = new \DateTime( $start_date_formatted . ' ' . $time_block['start'], new \DateTimeZone( $member_timezone ) );
				$block_end   = new \DateTime( $start_date_formatted . ' ' . $time_block['end'], new \DateTimeZone( $member_timezone ) );

				// Convert to UTC for comparison
				$block_start->setTimezone( new \DateTimeZone( 'UTC' ) );
				$block_end->setTimezone( new \DateTimeZone( 'UTC' ) );

				if ( $day_start >= $block_start && $day_end <= $block_end ) {
					return true;
				}
			}
			return false; // If override exists but no matching time block found
		}

		// Fall back to regular weekly hours
		$weekly_hours = $member_availability['weekly_hours'] ?? array();
		$day_of_week  = strtolower( date( 'l', $day_start->getTimestamp() ) );

		if ( isset( $weekly_hours[ $day_of_week ] ) && ! $weekly_hours[ $day_of_week ]['off'] ) {
			foreach ( $weekly_hours[ $day_of_week ]['times'] as $time_block ) {
				$block_start = new \DateTime( date( 'Y-m-d', $day_start->getTimestamp() ) . ' ' . $time_block['start'], new \DateTimeZone( $member_timezone ) );
				$block_end   = new \DateTime( date( 'Y-m-d', $day_start->getTimestamp() ) . ' ' . $time_block['end'], new \DateTimeZone( $member_timezone ) );

				// Convert to UTC for comparison
				$block_start->setTimezone( new \DateTimeZone( 'UTC' ) );
				$block_end->setTimezone( new \DateTimeZone( 'UTC' ) );

				if ( $day_start >= $block_start && $day_end <= $block_end ) {
					return true;
				}
			}
		}

		return false; // Member is not available during this time
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
