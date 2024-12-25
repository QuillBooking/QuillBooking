<?php
/**
 * Class Settings REST Controller
 * This class is responsible for handling the Settings REST API
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateways\Stripe\REST_API;

use QuillBooking\Payment_Gateway\REST_API\REST_Settings_Controller as Abstract_REST_Settings_Controller;
use Stripe\Exception;
use Stripe\StripeClient;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Rest Settings Controller
 */
class REST_Settings_Controller extends Abstract_REST_Settings_Controller {

	const WEBHOOK_EVENTS = array(
		'charge.captured',
		'charge.expired',
		'charge.failed',
		'charge.refunded',
		'charge.succeeded',
		'charge.dispute.closed',
		'charge.dispute.created',
		'checkout.session.completed',
		'customer.subscription.created',
		'customer.subscription.deleted',
		'customer.subscription.updated',
		'invoice.payment_failed',
		'invoice.payment_succeeded',
		'payment_intent.amount_capturable_updated',
		'payment_intent.payment_failed',
		'payment_intent.requires_action',
		'payment_intent.succeeded',
		'review.closed',
		'review.opened',
		'setup_intent.setup_failed',
		'setup_intent.succeeded',
		'source.canceled',
		'source.chargeable',
	);

	/**
	 * Retrieves schema, conforming to JSON Schema.
	 * Should include context for gettable data
	 * Should specify additionalProperties & readonly to specify updatable data
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'settings',
			'type'       => 'object',
			'context'    => array( 'view' ),
			'properties' => array(
				'mode'                    => array(
					'type'     => 'string',
					'required' => true,
					'enum'     => array( 'live', 'test' ),
				),
				'test_publishable_key'    => array(
					'type' => 'string',
				),
				'test_secret_key'         => array(
					'type' => 'string',
				),
				'test_webhook_id'         => array(
					'type'    => 'string',
					'context' => array(),
				),
				'test_webhook_secret'     => array(
					'type'    => 'string',
					'context' => array(),
				),
				'live_publishable_key'    => array(
					'type' => 'string',
				),
				'live_secret_key'         => array(
					'type' => 'string',
				),
				'live_webhook_id'         => array(
					'type'    => 'string',
					'context' => array(),
				),
				'live_webhook_secret'     => array(
					'type'    => 'string',
					'context' => array(),
				),
				'customer_elements_label' => array(
					'type' => 'string',
				),
				'customer_checkout_label' => array(
					'type' => 'string',
				),
			),
		);

		return rest_default_additional_properties_to_false( $schema );
	}

	/**
	 * Updates settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update( $request ) {
		$settings = $request->get_json_params();

		// to avoid unexplained errors to user, only connect to current user viewable keys.
		$mode                 = $settings['mode'];
		$publishable_key_name = "{$mode}_publishable_key";
		$secret_key_name      = "{$mode}_secret_key";
		$publishable_key      = trim( $settings[ $publishable_key_name ] ?? '' );
		$secret_key           = trim( $settings[ $secret_key_name ] ?? '' );

		// ensure existence.
		if ( empty( $publishable_key ) || empty( $secret_key ) ) {
			return new WP_Error( 'quillbooking_stripe_settings_update', esc_html__( 'Both publishable and secret keys are required', 'quillbooking' ) );
		}

		// ensure publishable key format.
		if ( substr( $publishable_key, 0, 8 ) !== "pk_{$mode}_" ) {
			/* translators: %s: Key prefix. */
			return new WP_Error( 'quillbooking_stripe_settings_update', sprintf( esc_html__( 'Publishable key must start with %s', 'quillbooking' ), "pk_{$mode}_" ) );
		}

		// ensure secret key format.
		if ( ! in_array( substr( $secret_key, 0, 8 ), array( "sk_{$mode}_", "rk_{$mode}_" ), true ) ) {
			/* translators: %s: Key prefix. */
			return new WP_Error( 'quillbooking_stripe_settings_update', sprintf( esc_html__( 'Secret key must start with %s', 'quillbooking' ), "sk_{$mode}_ or rk_{$mode}_" ) );
		}

		// check if keys aren't changed.
		$current_settings = $this->payment_gateway->get_settings();
		if ( ( $current_settings[ $publishable_key_name ] ?? null ) === $publishable_key && ( $current_settings[ $secret_key_name ] ?? null ) === $secret_key ) {
			$this->payment_gateway->update_settings(
				array(
					'mode'                    => $mode,
					'customer_elements_label' => $settings['customer_elements_label'] ?? '',
					'customer_checkout_label' => $settings['customer_checkout_label'] ?? '',
				)
			);
			return new WP_REST_Response(
				array(
					'success' => true,
					'updated' => false,
				)
			);
		}

		// create webhook.
		try {
			$webhook = $this->create_webhook( $secret_key, $mode );
		} catch ( Exception $e ) {
			return new WP_Error( 'quillbooking_stripe_create_webhook', esc_html__( 'Cannot create webhook: ', 'quillbooking' ) . $e->getMessage() );
		}

		// update settings.
		$this->payment_gateway->update_settings(
			array(
				'mode'                    => $mode,
				"{$mode}_publishable_key" => $publishable_key,
				"{$mode}_secret_key"      => $secret_key,
				"{$mode}_webhook_id"      => $webhook->id,
				"{$mode}_webhook_secret"  => $webhook->secret,
				'customer_elements_label' => $settings['customer_elements_label'] ?? '',
				'customer_checkout_label' => $settings['customer_checkout_label'] ?? '',
			)
		);

		return new WP_REST_Response(
			array(
				'success' => true,
				/* translators: %s: Mode. */
				'message' => sprintf( esc_html__( 'Account connected successfully at %s mode.', 'quillbooking' ), $mode ),
				'updated' => true,
			)
		);
	}

	/**
	 * Create webhook
	 *
	 * @since 1.0.0
	 *
	 * @param string $secret_key Secret key.
	 * @param string $mode Mode.
	 * @throws Exception Exception if webhook created but cannot find id or secret.
	 * @return WebhookEndpoint
	 */
	private function create_webhook( $secret_key, $mode ) {
		$webhook_url = $this->get_webhook_url( $mode );

		$stripe = new StripeClient( $secret_key );

		// delete old webhook if exists.
		$webhooks = $stripe->webhookEndpoints->all( [ 'limit' => 100 ] ); // phpcs:ignore
		foreach ( $webhooks->data as $webhook ) {
			if ( $webhook_url === $webhook->url ) {
				$stripe->webhookEndpoints->delete( $webhook->id ); // phpcs:ignore
			}
		}

		// create a new webhook.
		$webhook = $stripe->webhookEndpoints->create(  // phpcs:ignore
			array(
				'url'            => $webhook_url,
				'enabled_events' => self::WEBHOOK_EVENTS,
			)
		);

		// ensure webhook id and secret.
		if ( empty( $webhook->id ) || empty( $webhook->secret ) ) {
			throw new Exception( 'cannot find id and secret' );
		}

		return $webhook;
	}

	/**
	 * Get webhook url
	 *
	 * @since 1.0.0
	 *
	 * @param string $mode Mode.
	 * @return string
	 */
	private function get_webhook_url( $mode ) {
		return site_url( "?quillbooking_stripe_webhook=$mode", 'https' );
	}
}
