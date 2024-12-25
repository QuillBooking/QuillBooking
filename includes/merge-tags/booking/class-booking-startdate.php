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
		$start_time = $booking->start_time;
		$timezone   = Arr::get( $options, 'timezone', 'attendee' );
		$format     = Arr::get( $options, 'format', 'F j, Y' );

		$start_time = new \DateTime( $start_time );
		if ( ! $start_time ) {
			return '';
		}

		switch ( $timezone ) {
			case 'attendee':
				$start_time->setTimezone( new \DateTimeZone( $booking->timezone ) );
				break;
			case 'host':
				$start_time->setTimezone( new \DateTimeZone( $booking->event->availability['timezone'] ) );
				break;
			case 'utc':
				$start_time->setTimezone( new \DateTimeZone( 'UTC' ) );
				break;
		}

		return $start_time->format( $format );
	}
}
