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
use QuillBooking\Managers\Payment_Gateways_Manager;
use QuillBooking\Managers\Merge_Tags_Manager;
use QuillBooking\Availabilities;
use QuillBooking\Capabilities;

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
		$admin_email  = get_option( 'admin_email' );
		$ajax_url     = admin_url( 'admin-ajax.php' );
		$nonce        = wp_create_nonce( 'quillbooking-admin' );
		$current_user = array(
			'id'           => get_current_user_id(),
			'display_name' => wp_get_current_user()->display_name,
			'email'        => wp_get_current_user()->user_email,
			'is_admin'     => current_user_can( 'administrator' ),
			'capabilities' => Capabilities::get_current_user_capabilities(),
		);

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
			'quillbooking.config.setAvailabilities( ' . json_encode( Availabilities::get_availabilities() ) . ' );' .
			'quillbooking.config.setCapabilities( ' . json_encode( Capabilities::get_core_capabilities() ) . ' );' .
			'quillbooking.config.setPaymentGateways( ' . json_encode( Payment_Gateways_Manager::instance()->get_options() ) . ' );' .
			'quillbooking.config.setCurrentUser( ' . json_encode( $current_user ) . ' );' .
			'quillbooking.config.setMergeTags( ' . json_encode( Merge_Tags_Manager::instance()->get_groups() ) . ' );' 
		);
	}
}
