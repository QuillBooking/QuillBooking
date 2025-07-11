<?php
/**
 * Class Calendar_Model
 *
 * This class is responsible for handling the calendar model
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
use QuillBooking\Capabilities;
use QuillBooking\Managers\Integrations_Manager;

/**
 * Calendar Model class
 */
class Calendar_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_calendars';

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
		'user_id',
		'name',
		'description',
		'slug',
		'status',
		'type',
	);

	/**
	 * Appends
	 *
	 * @var array
	 */
	protected $appends = array( 'timezone', 'avatar', 'featured_image' );

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'user_id' => 'integer',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'user_id' => 'required|integer',
		'name'    => 'required|string',
		'type'    => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'user_id.required' => 'Calendar user is required',
		'user_id.integer'  => 'Calendar user must be an integer',
		'name.required'    => 'Calendar name is required',
		'name.string'      => 'Calendar name must be a string',
		'type.required'    => 'Calendar type is required',
	);

	/**
	 * Relations with booking
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function bookings() {
		return $this->hasMany( Booking_Model::class, 'calendar_id' );
	}

	/**
	 * Meta
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function meta() {
		return $this->hasMany( Calendar_Meta_Model::class, 'calendar_id' );
	}

	/**
	 * Events
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function events() {
		return $this->hasMany( Event_Model::class, 'calendar_id' );
	}

	/**
	 * User
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'ID' );
	}

	/**
	 * Get the timezone meta value.
	 *
	 * @return string|null
	 */
	public function getTimezoneAttribute() {
		$value = $this->meta()->where( 'meta_key', 'timezone' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
	}

	/**
	 * Set the timezone meta value.
	 *
	 * @param string $value
	 * @return void
	 */
	public function setTimezoneAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'timezone',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Get the avatar meta value.
	 *
	 * @return string|null
	 */
	public function getAvatarAttribute() {
		$value = $this->get_meta( 'avatar' );

		return $value;
	}

	/**
	 * Set the avatar meta value.
	 *
	 * @param string $value
	 * @return void
	 */
	public function setAvatarAttribute( $value ) {
		$this->update_meta( 'avatar', $value );
	}

	/**
	 * Get the featured image meta value.
	 *
	 * @return string|null
	 */
	public function getFeaturedImageAttribute() {
		$value = $this->get_meta( 'featured_image' );

		return $value;
	}

	/**
	 * Set the featured image meta value.
	 *
	 * @param string $value
	 * @return void
	 */
	public function setFeaturedImageAttribute( $value ) {
		$this->update_meta( 'featured_image', $value );
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
		$meta = $this->meta()->where( 'meta_key', $key )->firstOrNew(
			array(
				'meta_key' => $key,
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Sync team members
	 *
	 * @param array $memberIds
	 * @return void
	 */
	public function syncTeamMembers( array $memberIds ) {
		$existingMeta = $this->meta()->where( 'meta_key', 'team_members' )->first();

		if ( ! $existingMeta ) {
			$this->meta()->create(
				array(
					'meta_key'   => 'team_members',
					'meta_value' => maybe_serialize( $memberIds ),
				)
			);
		} else {
			$existingTeamMembers = maybe_unserialize( $existingMeta->meta_value );
			$updatedTeamMembers  = array_unique( array_merge( $existingTeamMembers, $memberIds ) );

			$existingMeta->update(
				array(
					'meta_value' => maybe_serialize( $updatedTeamMembers ),
				)
			);
		}
	}

	/**
	 * Get team members
	 *
	 * @return array
	 */
	public function getTeamMembers() {
		$teamMembers = array();

		$teamMembersMeta = $this->meta()->where( 'meta_key', 'team_members' )->first();

		if ( $teamMembersMeta ) {
			$teamMembers = maybe_unserialize( $teamMembersMeta->meta_value );
		}

		return $teamMembers;
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
			function ( $calendar ) {
				$calendar->hash_id = Utils::generate_hash_key();
				$originalSlug      = $slug = Str::slug( $calendar->name );
				$count             = 1;

				while ( static::where( 'slug', $slug )->exists() ) {
					$slug = $originalSlug . '-' . $count++;
				}

				$calendar->slug   = $slug;
				$calendar->status = 'active';

				if ( 'host' === $calendar->type ) {
					$user = new \WP_User( $calendar->user_id );
					if ( ! $user->exists() ) {
						return false;
					}

					$capabilities = Capabilities::get_basic_capabilities();
					foreach ( $capabilities as $capability ) {
						$user->add_cap( $capability );
					}

					update_user_meta( $calendar->user_id, 'quillbooking_team_member', 'yes' );
				}
			}
		);

		static::retrieved(
			function ( $calendar ) {
				if ( 'team' === $calendar->type ) {
					$calendar->team_members = $calendar->getTeamMembers();
				}
			}
		);

		static::deleting(
			function ( $calendar ) {
				$calendar->meta()->delete();
				$calendar->bookings()->delete();

				$calendar->events()->each(
					function ( $event ) {
						$event->delete();
					}
				);
			}
		);
	}
}
