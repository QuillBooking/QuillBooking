<?php
/**
 * Class Webhook_Feeds
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking;

use Illuminate\Support\Arr;
use QuillBooking\Traits\Singleton;

/**
 * Webhook_Feeds class.
 */
class Webhook_Feeds {

	use Singleton;

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'quillbooking_after_booking_created', array( $this, 'send_trigger_webhook' ), 10, 2 );
		add_action( 'quillbooking_booking_cancelled', array( $this, 'send_trigger_webhook' ) );
		add_action( 'quillbooking_booking_rescheduled', array( $this, 'send_trigger_webhook' ) );
		add_action( 'quillbooking_booking_completed', array( $this, 'send_trigger_webhook' ) );
		add_action( 'quillbooking_booking_rejected', array( $this, 'send_trigger_webhook' ) );
	}

	/**
	 * After booking created.
	 *
	 * @param Models\Booking_Model $booking Booking model.
	 */
	public function send_trigger_webhook( $booking ) {
		$this->send_webhook( $booking );
	}

	/**
	 * Send webhook.
	 *
	 * @param Models\Booking_Model $booking Booking model.
	 */
	public function send_webhook( $booking ) {
		$webhook_feeds = $booking->event->webhook_feeds ?? array();
		if ( empty( $webhook_feeds ) ) {
			return;
		}

		foreach ( $webhook_feeds as $webhook_feed ) {
			if ( ! Arr::get( $webhook_feed, 'enabled', false ) || ! in_array( $booking->status, Arr::get( $webhook_feed, 'triggers', array() ) ) ) {
				continue;
			}

			$url              = Arr::get( $webhook_feed, 'url', '' );
			$method           = Arr::get( $webhook_feed, 'method', 'post' );
			$headers          = Arr::get( $webhook_feed, 'headers', array() );
			$body             = array();
			$body['booking']  = $booking->toArray();
			$body['event']    = $booking->event->toArray();
			$body['calendar'] = $booking->calendar->toArray();
			$format           = Arr::get( $webhook_feed, 'format', 'json' );

			$this->send_request( $url, $method, $headers, $body, $format );
		}
	}

	/**
	 * Send request.
	 *
	 * @param string $url     URL.
	 * @param string $method  Method.
	 * @param array  $headers Headers.
	 * @param array  $body    Body.
	 * @param string $format  Format.
	 */
	public function send_request( $url, $method, $headers, $body, $format ) {
		$args = array(
			'method'  => strtoupper( $method ),
			'headers' => $headers,
		);

		if ( 'json' === $format ) {
			$args['headers']['Content-Type'] = 'application/json';
			$args['body']                    = json_encode( $body );
		} else {
			$args['body'] = http_build_query( $body );
		}

		wp_remote_request( $url, $args );
	}
}
