<?php
/**
 * Class Renderer
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

use QuillBooking\Utils;

/**
 * Main Core Class
 */
class Renderer {

	/**
	 * Set renderer config
	 *
	 * @since 1.8.0
	 *
	 * @return void
	 */
	public static function set_renderer() {

		wp_add_inline_script(
			'quillbooking-renderer',
			'quillbooking.config.setTimezones( ' . json_encode( Utils::get_timezones() ) . ' );'
		);
	}
}
