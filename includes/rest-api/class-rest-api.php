<?php
/**
 * REST API: class REST_API
 *
 * @since 1.0.0
 * @package QuillBooking
 * @subpackage REST_API
 */

namespace QuillBooking\REST_API;

use QuillBooking\REST_API\Controllers\V1\REST_Calendar_Controller;
use QuillBooking\REST_API\Controllers\V1\REST_Team_Controller;
use QuillBooking\REST_API\Controllers\V1\REST_Event_Controller;
use QuillBooking\REST_API\Controllers\V1\REST_Booking_Controller;
use QuillBooking\REST_API\Controllers\v1\REST_Availability_Controller;
use QuillBooking\REST_API\Controllers\v1\REST_Settings_Controller;
use QuillBooking\Traits\Singleton;

/**
 * REST_API class is mainly responsible for registering routes.
 *
 * @since 1.0.0
 */
class REST_API {

	use Singleton;

	/**
	 * Cloning the singletone.
	 *
	 * @since 1.0.0
	 */
	private function __clone() {
	} /* do nothing */

	/**
	 * REST_API constructor.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register REST API routes
	 *
	 * @since 1.0.0
	 */
	public function register_rest_routes() {
		$controllers = array(
			REST_Calendar_Controller::class,
			REST_Team_Controller::class,
			REST_Event_Controller::class,
			REST_Booking_Controller::class,
			REST_Availability_Controller::class,
			REST_Settings_Controller::class,
		);

		foreach ( $controllers as $controller ) {
			$controller = new $controller();
			/** @var \QuillBooking\Abstracts\REST_Controller $controller */
			$controller->register_routes();
		}
	}
}
