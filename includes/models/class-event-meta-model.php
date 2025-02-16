<?php
/**
 * Class Event Meta Model
 *
 * This class is responsible for handling the event meta model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;

/**
 * Event Meta Model class
 */
class Event_Meta_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_events_meta';

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
		'event_id',
		'meta_key',
		'meta_value',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'event_id' => 'integer',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'event_id' => 'required|integer',
		'meta_key' => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'event_id.required' => 'Event ID is required',
		'event_id.integer'  => 'Event ID must be an integer',
		'meta_key.required' => 'Meta key is required',
	);

	/**
	 * Relationship with event
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function event() {
		return $this->belongsTo( Event_Model::class, 'event_id', 'id' );
	}
}
