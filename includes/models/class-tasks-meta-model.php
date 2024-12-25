<?php
/**
 * Class Tasks_Meta_Model
 *
 * This class is responsible for handling tasks meta model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use QuillBooking\Abstracts\Model;

/**
 * Class Tasks_Meta_Model
 */
class Tasks_Meta_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 */
	protected $table = 'quillbooking_tasks_meta';

	/**
	 * Primary key
	 *
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns
	 *
	 * @var array
	 */
	protected $fillable = array(
		'action_id',
		'hook',
		'group',
		'value',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'action_id' => 'integer',
	);

	/**
	 * Timestamps
	 *
	 * @var boolean
	 */
	public $timestamps = true;
}


