<?php
/**
 * Class REST Integration Account Controller
 *
 * This class is responsible for handling the Integration Account REST API
 *
 * @since 1.0.0
 */

namespace QuillBooking\Integrations\Google\REST_API;

use QuillBooking\Integration\REST_API\REST_Account_Controller as Abstract_REST_Account_Controller;

/**
 * Rest Integration Account Controller
 */
class REST_Account_Controller extends Abstract_REST_Account_Controller {

	/**
	 * Entities.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $entities = array(
		'calendars' => array(
			'callback' => 'fetch_calendars',
		),
	);
}
