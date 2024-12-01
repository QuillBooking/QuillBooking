<?php
/**
 * Google Calendar / Meet Integration API
 *
 * This class is responsible for handling the Google Calendar / Meet Integration API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Google;

use QuillBooking\Integration\API as Abstract_API;

/**
 * Google Integration API class
 */
class API extends Abstract_API {

	/**
	 * App
	 *
	 * @var App
	 */
	private $app;

	/**
	 * Access token
	 *
	 * @var string
	 */
	private $access_token;

	/**
	 * Refresh token
	 *
	 * @var string
	 */
	private $refresh_token;

	/**
	 * Account id
	 *
	 * @var string
	 */
	private $account_id;

	/**
	 * Constructor
	 *
	 * @param string $access_token Access token.
	 * @param string $refresh_token Refresh token.
	 * @param App    $app App.
	 * @since 1.0.0
	 */
	public function __construct( $access_token, $refresh_token = null, $app = null, $account_id = null ) {
		$this->endpoint      = 'https://www.googleapis.com';
		$this->app           = $app;
		$this->access_token  = $access_token;
		$this->refresh_token = $refresh_token;
		$this->account_id    = $account_id;
	}

	/**
	 * Get account info
	 *
	 * @return array
	 */
	public function get_account_info() {
		return $this->get( '/oauth2/v1/userinfo' );
	}

	/**
	 * Get Calendars
	 *
	 * @return array
	 */
	public function get_calendars() {
		return $this->get( '/calendar/v3/users/me/calendarList' );
	}

	/**
	 * Get Events
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param array  $args Args.
	 * @return array
	 */
	public function get_events( $calendar_id, $args = array() ) {
		return $this->get( "/calendar/v3/calendars/$calendar_id/events", $args );
	}

	/**
	 * Get free/busy
	 *
	 * @param array $calendars Calendars.
	 * @param array $args Args.
	 *
	 * @return array
	 */
	public function get_free_busy( $calendars, $args = array() ) {
		foreach ( $calendars as $calendar ) {
			$args['items'][] = array( 'id' => $calendar );
		}

		return $this->post( '/calendar/v3/freeBusy', $args );
	}

	/**
	 * Add event
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param array  $args Args.
	 *
	 * @return array
	 */
	public function add_event( $calendar_id, $args = array() ) {
		$url = "/calendar/v3/calendars/$calendar_id/events";

		if ( ! empty( $args['conferenceData'] ) ) {
			$url .= '?conferenceDataVersion=1';
		}

		return $this->post( $url, $args );
	}

	/**
	 * Update event
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param string $event_id Event ID.
	 * @param array  $args Args.
	 *
	 * @return array
	 */
	public function update_event( $calendar_id, $event_id, $args = array() ) {
		$url = "/calendar/v3/calendars/$calendar_id/events/$event_id";

		if ( ! empty( $args['conferenceData'] ) ) {
			$url .= '?conferenceDataVersion=1';
		}

		return $this->patch( $url, $args );
	}

	/**
	 * Delete event
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param string $event_id Event ID.
	 *
	 * @return array
	 */
	public function delete_event( $calendar_id, $event_id ) {
		return $this->delete( "/calendar/v3/calendars/$calendar_id/events/$event_id" );
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
					'Authorization' => 'Bearer ' . $this->access_token,
				),
				'timeout' => 30,
			)
		);
	}

	/**
	 * Send request to the api.
	 *
	 * @param string      $method Method.
	 * @param string      $path Path.
	 * @param string|null $body Body.
	 * @param boolean     $maybe_refresh_token Refresh token if expired or no.
	 * @return array
	 */
	public function request( $method, $path, $body = null, $maybe_refresh_token = true ) {
		$response = $this->request_remote( $method, $path, $body );
		if ( is_wp_error( $response ) ) {
			return $this->prepare_response(
				false,
				null,
				array(
					'wp_error' => array(
						'code'    => $response->get_error_code(),
						'message' => $response->get_error_message(),
					),
				)
			);
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = json_decode( $response['body'], true );

		if ( $response_code === 401 ) {
			if ( $maybe_refresh_token ) {
				$refreshed = $this->refresh_tokens();
				if ( $refreshed ) {
					// try the request again but don't try to refresh tokens again!
					return $this->request( $method, $path, $body, false );
				}
			}

			return $this->prepare_response(
				false,
				$response_code,
				$response_body
			);
		} elseif ( $response_code >= 300 ) {
			return $this->prepare_response(
				false,
				$response_code,
				$response_body
			);
		}

		unset( $response_body['_links'] );
		return $this->prepare_response(
			true,
			$response_code,
			$response_body
		);
	}

	/**
	 * Refresh tokens
	 *
	 * @return boolean
	 */
	private function refresh_tokens() {
		$tokens = $this->app->refresh_tokens( $this->refresh_token, $this->account_id );
		if ( ! is_array( $tokens ) ) {
			return false;
		}

		$this->access_token  = $tokens['access_token'];
		$this->refresh_token = $tokens['refresh_token'];
		return true;
	}
}
