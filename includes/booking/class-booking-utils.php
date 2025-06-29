<?php

namespace QuillBooking\Booking;

use DateTime;
use DateTimeZone;

class Utils {

	/**
	 * Generate ICS file content
	 */
	public static function generate_ics( array $booking_data ): string {
		$event_name  = $booking_data['event']['name'] ?? '';
		$start_time  = $booking_data['start_time'] ?? '';
		$slot_time   = $booking_data['slot_time'] ?? 30;
		$location    = $booking_data['location_value'] ?? '';
		$description = $booking_data['description'] ?? $booking_data['event']['description'] ?? '';
		$timezone    = $booking_data['timezone'] ?? 'UTC';

		try {
			$start_dt = new DateTime( $start_time, new DateTimeZone( 'UTC' ) );
			$start_dt->setTimezone( new DateTimeZone( $timezone ) );
			$end_dt = clone $start_dt;
			$end_dt->modify( "+{$slot_time} minutes" );
		} catch ( Exception $e ) {
			return '';
		}

		return "BEGIN:VCALENDAR
            VERSION:2.0
            PRODID:-//QuillBooking//EN
            BEGIN:VEVENT
            UID:" . uniqid() . "
            DTSTAMP:" . gmdate( 'Ymd\THis\Z' ) . "
            DTSTART:" . $start_dt->format( 'Ymd\THis' ) . "
            DTEND:" . $end_dt->format( 'Ymd\THis' ) . "
            SUMMARY:" . $event_name . "
            DESCRIPTION:" . $description . "
            LOCATION:" . $location . "
            END:VEVENT
            END:VCALENDAR";
	}

	/**
	 * Generate calendar URLs
	 */
	public static function generate_calendar_urls( array $booking_data ): array {
		$event_name  = $booking_data['event']['name'] ?? '';
		$start_time  = $booking_data['start_time'] ?? '';
		$slot_time   = $booking_data['slot_time'] ?? 30;
		$location    = $booking_data['location_value'] ?? '';
		$description = $booking_data['description'] ?? $booking_data['event']['description'] ?? '';
		$timezone    = $booking_data['timezone'] ?? 'UTC';

		try {
			$start_dt = new DateTime( $start_time, new DateTimeZone( 'UTC' ) );
			$start_dt->setTimezone( new DateTimeZone( $timezone ) );
			$end_dt = clone $start_dt;
			$end_dt->modify( "+{$slot_time} minutes" );
		} catch ( Exception $e ) {
			return [];
		}

		$start_iso = $start_dt->format( 'Ymd\THis' );
		$end_iso   = $end_dt->format( 'Ymd\THis' );

		return [
			'google' => 'https://www.google.com/calendar/render?action=TEMPLATE'
				. '&text=' . urlencode( $event_name )
				. '&dates=' . $start_iso . '/' . $end_iso
				. '&details=' . urlencode( $description )
				. '&location=' . urlencode( $location )
				. '&sf=true&output=xml',
			
			'outlook' => 'https://outlook.live.com/calendar/0/deeplink/compose?'
				. 'subject=' . urlencode( $event_name )
				. '&startdt=' . $start_dt->format( 'Y-m-d\TH:i:s' )
				. '&enddt=' . $end_dt->format( 'Y-m-d\TH:i:s' )
				. '&body=' . urlencode( $description )
				. '&location=' . urlencode( $location ),
			
			'apple' => 'https://www.icloud.com/calendar/'
				. '?action=create'
				. '&title=' . urlencode( $event_name )
				. '&startDate=' . $start_iso
				. '&endDate=' . $end_iso
				. '&notes=' . urlencode( $description )
				. '&location=' . urlencode( $location )
		];
	}
}
