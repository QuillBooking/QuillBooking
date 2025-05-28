<?php
/**
 * Class WooCommerce
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\WooCommerce;

use QuillBooking\Traits\Singleton;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Utils;
use Illuminate\Support\Arr;

/**
 * WooCommerce class.
 */
class WooCommerce {








	use Singleton;

	/**
	 * Booking model.
	 *
	 * @var Booking_Model
	 */
	protected $booking;

	/**
	 * Constructor.
	 */
	private function __construct() {
		// if ( ! class_exists( 'WooCommerce' ) ) {
		// return;
		// }

		add_action( 'quillbooking_after_booking_created', array( $this, 'after_booking_created' ), 10, 2 );
		add_filter( 'woocommerce_get_item_data', array( $this, 'add_custom_item_data' ), 10, 2 );
		add_action( 'woocommerce_order_status_changed', array( $this, 'order_status_changed' ), 10, 3 );
		add_filter( 'woocommerce_checkout_create_order_line_item_object', array( $this, 'add_booking_id_to_order_item_meta' ), 10, 4 );
		add_filter( 'woocommerce_hidden_order_itemmeta', array( $this, 'add_booking_to_order_item_meta' ), 10, 1 );
		add_action( 'woocommerce_thankyou', array( $this, 'thankyou_page' ) );
	}

	/**
	 * After booking created.
	 *
	 * @param Booking_Model $booking Booking model.
	 * @param array         $args    Arguments.
	 */
	public function after_booking_created( $booking, $args ) {
		if ( ! $this->ensure_availability( $booking ) ) {
			return;
		}

		$this->ajax_ensure_availability( $booking );
		$this->booking = $booking;

		// Check if this is a multi-duration event with different products
		$product_id     = null;
		$event_settings = $booking->event->payments_settings;

		if ( isset( $event_settings['enable_items_based_on_duration'] ) && $event_settings['enable_items_based_on_duration'] ) {
			// Get the duration from the booking
			$duration     = $booking->slot_time;
			$duration_str = (string) $duration;

			// Get the product ID for this duration
			if ( isset( $event_settings['multi_duration_items'][ $duration_str ]['woo_product'] ) ) {
				$product_id = $event_settings['multi_duration_items'][ $duration_str ]['woo_product'];
			}
		} else {
			// Use the default product
			$product_id = $booking->event->payments_settings['woo_product'];
		}

		if ( ! $product_id ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Product not found for this duration.', 'quillbooking' ) ), 400 );
			exit;
		}

		$product = wc_get_product( $product_id );
		if ( ! $product || ! $product->get_id() ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Product not found.', 'quillbooking' ) ), 400 );
			exit;
		}

		$start_date = new \DateTime( $booking->start_date );
		$start_date->setTimezone( new \DateTimeZone( $booking->timezone ) );
		// Clear cart.
		WC()->cart->empty_cart();
		$quantity = 1;
		WC()->cart->add_to_cart(
			$product->get_id(),
			$quantity,
			0,
			array(),
			array(
				'quillbooking_id' => $booking->id,
				'start_date'      => $start_date,
				'guest_timezone'  => $booking->timezone,
			)
		);

		$booking->order()->create(
			array(
				'payment_method' => 'woocommerce',
				'status'         => 'pending',
				'total'          => floatval( $product->get_price() ) * (int) $quantity,
				'currency'       => get_woocommerce_currency(),
				'items'          => array(
					array(
						'product_id' => $product->get_id(),
						'quantity'   => $quantity,
						'price'      => $product->get_price(),
					),
				),
			)
		);

		$checkout_url = wc_get_checkout_url();

		wp_send_json_success( array( 'url' => $checkout_url ) );
	}

	/**
	 * Add custom item data to the cart item.
	 *
	 * @param array $cart_item_data Cart item data.
	 * @param array $cart_item      Cart item.
	 *
	 * @return array
	 */
	public function add_custom_item_data( $cart_item_data, $cart_item ) {
		if ( ! isset( $cart_item['quillbooking_id'] ) ) {
			return $cart_item_data;
		}
		$booking = Booking_Model::find( $cart_item['quillbooking_id'] );
		if ( ! $booking ) {
			return $cart_item_data;
		}

		$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		$start_date->setTimezone( new \DateTimeZone( $booking->timezone ) );

		$cart_item_data[] = array(
			'key'     => __( 'Event', 'quillbooking' ),
			'display' => $booking->event->name,
		);

		$cart_item_data[] = array(
			'name'    => __( 'Start Date', 'quillbooking' ),
			'display' => $start_date->format( 'F j, Y' ) . ' ' . $start_date->format( 'h:i A' ) . ' ' . '(' . $booking->timezone . ')',
		);

		return $cart_item_data;
	}

	/**
	 * Order status changed.
	 *
	 * @param int    $order_id Order ID.
	 * @param string $old_status Old status.
	 * @param string $new_status New status.
	 */
	public function order_status_changed( $order_id, $old_status, $new_status ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		$booking_id = $order->get_meta( 'quillbooking_id' );
		if ( ! $booking_id ) {
			return;
		}

		$booking = Booking_Model::find( $booking_id );
		if ( ! $booking ) {
			return;
		}

		$paid_statuses = wc_get_is_paid_statuses();
		if ( in_array( $new_status, $paid_statuses, true ) ) {
			$booking->status = 'scheduled';
			$booking->save();
			$booking->order()->update( array( 'status' => 'paid' ) );
			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Order paid.', 'quillbooking' ),
					'details' => sprintf( __( 'Order #%1$s paid. Status changed from %2$s to %3$s. <a href="%4$s">View order</a>', 'quillbooking' ), $order_id, $old_status, $new_status, $order->get_edit_order_url() ),
				)
			);

			return;
		}

		if ( 'refunded' === $new_status ) {
			$booking->status = 'cancelled';
			$booking->save();
			$booking->order()->update( array( 'status' => 'refunded' ) );
			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => __( 'Order refunded.', 'quillbooking' ),
					'details' => sprintf( __( 'Order #%1$s refunded. Status changed from %2$s to %3$s. <a href="%4$s">View order</a>', 'quillbooking' ), $order_id, $old_status, $new_status, $order->get_edit_order_url() ),
				)
			);
			return;
		}
	}

	/**
	 * Add booking ID to order item meta
	 *
	 * @param \WC_Order_Item_Product $item
	 * @param string                 $cart_item_key
	 * @param array                  $values
	 * @param \WC_Order              $order
	 * @return \WC_Order_Item_Product
	 */
	public function add_booking_id_to_order_item_meta( $item, $cart_item_key, $values, $order ) {
		error_log( wp_json_encode( $values ) );
		if ( isset( $values['quillbooking_id'] ) ) {
			$item->add_meta_data( 'quillbooking_id', $values['quillbooking_id'] );
			$order->update_meta_data( 'quillbooking_id', $values['quillbooking_id'] );
		}
		return $item;
	}

	/**
	 * Add booking ID to order item meta
	 *
	 * @param array $hidden_meta
	 * @return array
	 */
	public function add_booking_to_order_item_meta( $hidden_meta ) {
		$hidden_meta[] = 'quillbooking_id';
		return $hidden_meta;
	}

	/**
	 * Thank you page
	 *
	 * @param int $order_id
	 */
	public function thankyou_page( $order_id ) {
		$order      = wc_get_order( $order_id );
		$booking_id = $order->get_meta( 'quillbooking_id' );
		if ( ! $booking_id ) {
			return;
		} ?>
		<div class="quillbooking-thankyou">
			<h2 class="woocommerce-column__title"><?php esc_html_e( 'Booking Details', 'quillbooking' ); ?></h2>
			<?php
			$booking = Booking_Model::find( $booking_id );
			if ( ! $booking ) {
				return;
			}

			$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
			$start_date->setTimezone( new \DateTimeZone( $booking->timezone ) );
			?>
			<p><strong><?php esc_html_e( 'Event:', 'quillbooking' ); ?></strong>
				<?php echo esc_html( $booking->event->name ); ?></p>
			<p><strong><?php esc_html_e( 'Start Date:', 'quillbooking' ); ?></strong>
				<?php echo esc_html( $start_date->format( 'F j, Y h:i A' ) . ' (' . $booking->timezone . ')' ); ?></p>
			<p><strong><?php esc_html_e( 'Status:', 'quillbooking' ); ?></strong> <?php echo esc_html( $booking->status ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Ensure availability of method
	 * This function ensure that the method is enabled and configured.
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return void|bool
	 */
	private function ajax_ensure_availability( $booking ) {
		if ( ! Arr::get( $booking->event->payments_settings, 'enable_payment' ) ) {
			wp_send_json_error( array( 'message' => esc_html__( 'Payments are disabled for this event.', 'quillbooking' ) ), 400 );
			exit;
		}

		if ( ! Arr::get( $booking->event->payments_settings, 'woo_product', false ) ) {
			wp_send_json_error( array( 'message' => esc_html__( "This payment method isn't enabled.", 'quillbooking' ) ), 400 );
			exit;
		}
	}

	/**
	 * Ensure availability of method
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return bool
	 */
	private function ensure_availability( $booking ) {
		if ( ! Arr::get( $booking->event->payments_settings, 'enable_payment' ) || 'woocommerce' !== Arr::get( $booking->event->payments_settings, 'type' ) ) {
			return false;
		}

		if ( ! Arr::get( $booking->event->payments_settings, 'woo_product', false ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Get product price for an event.
	 *
	 * @since 1.0.0
	 *
	 * @param array       $event_payments_settings Event payment settings.
	 * @param string|null $duration Optional duration for multi-duration events.
	 *
	 * @return array|false Price data or false if not available.
	 */
	public static function get_product_price( $event_payments_settings, $duration = null ) {
		error_log( 'QuillBooking WooCommerce: get_product_price called with duration: ' . $duration );
		error_log( 'QuillBooking WooCommerce: Payment settings: ' . wp_json_encode( $event_payments_settings ) );

		if ( ! Arr::get( $event_payments_settings, 'enable_payment' ) || 'woocommerce' !== Arr::get( $event_payments_settings, 'type' ) ) {
			error_log( 'QuillBooking WooCommerce: Payment not enabled or not WooCommerce type' );
			return false;
		}

		// Check if this is a multi-duration request
		if ( $duration && Arr::get( $event_payments_settings, 'enable_items_based_on_duration' ) ) {
			error_log( 'QuillBooking WooCommerce: Processing multi-duration request for duration: ' . $duration );

			// Get the product ID for this specific duration
			$product_id = Arr::get( $event_payments_settings, "multi_duration_items.{$duration}.woo_product", false );
			error_log( 'QuillBooking WooCommerce: Product ID for duration ' . $duration . ': ' . $product_id );

			if ( ! $product_id ) {
				error_log( 'QuillBooking WooCommerce: No product ID found for duration ' . $duration );
				return false;
			}
		} else {
			$product_id = Arr::get( $event_payments_settings, 'woo_product', false );
			error_log( 'QuillBooking WooCommerce: Using default product ID: ' . $product_id );

			if ( ! $product_id ) {
				error_log( 'QuillBooking WooCommerce: No default product ID found' );
				return false;
			}
		}

		$product = wc_get_product( $product_id );
		if ( ! $product || ! $product->get_id() ) {
			error_log( 'QuillBooking WooCommerce: Product not found for ID: ' . $product_id );
			return false;
		}

		$price_data = array(
			'price'        => $product->get_price(),
			'currency'     => get_woocommerce_currency(),
			'product_id'   => $product->get_id(),
			'product_name' => $product->get_name(),
		);

		error_log( 'QuillBooking WooCommerce: Returning price data: ' . wp_json_encode( $price_data ) );
		return $price_data;
	}
}
