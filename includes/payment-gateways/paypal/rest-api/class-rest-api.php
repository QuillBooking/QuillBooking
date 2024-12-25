<?php
/**
 * REST API class.
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Paypal\REST_API;

use QuillBooking\Payment_Gateway\REST_API\REST_API as Abstract_REST_API;

/**
 * REST class.
 *
 * @since 1.0.0
 */
class REST_API extends Abstract_REST_API {

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		'settings_controller' => REST_Settings_Controller::class,
	);
}
