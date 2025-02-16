<?php
/**
 * Class Core
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

use QuillBooking\Utils;
use QuillBooking\Managers\Integrations_Manager;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Availabilities;

/**
 * Main Core Class
 */
class Core {

	/**
	 * Set admin config
	 *
	 * @since 1.8.0
	 *
	 * @return void
	 */
	public static function set_admin_config() {
		// Admin email address.
		$admin_email = get_option( 'admin_email' );
		$ajax_url    = admin_url( 'admin-ajax.php' );
		$nonce       = wp_create_nonce( 'quillbooking-admin' );

		wp_add_inline_script(
			'quillbooking-config',
			'quillbooking.config.setBlogName("' . get_bloginfo( 'name' ) . '");' .
			'quillbooking.config.setAdminUrl("' . admin_url() . '");' .
			'quillbooking.config.setAdminEmail("' . $admin_email . '");' .
			'quillbooking.config.setAjaxUrl("' . $ajax_url . '");' .
			'quillbooking.config.setNonce("' . $nonce . '");' .
			'quillbooking.config.setPluginDirUrl("' . QUILLBOOKING_PLUGIN_URL . '");' .
			'quillbooking.config.setIsWoocommerceActive( ' . quillbooking_is_plugin_active( 'woocommerce/woocommerce.php' ) . ' );' .
			'quillbooking.config.setSiteUrl( "' . site_url() . '" );' .
			'quillbooking.config.setTimezones( ' . json_encode( Utils::get_timezones() ) . ' );' .
			'quillbooking.config.setIntegrations( ' . json_encode( Integrations_Manager::instance()->get_options() ) . ' );' .
			'quillbooking.config.setLocations( ' . json_encode( Locations_Manager::instance()->get_options() ) . ' );' .
			'quillbooking.config.setAvailabilities( ' . json_encode( Availabilities::get_availabilities() ) . ' );'
		);
	}
}
