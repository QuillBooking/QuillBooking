<?php
/**
 * Merge Tags Loader
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillBooking\Merge_Tags\Booking\Additional_Guests;
use QuillBooking\Merge_Tags\Booking\Booking_Cancel_URL;
use QuillBooking\Merge_Tags\Booking\Booking_Details_URL;
use QuillBooking\Merge_Tags\Booking\Booking_EndDate;
use QuillBooking\Merge_Tags\Booking\Booking_Hash;
use QuillBooking\Merge_Tags\Booking\Booking_Location;
use QuillBooking\Merge_Tags\Booking\Booking_StartDate;
use QuillBooking\Merge_Tags\Booking\Booking_Name;
use QuillBooking\Merge_Tags\Booking\Event_Name;
use QuillBooking\Merge_Tags\Booking\Reschedule_URL;
use QuillBooking\Merge_Tags\Booking\Confirm_URL;
use QuillBooking\Merge_Tags\Booking\Reject_URL;
use QuillBooking\Merge_Tags\Booking\Booking_Timezone;
use QuillBooking\Merge_Tags\Guest\Guest_Name;
use QuillBooking\Merge_Tags\Guest\Guest_Email;
use QuillBooking\Merge_Tags\Guest\Guest_Note;
use QuillBooking\Merge_Tags\Guest\Guest_Timezone;
use QuillBooking\Merge_Tags\Host\Host_Name;
use QuillBooking\Merge_Tags\Host\Host_Email;
use QuillBooking\Merge_Tags\Host\Host_Timezone;

Additional_Guests::instance();
Booking_Cancel_URL::instance();
Booking_Details_URL::instance();
Booking_EndDate::instance();
Booking_Hash::instance();
Booking_Location::instance();
Booking_StartDate::instance();
Booking_Name::instance();
Booking_Timezone::instance();
Confirm_URL::instance();
Reject_URL::instance();
Event_Name::instance();
Reschedule_URL::instance();
Guest_Name::instance();
Guest_Email::instance();
Guest_Note::instance();
Guest_Timezone::instance();
Host_Name::instance();
Host_Email::instance();
Host_Timezone::instance();
