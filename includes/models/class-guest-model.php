<?php
/**
 * Class Guest_Model
 *
 * This class is responsible for handling the guest model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use QuillBooking\Abstracts\Model;

/**
 * Guest Model class
 */
class Guest_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_guests';

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
	 * Fillable fields
	 *
	 * @var array
	 */
	protected $fillable = array(
		'booking_id',
		'user_id',
		'email',
		'name',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'booking_id' => 'integer',
		'user_id'    => 'integer',
		'email'      => 'required|email',
		'name'       => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'booking_id.integer' => 'Booking ID must be an integer',
		'user_id.integer'    => 'User ID must be an integer',
		'email.required'     => 'Guest email is required',
		'email.email'        => 'Guest email is invalid',
		'name.required'      => 'Your name is required',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'booking_id' => 'int',
		'user_id'    => 'int',
	);

	/**
	 * Relationships with Booking
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function booking() {
		return $this->belongsTo( Booking_Model::class, 'booking_id', 'id' );
	}

	/**
	 * Relationships with User
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'id' );
	}
}
