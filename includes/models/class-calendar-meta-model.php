<?php
/**
 * Class Calendar_Meta_Modal
 *
 * This class is responsible for handling the calendar meta model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use WPEloquent\Eloquent\Model;

/**
 * Calendar Meta Model class
 */
class Calendar_Meta_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_calendars_meta';

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
		'calendar_id',
		'meta_key',
		'meta_value',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'calendar_id' => 'integer',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'calendar_id' => 'required|integer',
		'meta_key'    => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'calendar_id.required' => 'Calendar ID is required.',
		'calendar_id.integer'  => 'Calendar ID must be an integer.',
		'meta_key.required'    => 'Meta key is required.',
	);

	/**
	 * Relationship with calendar
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function calendar() {
		return $this->belongsTo( Calendar_Model::class, 'calendar_id', 'id' );
	}
}
