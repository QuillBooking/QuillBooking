<?php

/**
 * Twilio Meet Integration API
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
	 * @param string $to To number.
	 * @param string $message Message content.
	 * @return array
	 */
	public function send_sms( $to, $message ) {
		return $this->post(
			"{$this->account_sid}/Messages.json",
			array(
				'From' => $this->sms_number,
				'To'   => $to,
				'Body' => $message,
			),
			'form'
		);
	}

	/**
	 * Send WhatsApp message
	 *
	 * @param string $to To number.
	 * @param string $message Message content.
	 * @return array
	 */
	public function send_whatsapp_message( $to, $message ) {
		return $this->post(
			"{$this->account_sid}/Messages.json",
			array(
				'From' => "whatsapp:{$this->whatsapp_number}",
				'To'   => "whatsapp:$to",
				'Body' => $message,
			),
			'form'
		);
	}

	/**
	 * Send a POST request to the API.
	 *
	 * @param string $path Request path.
	 * @param array  $body Request body.
	 * @param string $content_type Either 'form' or 'json'.
	 * @return array
	 */
	public function post( $path, $body = array(), $content_type = 'form' ) {
		$formatted_body = $content_type === 'json'
			? wp_json_encode( $body )
			: http_build_query( $body );

		return $this->request( 'POST', $path, $formatted_body, $content_type );
	}

	/**
	 * General request wrapper.
	 *
	 * @param string      $method HTTP method.
	 * @param string      $path   URL path.
	 * @param string|null $body   Request body.
	 * @param string      $content_type Either 'form' or 'json'.
	 * @return array
	 */
	public function request( $method, $path, $body = null, $content_type = 'form' ) {
		return $this->request_remote( $method, $path, $body, $content_type );
	}

	/**
	 * Perform the actual request using wp_remote_request.
	 *
	 * @param string      $method HTTP method.
	 * @param string      $path   URL path.
	 * @param string|null $body   Request body.
	 * @param string      $content_type Either 'form' or 'json'.
	 * @return array|WP_Error
	 */
	public function request_remote( $method, $path, $body = null, $content_type = 'form' ) {
		$content_type_header = $content_type === 'json'
			? 'application/json; charset=' . get_option( 'blog_charset' )
			: 'application/x-www-form-urlencoded';

		return wp_remote_request(
			"{$this->endpoint}/$path",
			array(
				'method'  => $method,
				'body'    => $body,
				'headers' => array(
					'Accept'        => 'application/json',
					'Content-Type'  => $content_type_header,
					'Cache-Control' => 'no-cache',
					'Authorization' => 'Basic ' . base64_encode( $this->account_sid . ':' . $this->auth_token ),
				),
				'timeout' => 30,
			)
		);
	}
}
