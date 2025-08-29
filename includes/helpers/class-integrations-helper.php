<?php

/**
 * Integrations Helper
 *
 * @package QuillBooking
 * @subpackage Helpers
 */

namespace QuillBooking\Helpers;

/**
 * Integrations Helper class
 */
class Integrations_Helper {










	/**
	 * Check if integrations are available
	 *
	 * @return bool
	 */
	public static function has_integrations() {
		 return defined( 'QUILLBOOKING_PRO_VERSION' );
	}

	/**
	 * Get default integrations data
	 *
	 * @param string $context The context for which we need the defaults ('manager' or 'event').
	 * @return array
	 */
	public static function get_default_integrations( $context = 'event' ) {
		if ( $context === 'manager' ) {
			return array(

				'google'             => array(
					'name'         => 'Google Calendar/Meet',
					'description'  => 'Google Calendar Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'google' . '/icon.svg',
					'is_calendar'  => true,
					'auth_type'    => 'oauth2',
					'has_accounts' => false,
					'is_global'    => false,
				),

				'outlook'            => array(
					'name'         => 'Outlook Calendar/MS Teams Conferencing',
					'description'  => 'Outlook Calendar Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'outlook' . '/icon.svg',
					'is_calendar'  => true,
					'auth_type'    => 'oauth2',
					'has_accounts' => false,
					'is_global'    => false,
				),
				'zoom'               => array(
					'name'         => 'Zoom Integration',
					'description'  => 'Zoom Meeting Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'zoom' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'oauth2',
					'has_accounts' => false,
					'is_global'    => false,
				),
				'apple'              => array(
					'name'         => 'Apple Calendar',
					'description'  => 'Apple Calendar Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'apple' . '/icon.svg',
					'is_calendar'  => true,
					'auth_type'    => 'oauth2',
					'has_accounts' => false,
					'is_global'    => false,
				),
				'twilio'             => array(
					'name'         => 'Twilio',
					'description'  => 'Twilio SMS Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'twilio' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'api_key',
					'has_accounts' => false,
					'is_global'    => true,
				),
				// 'zapier'             => array(
				// 	'name'         => 'Zapier',
				// 	'description'  => 'Zapier Integration',
				// 	'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'zapier' . '/icon.svg',
				// 	'is_calendar'  => false,
				// 	'auth_type'    => 'api_key',
				// 	'has_accounts' => false,
				// 	'is_global'    => true,
				// ),
				'make'               => array(
					'name'         => 'Make',
					'description'  => 'Make Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'make' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'api_key',
					'has_accounts' => false,
					'is_global'    => true,
				),
				'matomo'             => array(
					'name'         => 'Matomo',
					'description'  => 'Matomo Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'matomo' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'api_key',
					'has_accounts' => false,
					'is_global'    => true,
				),
				'google-analytics'   => array(
					'name'         => 'Google Analytics',
					'description'  => 'Google Analytics Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'google-analytics' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'api_key',
					'has_accounts' => false,
					'is_global'    => true,
				),
				'google-tag-manager' => array(
					'name'         => 'Google Tag Manager',
					'description'  => 'Google Tag Manager Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'google-tag-manager' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'api_key',
					'has_accounts' => false,
					'is_global'    => true,
				),
				'facebook-pixel'     => array(
					'name'         => 'Facebook Pixel',
					'description'  => 'Facebook Pixel Integration',
					'icon'         => QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . 'facebook-pixel' . '/icon.svg',
					'is_calendar'  => false,
					'auth_type'    => 'api_key',
					'has_accounts' => false,
					'is_global'    => true,
				),
			);
		} else {
			// For event context or default
			return array(
				'google'             => array(
					'name'            => 'Google',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'outlook'            => array(
					'name'            => 'Outlook',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'teams_enabled'   => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'apple'              => array(
					'name'            => 'Apple',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'zoom'               => array(
					'name'            => 'Zoom',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'twilio'             => array(
					'name'            => 'Twilio',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'zapier'             => array(
					'name'            => 'Zapier',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'make'               => array(
					'name'            => 'Make',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'matomo'             => array(
					'name'            => 'Matomo',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'google-analytics'   => array(
					'name'            => 'Google Analytics',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'google-tag-manager' => array(
					'name'            => 'Google Tag Manager',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
				'facebook-pixel'     => array(
					'name'            => 'Facebook Pixel',
					'connected'       => false,
					'has_accounts'    => false,
					'has_settings'    => false,
					'has_get_started' => false,
					'has_pro_version' => false,
				),
			);
		}
	}
}
