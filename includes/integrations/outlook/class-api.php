<?php

/**
 * Outlook Calendar / Meet Integration API
 *
 * This class is responsible for handling the Outlook Calendar / Meet Integration API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Outlook;

use QuillBooking\Integration\API as Abstract_API;

/**
 * Outlook Integration API class
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
	 * @param string $account_id Account ID.
	 * @since 1.0.0
	 */
	public function __construct( $access_token, $refresh_token = null, $app = null, $account_id = null ) {
		$this->endpoint      = 'https://graph.microsoft.com/v1.0';
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
		return $this->get( 'me' );
	}

	/**
	 * Get calendars
	 *
	 * @return array
	 */
	public function get_calendars() {
		return $this->get( 'me/calendars' );
	}

	/**
	 * Get calendar events
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param array  $args Query string.
	 * @param array  $headers Headers.
	 * @return array
	 */
	public function get_events( $calendar_id, $args = array() ) {
		return $this->get( "me/calendars/$calendar_id/calendarview", $args );
	}

	/**
	 * Create event
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param array  $body Body.
	 *
	 * @return array
	 */
	public function create_event( $calendar_id, $body ) {
		return $this->post( "me/calendars/$calendar_id/events", $body );
	}

	/**
	 * Update event
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param string $event_id Event ID.
	 *
	 * @return array
	 */
	public function update_event( $calendar_id, $event_id, $body ) {
		return $this->patch( "me/calendars/$calendar_id/events/$event_id", $body );
	}

	/**
	 * Delete event
	 *
	 * @param string $event_id Event ID.
	 *
	 * @return array
	 */
	public function delete_event( $event_id ) {
		return $this->delete( "me/events/$event_id" );
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

	/**
	 * Check if user has Teams meeting creation capabilities
	 *
	 * @return array Response with Teams capabilities status
	 */
	public function check_teams_capabilities() {
		$response = $this->get( 'me/licenseDetails' );

		if ( ! $response['success'] ) {
			return $this->prepare_response(
				false,
				$response['code'],
				array(
					'message' => __( 'Failed to fetch license details', 'quillbooking' ),
				)
			);
		}

		$license_data = $response['data'];

		// Check if user has any valid licenses
		if ( empty( $license_data['value'] ) ) {
			return $this->prepare_response(
				false,
				400,
				array(
					'message' => __( 'No valid Microsoft 365 license found. Teams meeting creation requires a valid Microsoft 365 license.', 'quillbooking' ),
				)
			);
		}

		// Check for Teams meeting creation capabilities
		$has_teams_capability = false;
		$teams_service_plans  = array(
			'57ff2da0-773e-42df-b2af-ffb7a2317929', // TEAMS1
			'6fd2c87f-b296-42f0-b197-1e91e994b900', // TEAMS_EXPLORATORY
			'4a51bca5-1eff-43f5-878c-177680e19134', // TEAMS_COMMERCIAL_TRIAL
			'0c266dff-15dd-4b49-8397-2bb16070ed52', // TEAMS_ESSENTIALS
			'3b555118-da6a-4418-894f-7df1e2096870', // TEAMS_ESSENTIALS_EXP
			'4de31727-a228-4ec3-a5bf-8e45b5ca48cc', // TEAMS_ESSENTIALS_TRIAL
			'6a3f8d8b-2b1a-43b2-b555-2a1d1fdabcb9', // TEAMS_ESSENTIALS_TRIAL_EXP
		);

		foreach ( $license_data['value'] as $license ) {
			if ( isset( $license['servicePlans'] ) ) {
				foreach ( $license['servicePlans'] as $plan ) {
					if (
						in_array( $plan['servicePlanId'], $teams_service_plans ) &&
						isset( $plan['provisioningStatus'] ) &&
						$plan['provisioningStatus'] === 'Success'
					) {
						$has_teams_capability = true;
						break 2;
					}
				}
			}
		}

		if ( ! $has_teams_capability ) {
			return $this->prepare_response(
				false,
				400,
				array(
					'message' => __( 'Your Microsoft 365 license does not include Teams meeting creation capabilities. Please upgrade your license to use Teams features.', 'quillbooking' ),
				)
			);
		}

		return $this->prepare_response(
			true,
			200,
			array(
				'has_teams_capability' => true,
				'message'              => __( 'Teams meeting creation is available with your current license.', 'quillbooking' ),
			)
		);
	}

	/**
	 * Create Teams meeting
	 *
	 * @param string $calendar_id Calendar ID.
	 * @param array  $body Body.
	 *
	 * @return array
	 */
	public function create_teams_meeting( $calendar_id, $body ) {
		// First check if user has Teams capabilities
		$teams_check = $this->check_teams_capabilities();
		if ( ! $teams_check['success'] ) {
			return $teams_check;
		}

		// Add Teams meeting settings to the event
		$body['onlineMeeting'] = array(
			'provider' => 'teamsForBusiness',
		);

		return $this->create_event( $calendar_id, $body );
	}

	/**
	 * Check Teams capabilities
	 *
	 * @param string $account_id Account ID.
	 * @return array
	 */
	public function check_teams_capabilities_endpoint( $account_id ) {
		$api = new API(
			$this->get_access_token( $account_id ),
			$this->get_refresh_token( $account_id ),
			$this,
			$account_id
		);

		return $api->check_teams_capabilities();
	}

	/**
	 * Get access token
	 *
	 * @param string $account_id Account ID.
	 * @return string
	 */
	private function get_access_token( $account_id ) {
		$account = $this->get_account( $account_id );
		return $account['tokens']['access_token'];
	}

	/**
	 * Get refresh token
	 *
	 * @param string $account_id Account ID.
	 * @return string
	 */
	private function get_refresh_token( $account_id ) {
		$account = $this->get_account( $account_id );
		return $account['tokens']['refresh_token'];
	}

	/**
	 * Get account
	 *
	 * @param string $account_id Account ID.
	 * @return array
	 */
	private function get_account( $account_id ) {
		$accounts = get_option( 'quillbooking_outlook_accounts', array() );
		return isset( $accounts[ $account_id ] ) ? $accounts[ $account_id ] : array();
	}
}
