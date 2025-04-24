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
class REST_Team_Controller extends REST_Controller
{

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
	public function register_routes()
	{
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_items'),
					'permission_callback' => array($this, 'get_items_permissions_check'),
					'args' => array(
						'per_page' => array(
							'description' => __('Number of items to fetch.', 'quillbooking'),
							'type' => 'integer',
						),
						'page' => array(
							'description' => __('Current page number.', 'quillbooking'),
							'type' => 'integer',
						),
					),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'create_item'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
					'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
				),
			)
		);

		// User route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_item'),
					'permission_callback' => array($this, 'get_item_permissions_check'),
					'args' => array(
						'id' => array(
							'description' => __('User ID.', 'quillbooking'),
							'type' => 'integer',
							'required' => true,
						),
					),
				),
				array(
					'methods' => WP_REST_Server::EDITABLE,
					'callback' => array($this, 'update_item'),
					'permission_callback' => array($this, 'update_item_permissions_check'),
					'args' => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
				),
				array(
					'methods' => WP_REST_Server::DELETABLE,
					'callback' => array($this, 'delete_item'),
					'permission_callback' => array($this, 'delete_item_permissions_check'),
					'args' => array(
						'id' => array(
							'description' => __('User ID.', 'quillbooking'),
							'type' => 'integer',
							'required' => true,
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
	protected function format_item_for_response($user)
	{
		$host = Calendar_Model::find($user->ID);

		return array(
			'ID' => $user->ID,
			'user_login' => $user->user_login,
			'user_email' => $user->user_email,
			'display_name' => $user->display_name,
			'capabilities' => $user->capabilities,
			'is_admin' => $user->is_admin,
			'is_host' => $host ? true : false,
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
	public function get_items($request)
	{
		try {
			$page = $request->get_param('page') ? $request->get_param('page') : 1;
			$per_page = $request->get_param('per_page') ? $request->get_param('per_page') : 10;
			$team_members = Team_Model::get_members()->paginate($per_page, '*', 'page', $page);

			$team_members = $team_members->map(
				function ($user) {
					return $this->format_item_for_response($user);
				}
			);

			return new WP_REST_Response($team_members, 200);
		} catch (Exception $e) {
			return new WP_Error('rest_team_error', $e->getMessage(), array('status' => 500));
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
	public function get_items_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item($request)
	{
		try {
			$user_id = $request->get_param('user_id');
			$capabilities = $request->get_param('capabilities');

			// Check if user is already a team member
			$team_member = Team_Model::find($user_id);
			if ($team_member->is_team_member()) {
				return new WP_Error('rest_team_error', __('User is already a team member', 'quillbooking'), array('status' => 400));
			}

			// Check if user exists
			$user = get_userdata($user_id);
			if (!$user) {
				return new WP_Error('rest_team_error', __('User not found', 'quillbooking'), array('status' => 404));
			}

			// Add capabilities
			$user->add_cap('manage_quillbooking');
			foreach ($capabilities as $capability) {
				$user->add_cap($capability);
			}

			update_user_meta($user_id, 'quillbooking_team_member', 'yes');

			$user = Team_Model::find($user_id);
			return new WP_REST_Response($this->format_item_for_response($user), 201);
		} catch (Exception $e) {
			return new WP_Error('rest_team_error', $e->getMessage(), array('status' => 500));
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
	public function create_item_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item($request)
	{
		try {
			$id = $request->get_param('id');
			$user = Team_Model::find($id);

			if (!$user) {
				return new WP_Error('rest_team_error', __('User not found', 'quillbooking'), array('status' => 404));
			}

			return new WP_REST_Response($this->format_item_for_response($user), 200);
		} catch (Exception $e) {
			return new WP_Error('rest_team_error', $e->getMessage(), array('status' => 500));
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
	public function get_item_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item($request)
	{
		try {
			$id = $request->get_param('id');
			$capabilities = $request->get_param('capabilities');

			// Check if user is a team member
			$team_member = Team_Model::find($id);
			if (!$team_member->is_team_member()) {
				return new WP_Error('rest_team_error', __('User is not a team member', 'quillbooking'), array('status' => 400));
			}

			// Check if user exists
			$user = new \WP_User($id);
			if (!$user->exists()) {
				return new WP_Error('rest_team_error', __('User not found', 'quillbooking'), array('status' => 404));
			}

			// Update capabilities
			foreach ($capabilities as $capability) {
				$user->add_cap($capability);
			}

			// Remove capabilities not in the list
			$quillbooking_capabilities = Capabilities::get_all_capabilities();
			foreach ($quillbooking_capabilities as $capability) {
				if (!in_array($capability, $capabilities, true)) {
					$user->remove_cap($capability);
				}
			}

			$user = Team_Model::find($id);
			return new WP_REST_Response($this->format_item_for_response($user), 200);
		} catch (Exception $e) {
			return new WP_Error('rest_team_error', $e->getMessage(), array('status' => 500));
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
	public function update_item_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item($request)
	{
		try {
			$id = $request->get_param('id');
			$user = new \WP_User($id);

			if (!$user->exists()) {
				return new WP_Error('rest_team_error', __('User not found', 'quillbooking'), array('status' => 404));
			}

			// Remove all quillbooking capabilities
			$quillbooking_capabilities = Capabilities::get_all_capabilities();
			$user->remove_cap('manage_quillbooking');
			foreach ($quillbooking_capabilities as $capability) {
				$user->remove_cap($capability);
			}

			delete_user_meta($id, 'quillbooking_team_member');
			return new WP_REST_Response(null, 200);
		} catch (Exception $e) {
			return new WP_Error('rest_team_error', $e->getMessage(), array('status' => 500));
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
	public function delete_item_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Get item schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema()
	{
		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'team_member',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __('User ID.', 'quillbooking'),
					'type' => 'integer',
					'context' => array('view', 'edit'),
					'readonly' => true,
				),
				'user_id' => array(
					'description' => __('User ID.', 'quillbooking'),
					'type' => 'integer',
					'context' => array('edit'),
					'required' => true,
				),
				'capabilities' => array(
					'description' => __('Capabilities.', 'quillbooking'),
					'type' => 'array',
					'items' => array(
						'type' => 'string',
					),
					'context' => array('view', 'edit'),
					'required' => true,
				),
				'user_login' => array(
					'description' => __('User login.', 'quillbooking'),
					'type' => 'string',
					'context' => array('view'),
					'readonly' => true,
				),
				'user_email' => array(
					'description' => __('User email.', 'quillbooking'),
					'type' => 'string',
					'format' => 'email',
					'context' => array('view'),
					'readonly' => true,
				),
				'display_name' => array(
					'description' => __('Display name.', 'quillbooking'),
					'type' => 'string',
					'context' => array('view'),
					'readonly' => true,
				),
				'is_admin' => array(
					'description' => __('Is admin.', 'quillbooking'),
					'type' => 'boolean',
					'context' => array('view'),
					'readonly' => true,
				),
				'is_host' => array(
					'description' => __('Is host.', 'quillbooking'),
					'type' => 'boolean',
					'context' => array('view'),
					'readonly' => true,
				),
			),
		);
	}
}
