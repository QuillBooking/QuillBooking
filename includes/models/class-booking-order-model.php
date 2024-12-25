<?php
/**
 * Class Booking_Order_Model
 *
 * This class is responsible for handling the booking_order model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use QuillBooking\Abstracts\Model;

/**
 * Booking Order Model class
 */
class Booking_Order_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_booking_orders';

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
		'items',
		'discount',
		'total',
		'currency',
		'payment_method',
		'status',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'booking_id' => 'integer',
		'discount'   => 'float',
		'total'      => 'float',
		'items'      => 'array',
	);

	/**
	 * Validation rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'booking_id'     => 'required|integer',
		'discount'       => 'numeric',
		'total'          => 'required',
		'currency'       => 'required',
		'payment_method' => 'required',
		'status'         => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'booking_id.required'     => 'Booking ID is required',
		'booking_id.integer'      => 'Booking ID must be an integer',
		'discount.numeric'        => 'Discount must be a number',
		'total.required'          => 'Total is required',
		'currency.required'       => 'Currency is required',
		'payment_method.required' => 'Payment method is required',
		'status.required'         => 'Status is required',
	);

	/**
	 * Booking
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function booking() {
		return $this->belongsTo( 'QuillBooking\Models\Booking_Model', 'booking_id', 'id' );
	}
}
