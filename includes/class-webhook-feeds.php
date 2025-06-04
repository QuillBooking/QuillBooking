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
		$hooks = array(
			'quillbooking_after_booking_created' => 'confirmation',
			'quillbooking_booking_cancelled'     => 'cancelled',
			'quillbooking_booking_rescheduled'   => 'rescheduled',
			'quillbooking_booking_completed'     => 'completed',
			'quillbooking_booking_rejected'      => 'rejected',
		);

		foreach ( $hooks as $hook => $trigger_type ) {
			add_action(
				$hook,
				function ( $booking ) use ( $trigger_type ) {
					$type = $trigger_type ?? $booking->status;
					$this->handle_webhook_trigger( $booking, $type );
				},
				10,
				1
			);
		}
	}

	/**
	 * Handle webhook trigger based on type.
	 *
	 * @param Models\Booking_Model $booking Booking model.
	 * @param string               $trigger_type Trigger type.
	 */
	private function handle_webhook_trigger( $booking, $trigger_type ) {
		$webhook_feeds = $booking->event->webhook_feeds ?? array();

		if ( empty( $webhook_feeds ) ) {
			return;
		}

		foreach ( $webhook_feeds as $webhook_feed ) {
			$enabled  = Arr::get( $webhook_feed, 'enabled', false );
			$triggers = Arr::get( $webhook_feed, 'triggers', array() );

			if ( ! $enabled || ! in_array( $trigger_type, $triggers, true ) ) {
				continue;
			}

			$body = array(
				'booking'  => $booking->toArray(),
				'event'    => $booking->event->toArray(),
				'calendar' => $booking->calendar->toArray(),
			);

			$this->send_request(
				Arr::get( $webhook_feed, 'url', '' ),
				Arr::get( $webhook_feed, 'method', 'post' ),
				Arr::get( $webhook_feed, 'headers', array() ),
				$body,
				Arr::get( $webhook_feed, 'format', 'json' )
			);
		}
	}

	/**
	 * Send HTTP request to webhook URL.
	 *
	 * @param string $url     The webhook URL.
	 * @param string $method  The HTTP method (GET, POST, etc).
	 * @param array  $headers Array of HTTP headers.
	 * @param array  $body    Request body.
	 * @param string $format  Format of body ('json' or 'form').
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

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			error_log( 'Webhook request failed: ' . $response->get_error_message() );
		}
	}
}
