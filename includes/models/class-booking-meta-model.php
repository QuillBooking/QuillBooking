<?php
/**
 * Class Booking_Meta_Model
 *
 * This class is responsible for handling the booking meta model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;

/**
 * Booking Meta Model class
 */
class Booking_Meta_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_booking_meta';

	/**
	 * Primary key
	 *
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable attributes
	 *
	 * @var array
	 */
	protected $fillable = array(
		'booking_id',
		'meta_key',
		'meta_value',
	);

	/**
	 * Cast attributes
	 *
	 * @var array
	 */
	protected $casts = array(
		'booking_id' => 'int',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'booking_id' => 'required|integer',
		'meta_key'   => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'booking_id.required' => 'Booking ID is required',
		'booking_id.integer'  => 'Booking ID must be an integer',
		'meta_key.required'   => 'Meta key is required',
	);

	/**
	 * Relationship with booking
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function booking() {
		return $this->belongsTo( Booking_Model::class, 'booking_id', 'id' );
	}
}
