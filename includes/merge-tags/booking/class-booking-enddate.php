<?php
/**
 * Booking End Date Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Merge_Tags\Booking;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;
use Illuminate\Support\Arr;

/**
 * Booking End Date Merge Tag
 */
class Booking_EndDate extends Merge_Tag {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Booking End Date';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'end_time';

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

		if ( empty( $booking->end_time ) ) {
			return '';
		}

		$timezone = Arr::get( $options, 'timezone', 'attendee' );
		$format   = Arr::get( $options, 'format', $this->get_default_format() );

		try {
			$end_time = new \DateTime( $booking->end_time );
		} catch ( \Exception $e ) {
			return '';
		}

		if ( empty( $booking->timezone ) ) {
			$booking->timezone = 'UTC';
		}

		switch ( $timezone ) {
			case 'attendee':
				$end_time->setTimezone( new \DateTimeZone( $booking->timezone ) );
				break;
			case 'host':
				if ( isset( $booking->event->availability['timezone'] ) ) {
					$end_time->setTimezone( new \DateTimeZone( $booking->event->availability['timezone'] ) );
				} else {

					$end_time->setTimezone( new \DateTimeZone( 'UTC' ) );
				}
				break;
			case 'utc':
				$end_time->setTimezone( new \DateTimeZone( 'UTC' ) );
				break;
		}

		return $end_time->format( $format );
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
