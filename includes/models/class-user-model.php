<?php
/**
 * Class User_Model
 *
 * This class is responsible for handling the user model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;
use QuillBooking\Capabilities;
use Illuminate\Support\Arr;

/**
 * User_Model class
 */
class User_Model extends Model {

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'ID';

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'user_login',
		'user_pass',
		'user_nicename',
		'user_email',
		'user_url',
		'user_registered',
		'user_activation_key',
		'user_status',
		'display_name',
	);

	/**
	 * Attributes that should be hidden for arrays and JSON.
	 *
	 * @var array
	 */
	protected $visible = array(
		'ID',
		'user_login',
		'user_email',
		'display_name',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'ID' => 'integer',
	);

	/**
	 * Constructor - Set the correct table name for WordPress multisite
	 *
	 * @since 1.0.0
	 */
	public function __construct( array $attributes = array() ) {
		global $wpdb;

		// Use WordPress's users table (shared across multisite)
		$this->table = $wpdb->users;

		parent::__construct( $attributes );
	}

	/**
	 * Get the table associated with the model.
	 *
	 * @return string
	 */
	public function getTable() {
		global $wpdb;

		// Always return the WordPress users table
		return $wpdb->users;
	}

	/**
	 * Relationship with user meta
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function meta() {
		return $this->hasMany( UserMeta_Model::class, 'user_id', 'ID' );
	}

	/**
	 * Relationship with availability
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function availability() {
		return $this->hasMany( Availability_Model::class, 'user_id', 'ID' );
	}
}
