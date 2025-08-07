<?php

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;
class Booking_Hosts_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_booking_hosts';

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
		'id',
		'booking_id',
		'user_id',
		'status',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'booking_id' => 'integer',
		'user_id'    => 'integer',
		'status'     => 'string',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'booking_id' => 'required|integer',
		'user_id'    => 'required|integer',
		'status'     => 'required|string',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'booking_id.required' => 'Booking ID is required',
		'booking_id.integer'  => 'Booking ID must be an integer',
		'user_id.required'    => 'User ID is required',
		'user_id.integer'     => 'User ID must be an integer',
		'status.required'     => 'Status is required',
		'status.string'       => 'Status must be a string',
	);


	/**
	 * Relationship with booking
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function booking() {
		return $this->belongsTo( Booking_Model::class, 'booking_id', 'id' );
	}

	/**
	 * Relationship with user
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'id' );
	}
}
