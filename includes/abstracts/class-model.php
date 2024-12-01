<?php
/**
 * Class Model
 * This class is responsible for handling the model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Abstracts;

use WeDevs\ORM\Eloquent\Model as WeDevsModel;
use Illuminate\Translation\Translator;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Validation\Factory as ValidatorFactory;

/**
 * Model class
 */
class Model extends WeDevsModel {

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array();

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array();

	/**
	 * Overide parent method to make sure prefixing is correct.
	 *
	 * @return string
	 */
	public function getTable() {
		global $wpdb;

		if ( strpos( $this->table, $wpdb->prefix ) === 0 ) {
			return $this->table;
		}

		return $wpdb->prefix . $this->table;
	}

	/**
	 * Define a many-to-many relationship.
	 *
	 * @param  string $related
	 * @param  string $table
	 * @param  string $foreignPivotKey
	 * @param  string $relatedPivotKey
	 * @param  string $parentKey
	 * @param  string $relatedKey
	 * @param  string $relation
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function belongsToMany( $related, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null ) {
		global $wpdb;

		if ( strpos( $table, $wpdb->prefix ) === 0 ) {
			return parent::belongsToMany( $related, $table, $foreignPivotKey, $relatedPivotKey, $parentKey, $relatedKey, $relation );
		}

		return parent::belongsToMany( $related, $wpdb->prefix . $table, $foreignPivotKey, $relatedPivotKey, $parentKey, $relatedKey, $relation );
	}

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		if ( empty( $this->rules ) ) {
			return parent::save( $options );
		}

		// Trim all the values
		$this->trim();

		$validator = $this->validator()->make(
			$this->toArray(),
			$this->rules,
			$this->messages
		);

		if ( $validator->fails() ) {
			throw new \Exception( $validator->errors()->first() );
		}

		// Call the parent save method to perform the actual saving
		return parent::save( $options );
	}

	/**
	 * Trim all the values
	 *
	 * @return void
	 */
	public function trim() {
		array_walk_recursive(
			$this->attributes,
			function( &$value ) {
				if ( is_string( $value ) ) {
					$value = trim( $value );
				}
			}
		);
	}

	/**
	 * Get the validator instance
	 *
	 * @return \Illuminate\Validation\Factory
	 */
	public function validator() {
		$translator = new Translator( new ArrayLoader(), 'en' );
		$validator  = new ValidatorFactory( $translator );

		return $validator;
	}
}
