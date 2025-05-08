<?php
/**
 * Twilio Calendar / Meet Integration
 *
 * This class is responsible for handling the Twilio Calendar / Meet Integration
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Twilio;

use Illuminate\Support\Arr;
use QuillBooking\Integration\Integration as Abstract_Integration;
use QuillBooking\Integrations\Twilio\REST_API\REST_API;

/**
 * Twilio Integration class
 */
class Integration extends Abstract_Integration {

	/**
	 * Integration Name
	 *
	 * @var string
	 */
	public $name = 'Twilio';

	/**
	 * Integration Slug
	 *
	 * @var string
	 */
	public $slug = 'twilio';

	/**
	 * Integration Description
	 *
	 * @var string
	 */
	public $description = 'Twilio Integration';

	/**
	 * API
	 *
	 * @var API
	 */
	public $api;

	/**
	 * Is calendar integration
	 *
	 * @var bool
	 */
	public $is_calendar = false;

	/**
	 * Is Global Integration
	 *
	 * @var bool
	 */
	public $is_global = true;

	/**
	 * Classes
	 *
	 * @var array
	 */
	public static $classes = array(
		'rest_api' => REST_API::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct();
		// new Notifications( $this );
	}

	/**
	 * Connect the integration
	 *
	 * @since 1.0.0
	 *
	 * @param int $host_id Host ID.
	 * @param int $account_id Account ID.
	 *
	 * @return bool|API
	 */
	public function connect( $host_id, $account_id ) {
		parent::connect( $host_id, $account_id );
		$account         = $this->accounts->get_account( $account_id );
		$sms_number      = Arr::get( $account, 'credentials.sms_number' );
		$whatsapp_number = Arr::get( $account, 'credentials.whatsapp_number' );
		$account_sid     = Arr::get( $account, 'credentials.account_sid' );
		$auth_token      = Arr::get( $account, 'credentials.auth_token' );

		if ( empty( $sms_number ) || empty( $account_sid ) || empty( $auth_token ) ) {
			return new \WP_Error( 'no_credentials', esc_html__( 'No credentials found!', 'quillbooking' ) );
		}

		$this->api = new API( $sms_number, $whatsapp_number, $account_sid, $auth_token );

		return $this->api;
	}
}
