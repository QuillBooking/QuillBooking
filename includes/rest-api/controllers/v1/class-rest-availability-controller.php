<?php

/**
 * Class REST_Availability_Controller
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\REST_API\Controllers\v1;

use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillBooking\Abstracts\REST_Controller;
use QuillBooking\Availabilities;
use QuillBooking\Models\Event_Meta_Model;

/**
 * REST_Availability_Controller class
 */
class REST_Availability_Controller extends REST_Controller
{

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'availabilities';

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
						'filter' => array(
							'description' => __('Filter availabilities.', 'quill-booking'),
							'type' => 'object',
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_item'),
					'permission_callback' => array($this, 'get_item_permissions_check'),
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
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)/clone',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'clone_item'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)/set-default',
			array(
				array(
					'methods' => WP_REST_Server::EDITABLE,
					'callback' => array($this, 'set_default'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
				),
			)
		);
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
			'title' => 'availability',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __('Unique identifier for the object.', 'quill-booking'),
					'type' => 'integer',
					'context' => array('view', 'edit'),
					'readonly' => true,
				),
				'user_id' => array(
					'description' => __('User ID.', 'quill-booking'),
					'type' => 'integer',
					'context' => array('view', 'edit'),
					'required' => true,
				),
				'name' => array(
					'description' => __('Name.', 'quill-booking'),
					'type' => 'string',
					'context' => array('view', 'edit'),
					'required' => true,
				),
				'weekly_hours' => array(
					'description' => __('Weekly hours.', 'quill-booking'),
					'type' => 'object',
					'properties' => array(
						'monday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
						'tuesday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
						'wednesday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
						'thursday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
						'friday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
						'saturday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
						'sunday' => array(
							'type' => 'object',
							'properties' => array(
								'start' => array(
									'type' => 'string',
								),
								'end' => array(
									'type' => 'string',
								),
								'off' => array(
									'type' => 'boolean',
								),
							),
						),
					),
					'context' => array('view', 'edit'),
					'required' => true,
				),
				'override' => array(
					'description' => __('Override.', 'quill-booking'),
					'type' => 'object',
					'properties' => array(
						'days' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
						'hours' => array(
							'type' => 'array',
							'items' => array(
								'type' => 'object',
								'properties' => array(
									'start' => array(
										'type' => 'string',
									),
									'end' => array(
										'type' => 'string',
									),
								),
							),
						),
					),
					'context' => array('view', 'edit'),
					'required' => false,
				),
				'is_default' => array(
					'description' => __('Is default.', 'quill-booking'),
					'type' => 'boolean',
					'context' => array('view', 'edit'),
					'required' => false,
					'default' => false,
				),
				'timezone' => array(
					'description' => __('Timezone.', 'quill-booking'),
					'type' => 'string',
					'context' => array('view', 'edit'),
					'required' => true,
				),
			),
		);
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items($request)
	{
		$filter = $request->get_param('filter') ? $request->get_param('filter') : array();
		$user = Arr::get($filter, 'user') ? Arr::get($filter, 'user') : 'own';
		$availabilities = Availabilities::get_availabilities();

		if ('all' === $user && !current_user_can('quillbooking_read_all_availability')) {
			return new WP_Error('rest_forbidden', __('You do not have permission to read all availabilities.', 'quill-booking'), array('status' => 403));
		}

		if ('own' === $user) {
			$availabilities = array_filter(
				$availabilities,
				function ($availability) {
					return get_current_user_id() === $availability['user_id'];
				}
			);
		}

		// Add number of calendars and calenders to each availability
		$availabilities = array_map(
			function ($availability) {
				return $this->events_details_for_availability($availability);
			},
			$availabilities
		);

		return new WP_REST_Response($availabilities, 200);
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check($request)
	{
		return current_user_can('quillbooking_read_all_availability') || current_user_can('quillbooking_read_own_availability');
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item($request)
	{
		$id = $request->get_param('id');
		$availability = Availabilities::get_availability($id);

		if (!$availability) {
			return new WP_Error('rest_availability_invalid_id', __('Invalid availability ID.', 'quill-booking'), array('status' => 404));
		}

		if (!current_user_can('quillbooking_read_all_availability') && get_current_user_id() !== $availability['user_id']) {
			return new WP_Error('rest_forbidden', __('You do not have permission to read this availability.', 'quill-booking'), array('status' => 403));
		}

		$availability = $this->events_details_for_availability($availability);

		return new WP_REST_Response($availability, 200);
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check($request)
	{
		return current_user_can('quillbooking_read_all_availability') || current_user_can('quillbooking_read_own_availability');
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function create_item($request)
	{
		$weekly_hours = $request->get_param('weekly_hours');
		$override = $request->get_param('override');
		$id = substr(md5(uniqid(rand(), true)), 0, 8);
		$user_id = $request->get_param('user_id') ? $request->get_param('user_id') : get_current_user_id();
		$name = $request->get_param('name');
		$timezone = $request->get_param('timezone');

		$availability = Availabilities::add_availability(
			array(
				'id' => $id,
				'user_id' => $user_id,
				'name' => $name,
				'weekly_hours' => $weekly_hours,
				'override' => $override,
				'timezone' => $timezone,
			)
		);

		return new WP_REST_Response($availability, 201);
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check($request)
	{
		return current_user_can('quillbooking_manage_all_availability');
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_item($request)
	{
		$id = $request->get_param('id');
		$weekly_hours = $request->get_param('weekly_hours');
		$override = $request->get_param('override');
		$name = $request->get_param('name');
		$timezone = $request->get_param('timezone');
		$availability = Availabilities::get_availability($id);

		if (!$availability) {
			return new WP_Error('rest_availability_invalid_id', __('Invalid availability ID.', 'quill-booking'), array('status' => 404));
		}

		if (!current_user_can('quillbooking_manage_all_availability') && get_current_user_id() !== $availability['user_id']) {
			return new WP_Error('rest_forbidden', __('You do not have permission to update this availability.', 'quill-booking'), array('status' => 403));
		}
		$update = array_filter(
			array(
				'name' => $name,
				'weekly_hours' => $weekly_hours,
				'override' => $override,
				'timezone' => $timezone,
			),
			function ($value, $key) {
				// Always include override even if empty
				if ($key === 'override') {
					return true;
				}
				return !empty($value);
			},
			ARRAY_FILTER_USE_BOTH
		);

		$availability = array_merge($availability, $update);

		Availabilities::update_availability($availability);

		return new WP_REST_Response($availability, 200);
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check($request)
	{
		return current_user_can('quillbooking_manage_all_availability') || current_user_can('quillbooking_manage_own_availability');
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item($request)
	{
		$id = $request->get_param('id');

		$availability = Availabilities::get_availability($id);

		if ('system' === $availability['user_id']) {
			return new WP_Error('rest_availability_invalid_id', __('Sorry, you cannot delete the default availability.', 'quill-booking'), array('status' => 400));
		}

		if (!$availability) {
			return new WP_Error('rest_availability_invalid_id', __('Invalid availability ID.', 'quill-booking'), array('status' => 404));
		}

		if (!current_user_can('quillbooking_manage_all_availability') && get_current_user_id() !== $availability['user_id']) {
			return new WP_Error('rest_forbidden', __('You do not have permission to delete this availability.', 'quill-booking'), array('status' => 403));
		}

		Availabilities::delete_availability($id);

		return new WP_REST_Response(null, 204);
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check($request)
	{
		return current_user_can('quillbooking_manage_all_availability') || current_user_can('quillbooking_manage_own_availability');
	}

	/**
	 * Clone item
	 *
	 * @param WP_REST_Request
	 *
	 * @return WP_REST_Response
	 */
	public function clone_item($request)
	{
		$availability_id = $request->get_param('id');

		if (!$availability_id) {
			return new WP_Error('rest_availability_invalid_id', __('Invalid availability ID.', 'quill-booking'), array('status' => 400));
		}

		$availability = Availabilities::get_availability($availability_id);

		if (!$availability) {
			return new WP_Error('rest_availability_not_found', __('Availability not found.', 'quill-booking'), array('status' => 404));
		}

		$new_id = substr(md5(uniqid(rand(), true)), 0, 8);
		$availability['id'] = $new_id;
		$availability['name'] .= ' (clone)';
		$availability['is_default'] = false;

		$cloned_availability = Availabilities::add_availability($availability);

		return new WP_REST_Response($cloned_availability, 201);
	}

	/**
	 * Set availability as default
	 *
	 * @param WP_REST_Request
	 */
	public function set_default($request)
	{
		$availability_id = $request->get_param('id');

		if (!$availability_id) {
			return new WP_Error('rest_availability_invalid_id', __('Invalid availability ID.', 'quill-booking'), array('status' => 400));
		}

		$availability = Availabilities::get_availability($availability_id);

		if (!$availability) {
			return new WP_Error('rest_availability_not_found', __('Availability not found.', 'quill-booking'), array('status' => 404));
		}

		$user_id = $availability['user_id'];
		$all_availabilities = Availabilities::get_availabilities();

		foreach ($all_availabilities as &$availability_data) {
			if ($availability_data['user_id'] == $user_id && isset($availability_data['is_default']) && $availability_data['is_default']) {
				$availability_data['is_default'] = false;
				Availabilities::update_availability($availability_data);
			}
		}

		$availability['is_default'] = true;
		Availabilities::update_availability($availability);

		return new WP_REST_Response($availability, 200);
	}

	/**
	 * Get availability events details
	 *
	 * @param array $availability Availability.
	 *
	 * @return array
	 */
	private function events_details_for_availability($availability)
	{
		$events = Event_Meta_Model::where('meta_key', 'availability')->where('meta_value', $availability['id'])->with('event')->get();
		$availability['events_count'] = $events->count();
		$availability['events'] = $events;
		return $availability;
	}
}
