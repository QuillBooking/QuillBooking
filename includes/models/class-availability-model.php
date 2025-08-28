<?php
/**
 * Class Availability_Model
 *
 * This class is responsible for handling the availability model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;
use Illuminate\Support\Arr;

/**
 * Availability Model class
 */
class Availability_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_availability';

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
		'user_id',
		'name',
		'value',
		'timezone',
		'is_default',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'user_id'    => 'integer',
		'timezone'   => 'string',
		'is_default' => 'boolean',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'user_id'    => 'required|integer',
		'name'       => 'required',
		'value'      => 'required',
		'timezone'   => 'required',
		'is_default' => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'user_id.required'    => 'User ID is required.',
		'user_id.integer'     => 'User ID must be an integer.',
		'name.required'       => 'Name is required.',
		'value.required'      => 'Value is required.',
		'timezone.required'   => 'Timezone is required.',
		'is_default.required' => 'Is default is required.',
	);

	/**
	 * Relationship with user
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'id' );
	}

	/**
	 * Relationship with events
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function events() {
		return $this->hasMany( Event_Model::class, 'availability_id', 'id' );
	}

	public function getValueAttribute() {
		return $this->attributes['value'] ? maybe_unserialize( $this->attributes['value'] ) : array();
	}

	/**
	 * Get the parsed value data
	 *
	 * @return array
	 */
	public function getValueDataAttribute() {
		// Access raw attribute directly to avoid loops
		$raw_value = $this->attributes['value'] ?? '';
		
		if ( empty( $raw_value ) ) {
			return array();
		}
		
		$unserialized = maybe_unserialize( $raw_value );
		return is_array( $unserialized ) ? $unserialized : array();
	}


	/**
	 * Get weekly hours from value data
	 *
	 * @return array
	 */
	public function getWeeklyHoursAttribute() {
		$value_data = $this->getValueDataAttribute();
		return Arr::get( $value_data, 'weekly_hours', array() );
	}

	/**
	 * Get override data from value data
	 *
	 * @return array
	 */
	public function getOverrideAttribute() {
		$value_data = $this->getValueDataAttribute();
		return Arr::get( $value_data, 'override', array() );
	}

	/**
	 * Set weekly hours in value data
	 *
	 * @param array $weekly_hours
	 */
	public function setWeeklyHours( $weekly_hours ) {
		$value_data                 = $this->getValueDataAttribute();
		$value_data['weekly_hours'] = $weekly_hours;
		$this->value                = $value_data ;
	}

	/**
	 * Set override data in value data
	 *
	 * @param array $override
	 */
	public function setOverride( $override ) {
		$value_data             = $this->getValueDataAttribute();
		$value_data['override'] = $override;
		$this->value            = $value_data;
	}

	/**
	 * Get default availability structure
	 *
	 * @return array
	 */
	public static function getDefaultAvailability() {
		return array(
			'name'  => __( 'Default', 'quill-booking' ),
			'value' => array(
				'weekly_hours' => array(
					'monday'    => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => false,
					),
					'tuesday'   => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => false,
					),
					'wednesday' => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => false,
					),
					'thursday'  => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => false,
					),
					'friday'    => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => false,
					),
					'saturday'  => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => true,
					),
					'sunday'    => array(
						'times' => array(
							array(
								'start' => '09:00',
								'end'   => '17:00',
							),
						),
						'off'   => true,
					),
				),
				'override'     => (object) array(), // Ensures it's treated as an object/associative array
			),
		);
	}


	/**
	 * Create default availability for a user
	 *
	 * @param int $user_id
	 * @return self
	 */
	public static function createDefaultForUser( $user_id ) {
		$default_data = self::getDefaultAvailability();

		$availability_data = array(
			'user_id'    => $user_id,
			'name'       => $default_data['name'],
			'value'      =>
				array(
					'weekly_hours' => $default_data['weekly_hours'],
					'override'     => $default_data['override'],
				),
			'timezone'   => 'UTC',
			'is_default' => true,
		);

		return self::create( $availability_data );
	}

	/**
	 * Get user's default availability
	 *
	 * @param int $user_id
	 * @return self|null
	 */
	public static function getUserDefault( $user_id ) {
		return self::where( 'user_id', $user_id )
		->where( 'is_default', true )
		->first();
	}

	/**
	 * Get user's default availability
	 *
	 * @param int $user_id
	 * @return self|null
	 */
	public static function getUserDefaultAvailabilityId( $user_id ) {
		$default_availability = self::getUserDefault( $user_id );
		return $default_availability ? $default_availability->id : null;
	}

	/**
	 * Get all availabilities for a user
	 *
	 * @param int $user_id
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public static function getUserAvailabilities( $user_id ) {
		return self::where( 'user_id', $user_id )->get();
	}

	/**
	 * Convert model to array format for backward compatibility
	 *
	 * @return array
	 */
	public function toCompatibleArray() {
		$value_data = $this->getValueDataAttribute();

		return array(
			'id'           => $this->id,
			'user_id'      => $this->user_id,
			'name'         => $this->name,
			'weekly_hours' => Arr::get( $value_data, 'weekly_hours', array() ),
			'override'     => Arr::get( $value_data, 'override', array() ),
			'timezone'     => $this->timezone,
			'is_default'   => $this->is_default,
			'created_at'   => $this->created_at,
			'updated_at'   => $this->updated_at,
		);
	}
}
