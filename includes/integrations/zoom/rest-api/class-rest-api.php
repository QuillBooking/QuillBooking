<?php
/**
 * REST API class.
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Zoom\REST_API;

use QuillBooking\Integration\REST_API\REST_API as Abstract_REST_API;
use QuillBooking\Integrations\Zoom\Integration;

/**
 * REST class.
 *
 * @since 1.0.0
 */
class REST_API extends Abstract_REST_API {

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
		'integration_controller' => REST_Integration_Controller::class,
	);
}
