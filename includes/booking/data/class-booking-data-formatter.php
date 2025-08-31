<?php
/**
 * Booking Data Formatter
 *
 * Handles all data formatting logic for templates
 */

namespace QuillBooking\Booking\Data;

use DateTime;
use DateTimeZone;
use Exception;

class Booking_Data_Formatter {

	/**
	 * Format booking data for templates
	 */
	public function format_booking_data( $booking, $time_format = '12' ): array {
		$booking_array = $booking->toArray();

		// Format time range
		$booking_array['formatted_time_range'] = $this->format_time_range( $booking_array, $time_format );

		// Format location
		$booking_array = $this->format_location( $booking_array );

		return $booking_array;
	}

	/**
	 * Format time range string
	 */
	private function format_time_range( array $booking_array, $time_format = '12' ): string {
		if (
			empty( $booking_array['start_time'] ) ||
			empty( $booking_array['timezone'] ) ||
			empty( $booking_array['slot_time'] )
		) {
			return '';
		}

		try {
			$start = new DateTime( $booking_array['start_time'], new DateTimeZone( 'UTC' ) );
			$start->setTimezone( new DateTimeZone( $booking_array['timezone'] ) );

			$end = clone $start;
			$end->modify( "+{$booking_array['slot_time']} minutes" );

			// Choose time format based on time_format parameter
			$php_time_format = $time_format === '24' ? 'H:i' : 'g:i A';

			return sprintf(
				'%s - %s, %s',
				$start->format( $php_time_format ),
				$end->format( $php_time_format ),
				$start->format( 'l, F d, Y' )
			);
		} catch ( Exception $e ) {
			return '';
		}
	}

	/**
	 * Format location data
	 */
	private function format_location( array $booking_array ): array {
		if ( empty( $booking_array['location'] ) ) {
			return $booking_array;
		}

		$type  = isset( $booking_array['location']['type'] ) ? strtolower( $booking_array['location']['type'] ) : '';
		$label = $booking_array['location']['label'] ?? '';
		$value = $booking_array['location']['value'] ?? '';

		$booking_array['location_value'] = $value;

		$link_types = array( 'online', 'zoom', 'ms-teams', 'google-meet' );

		if ( in_array( $type, $link_types, true ) && filter_var( $value, FILTER_VALIDATE_URL ) ) {
			$booking_array['location'] = sprintf(
				'<a class="link" href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
				esc_url( $value ),
				esc_html( $label )
			);
		} else {
			$booking_array['location'] = esc_html( $label . ' : ' . $value );
		}

		return $booking_array;
	}
}
