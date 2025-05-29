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
	protected static $classes = array(
		'rest_api' => REST_API::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		 parent::__construct();

		// Set the host BEFORE logging or using it
		try {
			// Try different methods to set a default host
			if ( class_exists( '\QuillBooking\Models\Calendar_Model' ) ) {
				// Try to get the first available calendar
				$calendar = \QuillBooking\Models\Calendar_Model::first();
				if ( $calendar ) {
					$this->set_host( $calendar );
				}
			} elseif ( function_exists( '\get_current_blog_id' ) ) {
				$this->set_host( \get_current_blog_id() );
			}
		} catch ( \Exception $e ) {
		}

		// Only initialize notifications if host is properly set
		if ( isset( $this->host ) && is_object( $this->host ) && isset( $this->host->id ) ) {
			new Notifications( $this );
		}
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
		// If host_id is null, try to use the current host
		if ( ! $host_id && isset( $this->host ) && isset( $this->host->id ) ) {
			$host_id = $this->host->id;
		}

		// Try to connect via parent method
		$result = parent::connect( $host_id, $account_id );

		// If parent returned an error, return it
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Check if host was successfully set
		if ( ! isset( $this->host ) || ! $this->host ) {
			return new \WP_Error( 'no_host', \__( 'Host not found or not set!', 'quillbooking' ) );
		}

		// Get account credentials
		$account = $this->accounts->get_account( $account_id );
		if ( empty( $account ) ) {
			return new \WP_Error( 'no_account', \__( 'Account not found!', 'quillbooking' ) );
		}

		$sms_number      = Arr::get( $account, 'credentials.sms_number' );
		$whatsapp_number = Arr::get( $account, 'credentials.whatsapp_number' );
		$account_sid     = Arr::get( $account, 'credentials.account_sid' );
		$auth_token      = Arr::get( $account, 'credentials.auth_token' );

		if ( empty( $sms_number ) || empty( $account_sid ) || empty( $auth_token ) ) {
			return new \WP_Error( 'no_credentials', \__( 'No credentials found!', 'quillbooking' ) );
		}

		$this->api = new API( $sms_number, $whatsapp_number, $account_sid, $auth_token );

		return $this->api;
	}

	/**
	 * Delete settings
	 *
	 * @since 1.0.0
	 *
	 * @param string|int $account_id Account ID. If empty, deletes global settings.
	 * @return void
	 */
	public function delete_settings( $account_id = '' ) {
		if ( empty( $account_id ) ) {
			// Delete global settings
			delete_option( $this->option_name );
			return;
		}

		// Delete account-specific settings
		$this->accounts->delete_account( $account_id );
	}
}
