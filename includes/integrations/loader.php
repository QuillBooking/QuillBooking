<?php
/**
 * Integrations Loader
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillBooking\Integrations\Google\Integration as Google_Integration;
use QuillBooking\Integrations\Outlook\Integration as Outlook_Integration;
use QuillBooking\Integrations\Zoom\Integration as Zoom_Integration;
use QuillBooking\Integrations\Apple\Integration as Apple_Integration;

Google_Integration::instance();
Outlook_Integration::instance();
Zoom_Integration::instance();
Apple_Integration::instance();
