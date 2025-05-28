<?php

namespace QuillBooking\Integrations\Outlook;

use WP_REST_Request;
use WP_REST_Response;

/**
 * Class Outlook
 */
class Outlook {

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		\register_rest_route(
			'quillbooking/v1',
			'/integrations/outlook/(?P<calendar_id>[^/]+)/accounts/(?P<account_id>[^/]+)/check-teams',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'check_teams_capabilities' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'calendar_id' => array(
						'required' => true,
						'type'     => 'string',
					),
					'account_id'  => array(
						'required' => true,
						'type'     => 'string',
					),
				),
			)
		);
	}

	/**
	 * Check Teams capabilities
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function check_teams_capabilities( $request ) {
		$calendar_id = $request->get_param( 'calendar_id' );
		$account_id  = $request->get_param( 'account_id' );

		$api      = new API();
		$response = $api->check_teams_capabilities_endpoint( $account_id );

		return \rest_ensure_response( $response );
	}
}
