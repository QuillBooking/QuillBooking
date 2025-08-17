<?php

namespace QuillBooking;

use WP_Error;
use WP_REST_Response;
use Exception;
use QuillBooking\Models\Availability_Model;

class Availability_service
{
	/**
	 * Create a new availability schedule
	 *
	 * @since 1.0.0
	 *
	 * @param int    $user_id       WordPress user ID associated with the availability
	 * @param string $name          Unique name for the availability schedule
	 * @param array  $weekly_hours  Weekly availability structure (day-based time slots)
	 * @param array  $override      Special overrides for specific dates (format: ['YYYY-MM-DD' => [time slots]])
	 * @param string $timezone      Valid PHP timezone identifier (default: 'UTC')
	 * @param bool   $default       Whether this is the default availability
	 *
	 * @return array|WP_Error Returns availability details on success, WP_Error on validation failure
	 */
	public function create_availability($user_id, $name, $weekly_hours, $override = array(), $timezone = 'UTC', $default = false)
	{
		if (!$name) {
			return new WP_Error('rest_availability_invalid_name', __('Invalid availability name.', 'quill-booking'), array('status' => 400));
		}

		if (empty($weekly_hours)) {
			return new WP_Error('rest_availability_invalid_weekly_hours', __('Invalid weekly hours.', 'quill-booking'), array('status' => 400));
		}

		if (empty($timezone)) {
			return new WP_Error('rest_availability_invalid_timezone', __('Invalid timezone.', 'quill-booking'), array('status' => 400));
		}

		// Prepare value data
		$value_data = array(
			'weekly_hours' => $weekly_hours,
			'override' => $override,
		);

		$availability_data = array(
			'user_id' => $user_id,
			'name' => $name,
			'value' => $value_data,
			'timezone' => $timezone,
			'is_default' => $default,
		);

		try {
			// If this is being set as default, unset other defaults for this user
			if ($default) {
				Availability_Model::where('user_id', $user_id)
					->where('is_default', true)
					->update(array('is_default' => false));
			}

			$availability = Availability_Model::create($availability_data);

			// Prepare response data
			$value_data = $availability->value ?: array();

			$response_data = array(
				'id' => $availability->id,
				'user_id' => $availability->user_id,
				'name' => $availability->name,
				'weekly_hours' => $value_data['weekly_hours'] ?? array(),
				'override' => $value_data['override'] ?? array(),
				'timezone' => $availability->timezone,
				'is_default' => $availability->is_default,
				'created_at' => $availability->created_at,
				'updated_at' => $availability->updated_at,
			);

			return $response_data;
		} catch (Exception $e) {
			return new WP_Error('rest_availability_create_failed', $e->getMessage(), array('status' => 400));
		}
	}
}
