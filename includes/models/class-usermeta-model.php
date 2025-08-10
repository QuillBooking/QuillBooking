<?php
/**
 * Class UserMeta_Model
 *
 * This class is responsible for handling the user meta model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;

/**
 * UserMeta_Model class
 */
class UserMeta_Model extends Model {

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'umeta_id';

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'user_id',
		'meta_key',
		'meta_value',
	);

	/**
	 * Constructor - Set the correct table name for WordPress multisite
	 *
	 * @since 1.0.0
	 */
	public function __construct(array $attributes = []) {
		global $wpdb;
		
		// Use WordPress's usermeta table (shared across multisite)
		$this->table = $wpdb->usermeta;
		
		parent::__construct($attributes);
	}

	/**
	 * Get the table associated with the model.
	 *
	 * @return string
	 */
	public function getTable() {
		global $wpdb;
		
		// Always return the WordPress usermeta table
		return $wpdb->usermeta;
	}

	/**
	 * Relationship with user
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'ID' );
	}
}
