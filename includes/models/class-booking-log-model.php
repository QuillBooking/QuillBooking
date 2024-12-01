<?php
/**
 * Class Booking_Log_Model
 *
 * This class is responsible for handling the booking log model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use QuillBooking\Abstracts\Model;

/**
 * Booking Log Model class
 */
class Booking_Log_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_booking_log';

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
		'booking_id',
		'status',
		'type',
		'source',
		'message',
		'details',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'booking_id' => 'integer',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'booking_id' => 'required|integer',
		'status'     => 'required|string',
		'type'       => 'required|string',
		'source'     => 'string',
		'message'    => 'required|string',
		'details'    => 'string',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'booking_id.required' => 'Booking ID is required.',
		'booking_id.integer'  => 'Booking ID must be an integer.',
		'status.required'     => 'Status is required.',
		'status.string'       => 'Status must be a string.',
		'type.required'       => 'Type is required.',
		'type.string'         => 'Type must be a string.',
		'source.string'       => 'Source must be a string.',
		'message.required'    => 'Message is required.',
		'message.string'      => 'Message must be a string.',
		'details.string'      => 'Details must be a string.',
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
