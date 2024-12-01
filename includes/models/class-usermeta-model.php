<?php
/**
 * Class User_Meta_Model
 *
 * This class is responsible for handling the user meta model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use QuillBooking\Abstracts\Model;

/**
 * User_Meta_Model class
 */
class UserMeta_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'usermeta';

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
