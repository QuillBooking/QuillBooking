<?php
/**
 * REST API: Class REST_Team_Controller
 *
 * This class is responsible for handling the team controller
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\V1;

use WP_Error;
use Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Models\Team_Model;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Capabilities;

/**
 * Team Controller class
 */
class REST_Team_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'team-members';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'quillbooking' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Current page number.', 'quillbooking' ),
							'type'        => 'integer',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'user_id'      => array(
							'description' => __( 'User ID.', 'quillbooking' ),
							'type'        => 'integer',
						),
						'capabilities' => array(
							'description' => __( 'Capabilities.', 'quillbooking' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// User route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'User ID.', 'quillbooking' ),
							'type'        => 'integer',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'id'           => array(
							'description' => __( 'User ID.', 'quillbooking' ),
							'type'        => 'integer',
						),
						'capabilities' => array(
							'description' => __( 'Capabilities.', 'quillbooking' ),
							'type'        => 'array',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'User ID.', 'quillbooking' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Format item for response
	 *
	 * @since 1.0.0
	 *
	 * @param Team_Model $user The team member
	 * @return array Formatted team member data
	 */
	// Inside REST_Team_Controller class

	// Inside REST_Team_Controller.php

	// Inside REST_Team_Controller.php

	// Inside REST_Team_Controller.php

	protected function format_item_for_response( $team_member_model ) {
		// Check if it's the expected Team_Model object AND has an ID
		if ( ! $team_member_model instanceof \QuillBooking\Models\Team_Model || empty( $team_member_model->ID ) ) {
			return array( 'error' => 'Invalid team member data received by formatter' );
		}

		// Get the user ID from the Team_Model
		$user_id = $team_member_model->ID;

		// *** FETCH the standard WP_User object ***
		$wp_user = get_userdata( $user_id );
		if ( ! $wp_user ) {
			return array( 'error' => "WP_User {$user_id} not found." );
		}
		// *** END FETCH ***

		// Check if this user has a 'host' calendar
		$host_calendar = Calendar_Model::where( 'user_id', $wp_user->ID )->where( 'type', 'host' )->first();
		$is_host_check = $host_calendar ? true : false;

		// Return data using the WP_User object's properties
		return array(
			'ID'           => $wp_user->ID,
			'user_login'   => $wp_user->user_login,
			'user_email'   => $wp_user->user_email,
			'display_name' => $wp_user->display_name,
			'capabilities' => $wp_user->caps, // <-- Use caps from WP_User
			'is_admin'     => user_can( $wp_user->ID, 'manage_options' ),
			'is_host'      => $is_host_check,
		);
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		try {
			$page         = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$per_page     = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$team_members = Team_Model::get_members()->paginate( $per_page, '*', 'page', $page );

			$team_members = $team_members->map(
				function( $user ) {
					return $this->format_item_for_response( $user );
				}
			);

			return new WP_REST_Response( $team_members, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_team_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}


	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	// Inside REST_Team_Controller::create_item
	public function create_item( $request ) {
		try {
			$user_id      = $request->get_param( 'user_id' );
			$capabilities = $request->get_param( 'capabilities' );

			if ( ! $user_id ) {
				return new WP_Error( 'rest_team_error', __( 'User ID is required', 'quillbooking' ), array( 'status' => 400 ) );
			}
			if ( ! $capabilities ) {
				return new WP_Error( 'rest_team_error', __( 'Capabilities are required', 'quillbooking' ), array( 'status' => 400 ) );
			}

			// 1. Check if the WP User actually exists first
			$user = get_userdata( $user_id );
			if ( ! $user ) {
				// Return 404 if the core WP user doesn't exist
				return new WP_Error( 'rest_team_error', __( 'User not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			// 2. Check if they are ALREADY a team member (using meta is simplest)
			if ( get_user_meta( $user_id, 'quillbooking_team_member', true ) === 'yes' ) {
				return new WP_Error( 'rest_team_error', __( 'User is already a team member', 'quillbooking' ), array( 'status' => 400 ) );
			}

			// 3. Add capabilities and meta (using the $user object we already fetched)
			$user->add_cap( 'manage_quillbooking' );
			foreach ( $capabilities as $capability ) {
				$user->add_cap( $capability );
			}
			update_user_meta( $user_id, 'quillbooking_team_member', 'yes' );

			// 4. Return formatted response (fetch fresh data via Team_Model for formatting)
			$team_member_data = Team_Model::find( $user_id );
			if ( ! $team_member_data ) {
				return new WP_Error( 'rest_team_error', 'Failed to retrieve team member data after creation.', array( 'status' => 500 ) );
			}
			// Use the controller's formatter method
			return new WP_REST_Response( $this->format_item_for_response( $team_member_data ), 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_team_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		try {
			$id   = $request->get_param( 'id' );
			$user = Team_Model::find( $id ); // This is the object passed to formatter
			if ( ! $user ) {
				return new WP_Error( 'rest_team_error', __( 'User not found', 'quillbooking' ), array( 'status' => 404 ) );
			}
			// The formatter will log the object again
			return new WP_REST_Response( $this->format_item_for_response( $user ), 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_team_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		try {
			$id           = $request->get_param( 'id' );
			$capabilities = $request->get_param( 'capabilities' );

			if ( ! $id ) {
				return new WP_Error( 'rest_team_error', __( 'User ID is required', 'quillbooking' ), array( 'status' => 400 ) );
			}

			if ( ! $capabilities ) {
				return new WP_Error( 'rest_team_error', __( 'Capabilities are required', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$team_member = Team_Model::find( $id );
			if ( ! $team_member->is_team_member() ) {
				return new WP_Error( 'rest_team_error', __( 'User is not a team member', 'quillbooking' ), array( 'status' => 400 ) );
			}

			$user = new \WP_User( $id );
			if ( ! $user->exists() ) {
				return new WP_Error( 'rest_team_error', __( 'User not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			foreach ( $capabilities as $capability ) {
				$user->add_cap( $capability );
			}

			$quillbooking_capabilities = Capabilities::get_all_capabilities();
			foreach ( $quillbooking_capabilities as $capability ) {
				if ( ! in_array( $capability, $capabilities, true ) ) {
					$user->remove_cap( $capability );
				}
			}

			$user = Team_Model::find( $id );
			return new WP_REST_Response( $this->format_item_for_response( $user ), 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_team_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		try {
			$id   = $request->get_param( 'id' );
			$user = new \WP_User( $id );

			if ( ! $user->exists() ) {
				return new WP_Error( 'rest_team_error', __( 'User not found', 'quillbooking' ), array( 'status' => 404 ) );
			}

			// Remove all quillbooking capabilities
			$quillbooking_capabilities = Capabilities::get_all_capabilities();
			$user->remove_cap( 'manage_quillbooking' );
			foreach ( $quillbooking_capabilities as $capability ) {
				$user->remove_cap( $capability );
			}

			delete_user_meta( $id, 'quillbooking_team_member' );
			return new WP_REST_Response( null, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_team_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
