<?php
/**
 * Zoom Meet Integration API
 *
 * This class is responsible for handling the Zoom Meet Integration API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Zoom;

use QuillBooking\Integration\API as Abstract_API;

/**
 * Zoom Integration API class
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
		$this->endpoint      = 'https://api.zoom.us/v2';
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
		return $this->get( 'users/me' );
	}

	/**
	 * Create a meeting
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function create_meeting( $data ) {
		return $this->post( 'users/me/meetings', $data );
	}

	/**
	 * Update a meeting
	 *
	 * @param string $meeting_id Meeting ID.
	 * @param array  $data Data.
	 *
	 * @return array
	 */
	public function update_meeting( $meeting_id, $data ) {
		return $this->patch( "meetings/$meeting_id", $data );
	}

	/**
	 * Delete a meeting
	 *
	 * @param string $meeting_id Meeting ID.
	 *
	 * @return array
	 */
	public function delete_meeting( $meeting_id ) {
		return $this->delete( "meetings/$meeting_id" );
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
