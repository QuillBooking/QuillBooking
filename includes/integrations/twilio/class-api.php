<?php
/**
 * Twilio Meet Integration API
 *
 * This class is responsible for handling the Twilio Meet Integration API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Twilio;

use QuillBooking\Integration\API as Abstract_API;

/**
 * Twilio Integration API class
 */
class API extends Abstract_API {

	/**
	 * SMS Number
	 *
	 * @var string
	 */
	public $sms_number;

	/**
	 * WhatsApp Number
	 *
	 * @var string
	 */
	public $whatsapp_number;

	/**
	 * Account SID
	 *
	 * @var string
	 */
	public $account_sid;

	/**
	 * Auth Token
	 *
	 * @var string
	 */
	public $auth_token;

	/**
	 * Constructor
	 *
	 * @param string $sms_number SMS Number.
	 * @param string $whatsapp_number WhatsApp Number.
	 * @param string $account_sid Account SID.
	 * @param string $auth_token Auth Token.
	 * @since 1.0.0
	 */
	public function __construct( $sms_number, $whatsapp_number, $account_sid, $auth_token ) {
		$this->endpoint        = 'https://api.twilio.com/2010-04-01/Accounts';
		$this->sms_number      = $sms_number;
		$this->whatsapp_number = $whatsapp_number;
		$this->account_sid     = $account_sid;
		$this->auth_token      = $auth_token;
	}

	/**
	 * Get account info
	 *
	 * @return array
	 */
	public function get_account_info() {
		return $this->get( "{$this->account_sid}.json" );
	}

	/**
	 * Send SMS
	 *
	 * @param string $to To.
	 * @param string $message Message.
	 *
	 * @return array
	 */
	public function send_sms( $to, $message ) {
		return $this->post(
			"{$this->account_sid}/Messages.json",
			array(
				'From' => $this->sms_number,
				'To'   => $to,
				'Body' => $message,
			)
		);
	}

	/**
	 * Send WhatsApp Message
	 *
	 * @param string $to To.
	 * @param string $message Message.
	 *
	 * @return array
	 */
	public function send_whatsapp_message( $to, $message ) {
		return $this->post(
			"{$this->account_sid}/Messages.json",
			array(
				'From' => "whatsapp:{$this->whatsapp_number}",
				'To'   => "whatsapp:$to",
				'Body' => $message,
			)
		);
	}

	/**
	 * Send POST request to the api.
	 *
	 * @param string     $path Path.
	 * @param array|null $body Body.
	 * @return array
	 */
	public function post( $path, $body = array() ) {
		return $this->request( 'POST', $path, $body ? http_build_query( $body ) : null );
	}

	/**
	 * Send request to the api.
	 *
	 * @param string      $method Method.
	 * @param string      $path URL.
	 * @param string|null $body Body.
	 * @return array|WP_Error
	 */
	public function request_remote( $method, $path, $body = null ) {
		return wp_remote_request(
			"{$this->endpoint}/$path",
			array(
				'method'  => $method,
				'body'    => $body,
				'headers' => array(
					'Accept'        => 'application/json',
					'Content-Type'  => 'application/json; charset=' . get_option( 'blog_charset' ),
					'Cache-Control' => 'no-cache',
					'Authorization' => 'Basic ' . base64_encode( $this->account_sid . ':' . $this->auth_token ),
				),
				'timeout' => 30,
			)
		);
	}
}
