<?php

/**
 * Class Settings
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

/**
 * Settings Class
 *
 * @since 1.0.0
 */
class Settings
{


	/**
	 * Option name where to store all settings
	 *
	 * @since 1.0.0
	 */
	const OPTION_NAME = 'quillbooking_settings';

	/**
	 * Get a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default value.
	 * @return mixed
	 */
	public static function get($key, $default = false)
	{
		$settings = self::get_all();
		return isset($settings[$key]) ? $settings[$key] : $default;
	}

	/**
	 * Update a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $value Value.
	 * @return boolean
	 */
	public static function update($key, $value)
	{
		return self::update_many(array($key => $value));
	}

	/**
	 * Delete a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @return boolean
	 */
	public static function delete($key)
	{
		$settings = self::get_all();
		unset($settings[$key]);
		return update_option(self::OPTION_NAME, $settings);
	}

	/**
	 * Get all settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_all()
	{
		$defaults = array(
			'general'  => array(
				'admin_email'             => get_option('admin_email'),
				'start_from'              => 'Monday',
				'time_format'             => '12',
				'auto_cancel_after'       => 30,
				'auto_complete_after'     => 30,
				'default_country_code'    => 'US',
				'enable_summary_email'    => false,
				'summary_email_frequency' => 'daily',
			),
			'payments' => array(
				'currency' => 'USD',
			),
			'email'    => array(
				'from_name'               => '',
				'from_email'              => '',
				'reply_to_name'           => '',
				'reply_to_email'          => '',
				'use_host_from_name'      => false,
				'use_host_reply_to_email' => false,
				'include_ics'             => false,
				'footer'                  => '',
			),
			'theme'    => array(
				'color_scheme' => 'light',
			),
		);

		$settings = get_option(self::OPTION_NAME, array());

		if (empty($settings)) {
			$settings = array();
		}

		$settings = wp_parse_args($settings, $defaults);

		// If email settings are empty, try to get them from WordPress
		if (empty($settings['email']['from_name'])) {
			$settings['email']['from_name'] = get_bloginfo('name');
		}
		if (empty($settings['email']['from_email'])) {
			$settings['email']['from_email'] = get_option('admin_email');
		}

		return $settings;
	}

	/**
	 * Update many settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $new_settings New settings.
	 * @return boolean
	 */
	public static function update_many($new_settings)
	{
		$old_settings = self::get_all();
		$settings     = array_replace($old_settings, $new_settings);
		return update_option(self::OPTION_NAME, $settings);
	}

	/**
	 * Delete all settings
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public static function delete_all()
	{
		return delete_option(self::OPTION_NAME);
	}
}
