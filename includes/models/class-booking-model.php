<?php
/**
 * Class Booking_Model
 *
 * This class is responsible for handling the booking model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;
use QuillBooking\Utils;
use Illuminate\Support\Arr;

/**
 * Booking Model class
 */
class Booking_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_bookings';

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
		'event_id',
		'calendar_id',
		'guest_id',
		'start_time',
		'end_time',
		'slot_time',
		'source',
		'status',
		'cancelled_by',
		'event_url',
	);

	/**
	 * Appends
	 *
	 * @var array
	 */
	protected $appends = array( 'timezone', 'fields', 'location' );

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'event_id'     => 'integer',
		'guest_id'     => 'integer',
		'slot_time'    => 'integer',
		'calendar_id'  => 'integer',
		'cancelled_by' => 'array',
	);

	/**
	 * Validation rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'event_id'    => 'required|integer',
		'calendar_id' => 'required|integer',
		'guest_id'    => 'required|integer',
		'start_time'  => 'required|date_format:Y-m-d H:i:s',
		'end_time'    => 'required|date_format:Y-m-d H:i:s',
		'slot_time'   => 'required|integer',
	);

	/**
	 * Custom validation messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'event_id.required'      => 'The event ID is required.',
		'event_id.integer'       => 'The event ID must be a valid integer.',
		'guest_id.required'      => 'The guest ID is required.',
		'guest_id.integer'       => 'The guest ID must be a valid integer.',
		'start_time.required'    => 'The start time is required.',
		'start_time.date_format' => 'The start time must be in the format Y-m-d H:i:s.',
		'end_time.required'      => 'The end time is required.',
		'end_time.date_format'   => 'The end time must be in the format Y-m-d H:i:s.',
		'slot_time.required'     => 'The slot time is required.',
		'slot_time.integer'      => 'The slot time must be an integer.',
	);

	/**
	 * Relationship with calendar
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function calendar() {
		return $this->belongsTo( Calendar_Model::class, 'calendar_id', 'id' );
	}

	/**
	 * Relationship with event
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function event() {
		return $this->belongsTo( Event_Model::class, 'event_id', 'id' );
	}

	/**
	 * Relationship with guest
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function guest() {
		return $this->belongsTo( Guest_Model::class, 'guest_id', 'id' );
	}

	/**
	 * Relationship with booking meta
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function meta() {
		return $this->hasMany( Booking_Meta_Model::class, 'booking_id', 'id' );
	}

	/**
	 * Relationship with logs
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function logs() {
		return $this->hasMany( Booking_Log_Model::class, 'booking_id', 'id' );
	}

	/**
	 * Orders
	 *
	 * @param \Illuminate\Database\Eloquent\Relations\HasOne
	 */
	public function order() {
		return $this->hasOne( Booking_Order_Model::class, 'booking_id', 'id' );
	}

	/**
	 * Change status
	 *
	 * @param string $status Status.
	 *
	 * @return void
	 */
	public function changeStatus( $status ) {
		$this->status = $status;
		$this->save();
	}

	/**
	 * Get by hash ID
	 *
	 * @param string $hash_id Hash ID.
	 *
	 * @return Booking_Model
	 */
	public static function getByHashId( $hash_id ) {
		$booking = self::where( 'hash_id', $hash_id )->with( 'event', 'guest' )->first();
		if ( ! $booking ) {
			return null;
		}

		return $booking;
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
	 * Get the fields meta value.
	 *
	 * @return string|null
	 */
	public function getFieldsAttribute() {
		$value = $this->meta()->where( 'meta_key', 'fields' )->value( 'meta_value' );

		return $value ? maybe_unserialize( $value ) : null;
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
	 * Get Event timezone attribute
	 *
	 * @return string|null
	 */
	public function getEventTimezoneAttribute() {
		return $this->event->timezone;
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
	 * Get booking location
	 *
	 * @return string
	 */
	public function getLocationAttribute() {
		$location = $this->meta()->where( 'meta_key', 'location' )->value( 'meta_value' );

		return $location ? maybe_unserialize( $location ) : null;
	}

	/**
	 * Set the location meta value.
	 *
	 * @param string $value
	 * @return void
	 */
	public function setLocationAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'location',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Set the fields meta value.
	 *
	 * @param array $value
	 * @return void
	 */
	public function setFieldsAttribute( $value ) {
		$meta = $this->meta()->firstOrNew(
			array(
				'meta_key' => 'fields',
			)
		);

		$meta->meta_value = maybe_serialize( $value );
		$meta->save();
	}

	/**
	 * Is completed
	 *
	 * @return bool
	 */
	public function isCompleted() {
		$end_time = new \DateTime( $this->end_time, new \DateTimeZone( $this->timezone ) );
		$now      = new \DateTime( 'now', new \DateTimeZone( $this->timezone ) );

		return $end_time < $now;
	}

	/**
	 * Is cancelled
	 *
	 * @return bool
	 */
	public function isCancelled() {
		return 'cancelled' === $this->status;
	}

	/**
	 * Get cancel URL
	 *
	 * @return string
	 */
	public function getCancelUrl() {
		return add_query_arg(
			array(
				'quillbooking_action' => 'cancel',
				'id'                  => $this->hash_id,
			),
			$this->event_url
		);
	}

	/**
	 * Get reschedule URL
	 *
	 * @return string
	 */
	public function getRescheduleUrl() {
		return add_query_arg(
			array(
				'quillbooking_action' => 'reschedule',
				'id'                  => $this->hash_id,
			),
			$this->event_url
		);
	}

	/**
	 * Get Details URL
	 *
	 * @return string
	 */
	public function getDetailsUrl() {
		return admin_url( 'admin.php?page=quillbooking&path=bookings&id=' . $this->id );
	}

	/**
	 * Get confirmation URL
	 *
	 * @return string
	 */
	public function getConfirmUrl() {
		return add_query_arg(
			array(
				'quillbooking_action' => 'confirm',
				'id'                  => $this->hash_id,
			),
			$this->event_url
		);
	}

	/**
	 * Get reject URL
	 *
	 * @return string
	 */
	public function getRejectUrl() {
		return add_query_arg(
			array(
				'quillbooking_action' => 'reject',
				'id'                  => $this->hash_id,
			),
			$this->event_url
		);
	}

	/**
	 * Check if payment is required for this booking
	 * 
	 * @return bool
	 */
	public function requiresPayment() {
		if (!$this->event) {
			return false;
		}
		
		return $this->event->requirePayment();
	}
	
	/**
	 * Get payment status
	 * 
	 * @return string
	 */
	public function getPaymentStatus() {
		return $this->get_meta('payment_status', 'pending');
	}
	
	/**
	 * Set payment status
	 * 
	 * @param string $status
	 * @return void
	 */
	public function setPaymentStatus($status) {
		$this->update_meta('payment_status', $status);
		
		if ($status === 'completed') {
			$this->status = 'scheduled';
			$this->save();
			
			$this->logs()->create(
				array(
					'type'    => 'info',
					'message' => __('Payment completed', 'quillbooking'),
					'details' => __('Payment has been successfully processed', 'quillbooking'),
				)
			);
			
			do_action('quillbooking_booking_payment_completed', $this);
		}
	}
	
	/**
	 * Get payment amount
	 * 
	 * @return float
	 */
	public function getPaymentAmount() {
		return (float) $this->get_meta('payment_amount', 0);
	}
	
	/**
	 * Get payment currency
	 * 
	 * @return string
	 */
	public function getPaymentCurrency() {
		return $this->get_meta('payment_currency', 'USD');
	}

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		// Check if event exists
		$event = Event_Model::find( $this->event_id );
		if ( ! $event ) {
			throw new \Exception( __( 'Event does not exist', 'quillbooking' ) );
		}

		return parent::save( $options );
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
			function ( $booking ) {
				$booking->hash_id = Utils::generate_hash_key();
				if ( ! $booking->status ) {
					$booking->status = 'scheduled';
				}
			}
		);

		static::deleted(
			function ( $booking ) {
				do_action( 'quillbooking_booking_cancelled', $booking );
				$booking->meta()->delete();
				$booking->logs()->delete();
				$booking->guest()->delete();
			}
		);
	}
}
