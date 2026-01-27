<?php
/**
 * Class Booking_StartDate
 *
 * Booking Start Date Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use Illuminate\Support\Arr;
use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;

/**
 * Booking Start Date Merge Tag
 */
class Booking_StartDate extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking Start Date';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'start_time';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'booking';

	/**
	 * Get options
	 *
	 * @return array
	 */
	public function get_options() {
		return array(
			'format'   => array(
				'type'    => 'text',
				'label'   => __( 'Format', 'quillbooking' ),
				'default' => 'F j, Y',
			),
			'timezone' => array(
				'type'    => 'select',
				'label'   => __( 'Timezone', 'quillbooking' ),
				'options' => array(
					'attendee' => __( 'Attendee Timezone', 'quillbooking' ),
					'host'     => __( 'Host Timezone', 'quillbooking' ),
					'utc'      => __( 'UTC', 'quillbooking' ),
				),
				'default' => 'attendee',
			),
		);
	}

	/**
	 * Get Value
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param array         $options Options.
	 *
	 * @return string
	 */
	public function get_value( $booking, $options = array() ) {
		if ( empty( $booking->start_time ) ) {
			return '';
		}

		try {
			// Database stores times in UTC, so we need to create DateTime with UTC timezone
			$start_time = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		} catch ( \Exception $e ) {
			return '';
		}

		$timezone = Arr::get( $options, 'timezone', 'attendee' );
		$format   = Arr::get( $options, 'format', $this->get_default_format() );

		switch ( $timezone ) {
			case 'attendee':
				if ( ! empty( $booking->timezone ) ) {
					$start_time->setTimezone( new \DateTimeZone( $booking->timezone ) );
				}
				break;
			case 'host':
				$host_timezone = isset( $booking->event->availability['timezone'] ) ? $booking->event->availability['timezone'] : 'UTC';
				$start_time->setTimezone( new \DateTimeZone( $host_timezone ) );
				break;
			case 'utc':
				$start_time->setTimezone( new \DateTimeZone( 'UTC' ) );
				break;
		}

		return $start_time->format( $format );
	}

	/**
	 * Get default format based on global time format setting
	 *
	 * @return string
	 */
	private function get_default_format() {
		$global_settings = get_option( 'quillbooking_settings', array() );
		$time_format     = $global_settings['general']['time_format'] ?? '12';

		// Return appropriate PHP date format based on time format setting
		return $time_format === '24' ? 'F j, Y, H:i' : 'F j, Y, g:i A';
	}
}
