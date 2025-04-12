<?php
/**
 * Event Locations Loader file
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

QuillBooking\Event_Locations\Person_Address::instance();
QuillBooking\Event_Locations\Attendee_Address::instance();
QuillBooking\Event_Locations\Attendee_Phone::instance();
QuillBooking\Event_Locations\Person_Phone::instance();
QuillBooking\Event_Locations\Custom::instance();
QuillBooking\Event_Locations\Online::instance();
QuillBooking\Event_Locations\Google_Meet::instance();
QuillBooking\Event_Locations\Zoom::instance();
QuillBooking\Event_Locations\MS_Teams::instance();
