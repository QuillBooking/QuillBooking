<?php
/**
 * Class Tasks
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking;

use Throwable;
use QuillBooking\Models\Tasks_Meta_Model;

/**
 * Tasks class
 */
class Tasks {

	/**
	 * Group
	 *
	 * @since 1.5.0
	 *
	 * @var string
	 */
	private $group;

	/**
	 * Initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Constructor.
	 *
	 * @since 1.5.0
	 *
	 * @param string $group Group.
	 */
	public function __construct( $group ) {
		if ( ! self::$initialized ) {
			self::initialize();
		}

		$this->group = $group;
	}

	/**
	 * Initialize
	 *
	 * @return void
	 */
	private static function initialize() {
		self::$initialized = true;
		add_action(
			'action_scheduler_deleted_action',
			function( $action_id ) {
				self::delete_meta( array( 'action_id' => $action_id ) );
			}
		);
	}

	/**
	 * Get the next timestamp for a scheduled action
	 *
	 * @since 1.6.0
	 *
	 * @param string     $hook Hook name.
	 * @param array|null $args Args passed to hook.
	 * @return integer|false False if not scheduled
	 */
	public function get_next_timestamp( $hook, $args = null ) {
		return as_next_scheduled_action( "{$this->group}_$hook", $args, $this->group );
	}

	/**
	 * Enqueue async task
	 * Must be called after 'init' action
	 *
	 * @param string $hook Hook name.
	 * @param array  ...$args Args passed to hook.
	 * @return integer|false
	 */
	public function enqueue_async( $hook, ...$args ) {
		// add args meta.
		$meta_id = $this->add_meta( "{$this->group}_$hook", $args );
		if ( ! $meta_id ) {
			return false;
		}

		// add action.
		$action_id = as_enqueue_async_action( "{$this->group}_$hook", compact( 'meta_id' ), $this->group );
		if ( ! $action_id ) {
			return false;
		}

		// assign action to meta.
		$this->update_meta( $meta_id, array( 'action_id' => $action_id ), '%d' );

		return $action_id;
	}

	/**
	 * Schedule recurring task
	 *
	 * @since 1.6.0
	 *
	 * @param integer $timestamp Timestamp of run.
	 * @param string  $hook Hook name.
	 * @param array   ...$args Args passed to hook.
	 * @return integer|false
	 */
	public function schedule_single( $timestamp, $hook, ...$args ) {
		// add args meta.
		$meta_id = $this->add_meta( "{$this->group}_$hook", $args );
		if ( ! $meta_id ) {
			return false;
		}

		// add action.
		$action_id = as_schedule_single_action( $timestamp, "{$this->group}_$hook", compact( 'meta_id' ), $this->group );
		if ( ! $action_id ) {
			return false;
		}

		// assign action to meta.
		$this->update_meta( $meta_id, array( 'action_id' => $action_id ), '%d' );

		return $action_id;
	}

	/**
	 * Schedule recurring task
	 *
	 * @since 1.6.0
	 *
	 * @param integer $timestamp Timestamp of first run.
	 * @param integer $interval Interval in seconds.
	 * @param string  $hook Hook name.
	 * @param array   ...$args Args passed to hook.
	 * @return integer|false
	 */
	public function schedule_recurring( $timestamp, $interval, $hook, ...$args ) {
		// add args meta.
		$meta_id = $this->add_meta( "{$this->group}_$hook", $args );
		if ( ! $meta_id ) {
			return false;
		}

		// the action id isn't single, so we won't assign it to the meta.
		return as_schedule_recurring_action( $timestamp, $interval, "{$this->group}_$hook", compact( 'meta_id' ), $this->group );
	}

	/**
	 * Register callback
	 *
	 * @param string   $hook Hook name.
	 * @param callable $callback The callback to be run when the action is called.
	 * @return void
	 */
	public function register_callback( $hook, $callback ) {
		add_action(
			"{$this->group}_$hook",
			function( $meta_id ) use ( $hook, $callback ) {
				$meta = $this->get_meta( $meta_id );
				if ( ! isset( $meta['value'] ) ) {
					return;
				}
				try {
					call_user_func_array( $callback, $meta['value'] );
				} catch ( Throwable $e ) {
					return;
				}
			}
		);
	}

	/**
	 * Add meta
	 *
	 * @param string $hook Hook.
	 * @param mixed  $value Value.
	 * @return integer|false
	 */
	private function add_meta( $hook, $value ) {
		$insert = Tasks_Meta_Model::create(
			array(
				'hook'       => $hook,
				'group_slug' => $this->group,
				'value'      => maybe_serialize( $value ),
			)
		);

		if ( ! $insert ) {
			return false;
		}

		return $insert->id;
	}

	/**
	 * Update meta
	 *
	 * @param integer $id Meta id.
	 * @param array   $data Data to be updated.
	 * @return boolean
	 */
	private function update_meta( $id, $data ) {
		$update = Tasks_Meta_Model::where( 'id', $id )->update( $data );

		return (bool) $update;
	}

	/**
	 * Get meta
	 *
	 * @param integer $id Meta id.
	 * @return array
	 */
	private function get_meta( $id ) {
		$meta = Tasks_Meta_Model::find( $id );

		if ( ! $meta ) {
			return array();
		}

		return array(
			'value' => maybe_unserialize( $meta->value ),
		);
	}

	/**
	 * Delete meta
	 *
	 * @param array $where Where.
	 * @return boolean
	 */
	private static function delete_meta( $where ) {
		$delete = Tasks_Meta_Model::find( $where );
		if ( ! $delete ) {
			return false;
		}

		return (bool) $delete->delete();
	}

}
