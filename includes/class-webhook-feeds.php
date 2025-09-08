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
use QuillBooking\Managers\Merge_Tags_Manager;
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
		// Get webhook feeds from the booking event
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

			// Only send data that's specifically configured in the webhook
			// This avoids sending unnecessary data and respects the webhook configuration
			$has_body_fields = Arr::get( $webhook_feed, 'hasBodyFields', false );
			$body_fields     = Arr::get( $webhook_feed, 'bodyFields', array() );
			$body            = array();

			if ( $has_body_fields && ! empty( $body_fields ) ) {
				// Only include custom body fields when specified
				foreach ( $body_fields as $field_data ) {
					$field_name  = Arr::get( $field_data, 'field', '' );
					$field_value = Arr::get( $field_data, 'value', '' );

					if ( ! empty( $field_name ) ) {
						// Process merge tags if any
						$field_value         = Merge_Tags_Manager::instance()->process_merge_tags( $field_value, $booking );
						$body[ $field_name ] = $field_value;
					}
				}
			} else {
				$body = $booking->toArray();
			}

			// Process custom headers if any
			$has_headers       = Arr::get( $webhook_feed, 'hasHeaders', false );
			$headers           = Arr::get( $webhook_feed, 'headers', array() );
			$processed_headers = array();

			if ( $has_headers && ! empty( $headers ) ) {
				foreach ( $headers as $header_data ) {
					$header_name  = Arr::get( $header_data, 'header', '' );
					$header_value = Arr::get( $header_data, 'value', '' );

					if ( ! empty( $header_name ) ) {

						// Process merge tags in header values
						$header_value                      = Merge_Tags_Manager::instance()->process_merge_tags( $header_value, $booking );
						$processed_headers[ $header_name ] = $header_value;
					}
				}
			}

			$this->send_request(
				Arr::get( $webhook_feed, 'url', '' ),
				Arr::get( $webhook_feed, 'method', 'post' ),
				$processed_headers,
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
	 *
	 * @return array|WP_Error The response or WP_Error on failure.
	 */
	public function send_request( $url, $method, $headers, $body, $format ) {
		if ( empty( $url ) ) {
			return new \WP_Error( 'invalid_url', __( 'Empty webhook URL provided', 'quillbooking' ) );
		}

		$args = array(
			'method'  => strtoupper( $method ),
			'headers' => $headers,
			'timeout' => 15, // Increase timeout to handle slower webhook endpoints
		);

		if ( 'json' === $format ) {
			$args['headers']['Content-Type'] = 'application/json';
			$args['body']                    = json_encode( $body );
		} else {
			$args['body'] = http_build_query( $body );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			error_log(
				sprintf(
					'QuillBooking Webhook request failed: %s - URL: %s',
					$response->get_error_message(),
					$url
				)
			);
		} else {
			$response_code = wp_remote_retrieve_response_code( $response );
			if ( $response_code >= 400 ) {
				error_log(
					sprintf(
						'QuillBooking Webhook received error response: %s - URL: %s',
						$response_code,
						$url
					)
				);
			}
		}

		return $response;
	}
}
