<?php
/**
 * REST API class.
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Integration\REST_API;

use QuillBooking\Integration\Integration;

/**
 * REST class.
 *
 * @since 1.0.0
 */
class REST_API {

	/**
	 * Integration
	 *
	 * @var Integration
	 */
	protected $integration;

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		// 'integration_controller' => REST_Integration_Controller::class,
		// 'account_controller'     => REST_Accounts_Controller::class,
	);

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration integration.
	 */
	public function __construct( $integration ) {
		$this->integration = $integration;
		if ( ! empty( static::$classes['integration_controller'] ) ) {
			new static::$classes['integration_controller']( $this->integration );
		}

		if ( ! empty( static::$classes['account_controller'] ) ) {
			new static::$classes['account_controller']( $this->integration );
		} else {
			new REST_Account_Controller( $this->integration );
		}
	}
}
