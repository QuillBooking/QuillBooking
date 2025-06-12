<?php

/**
 * Class Shortcode
 *
 * @since   1.11.0
 * @package QuillBooking
 */

namespace QuillBooking;

use QuillBooking\Models\Event_Model;

/**
 * Shortcode Class
 *
 * @since 1.11.0
 */
class Shortcode {

	/**
	 * Class instance
	 *
	 * @var self instance
	 */
	private static $instance = null;

	/**
	 * Get class instance
	 *
	 * @return self
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.11.0
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register' ) );
	}

	/**
	 * Register [quillbooking] shortcode
	 *
	 * @since 1.11.0
	 *
	 * @return void
	 */
	public function register() {
		add_shortcode( 'quillbooking', array( $this, 'handler' ) );
	}

	/**
	 * Handle shortcode render
	 *
	 * @since 1.11.0
	 *
	 * @param  array $atts Shortcode attributes.
	 * @return string
	 */
	public function handler( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'         => null,
				'width'      => '100%',
				'min_height' => null,
				'max_height' => null,
				'height'     => null,
			),
			$atts,
			'quillbooking'
		);

		$id         = (int) $atts['id'];
		$width      = esc_attr( $atts['width'] );
		$height     = esc_attr( $atts['height'] );
		$min_height = esc_attr( $atts['min_height'] );
		$max_height = esc_attr( $atts['max_height'] );
		if ( ! $min_height && ! $height ) {
			$min_height = '500px';
		}

		if ( ! $min_height && $height ) {
			$min_height = $height;
		}
		if ( ! $max_height ) {
			$max_height = 'auto';
		}
		if ( ! $max_height && $height ) {
			$max_height = $height;
		}

		// check if the id exists
		if ( ! $id ) {
			return esc_html__( 'Invalid ID', 'quillbooking' );
		}

		// get event
		$event = Event_Model::with( 'calendar' )->find( $id );

		if ( ! $event ) {
			return esc_html__( 'Event not found', 'quillbooking' );
		}

		$src = home_url( '/?quillbooking_calendar=' . $event->calendar->slug . '&event=' . $event->slug );

		return sprintf(
			"<iframe data-max-height='%s' class='quillbooking-iframe' scrolling='no' src='%s' width='%s' style='border:0;min-height:%s;width: 100%%; min-width: 100%%; max-height:%s'></iframe>",
			esc_attr( $max_height ),
			esc_url( $src ),
			esc_attr( $width ),
			esc_attr( $min_height ),
			esc_attr( $max_height )
		);
	}
}
