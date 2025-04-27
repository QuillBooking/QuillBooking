<?php
namespace QuillBooking\Booking;

use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use Illuminate\Support\Arr;

class Booking_Actions {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'wp_loaded', array( $this, 'init' ) );

		// Enqueue scripts and styles
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

		/**
		 * Enqueue Scripts.
		 *
		 * @since 1.0.0
		 */
	public function enqueue_scripts() {
		$asset_file   = QUILLBOOKING_PLUGIN_DIR . 'build/renderer/index.asset.php';
		$asset        = file_exists( $asset_file ) ? require $asset_file : null;
		$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version      = isset( $asset['version'] ) ? $asset['version'] : QUILLBOOKING_VERSION;

		wp_register_script(
			'quillbooking-renderer',
			QUILLBOOKING_PLUGIN_URL . 'build/renderer/index.js',
			$dependencies,
			$version,
			true
		);

		// Localize script
		wp_localize_script(
			'quillbooking-renderer',
			'quillbooking_config',
			apply_filters(
				'quillbooking_config',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'quillbooking' ),
					'url'      => home_url(),
					'lang'     => get_locale(),
				)
			)
		);

		// Register styles.
		wp_register_style(
			'quillbooking-renderer',
			QUILLBOOKING_PLUGIN_URL . 'build/renderer/style.css',
			array(),
			$version
		);

		// RTL styles.
		wp_style_add_data( 'quillbooking-renderer', 'rtl', 'replace' );
	}

	/**
	 * Initialize
	 */
	public function init() {
		$this->render_booking_page();
		$this->process_booking_action( 'reject', 'rejected', __( 'Booking rejected', 'quillbooking' ), __( 'Booking rejected by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'confirm', 'scheduled', __( 'Booking confirmed', 'quillbooking' ), __( 'Booking confirmed by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'reschedule', 'rescheduled', __( 'Booking rescheduled', 'quillbooking' ), __( 'Booking rescheduled by Attendee', 'quillbooking' ) );
		$this->process_booking_action( 'cancel', 'cancelled', __( 'Booking cancelled', 'quillbooking' ), __( 'Booking cancelled by Attendee', 'quillbooking' ) );
	}

	/**
	 * Render booking page
	 *
	 * @return void
	 */
	public function render_booking_page() {
		$calendar = Arr::get( $_GET, 'quillbooking_calendar', null );
		if ( ! $calendar ) {
			return;
		}

		$calendar = Calendar_Model::where( 'slug', $calendar )->first();
		if ( ! $calendar ) {
			return;
		}

		$event_slug = Arr::get( $_GET, 'event', null );
		$event      = Event_Model::where( 'slug', $event_slug )
			->where( 'calendar_id', $calendar->id )
			->first();
		if ( ! $event && $event_slug ) {
			return;
		}

		// Enqueue scripts and styles
		wp_enqueue_script( 'quillbooking-renderer' );
		wp_enqueue_style( 'quillbooking-renderer' );

		add_filter(
			'quillbooking_config',
			function( $config ) use ( $calendar, $event ) {
				$config['calendar'] = $calendar->toArray();
				if ( $event ) {
					$config['event'] = $event->toArray();
				}
				return $config;
			}
		);

		echo $this->get_head();
		?>
		<div id="quillbooking-booking-page">
		</div>
		<?php
		echo $this->get_footer();
		return true;
	}

	/**
	 * Process booking action
	 *
	 * @param string $action_type Action type.
	 * @param string $new_status New status.
	 * @param string $log_message Log message.
	 * @param string $log_details Log details.
	 *
	 * @return void
	 */
	public function process_booking_action( $action_type, $new_status, $log_message, $log_details ) {
		$action = Arr::get( $_GET, 'quillbooking_action', null );
		if ( $action_type !== $action ) {
			return;
		}

		echo $this->get_head();

		try {
			// Validate booking ID
			$id      = sanitize_text_field( Arr::get( $_GET, 'id', null ) );
			$booking = Booking_Validator::validate_booking( $id );

			// Check if booking is already completed
			if ( $booking->status === $new_status ) {
				throw new \Exception( sprintf( __( 'Booking is already %s', 'quillbooking' ), $new_status ) );
			}

			// Update booking status
			$booking->status = $new_status;
			$booking->save();

			// Log the action
			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => $log_message,
					'details' => $log_details,
				)
			);

			// Trigger action hook
			do_action( "quillbooking_booking_{$action_type}", $booking );

			// Display success message
			echo $this->generate_success_message( ucfirst( $action_type ), $new_status );

		} catch ( \Exception $e ) {
			// Catch validation or action-related exceptions and display error message
			echo $this->generate_error_message( ucfirst( $action_type ), $e->getMessage() );
		}

		echo $this->get_footer();
		return true;
	}

	/**
	 * Generate success message
	 *
	 * @param string $action Action.
	 * @param string $status Status.
	 *
	 * @return string
	 */
	public function generate_success_message( $action, $status ) {
		return sprintf(
			'<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9f9f9; font-family: Arial, sans-serif;">
                <div style="text-align: center; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 400px;">
                    <h1 style="color: #5bc0de; font-size: 24px; margin-bottom: 10px;">%s</h1>
                    <p style="font-size: 16px; color: #555;">%s</p>
                </div>
            </div>',
			esc_html__( "{$action} Successful", 'quillbooking' ),
			esc_html__( "The booking has been successfully {$status}.", 'quillbooking' )
		);
	}

	/**
	 * Generate error message
	 *
	 * @param string $action Action.
	 * @param string $message Message.
	 *
	 * @return string
	 */
	public function generate_error_message( $action, $message ) {
		return sprintf(
			'<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9f9f9; font-family: Arial, sans-serif;">
                <div style="text-align: center; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 400px;">
                    <h1 style="color: #d9534f; font-size: 24px; margin-bottom: 10px;">%s</h1>
                    <p style="font-size: 16px; color: #555;">%s</p>
                </div>
            </div>',
			esc_html__( "{$action} Failed", 'quillbooking' ),
			esc_html( $message )
		);
	}

	/**
	 * Get head
	 *
	 * @return string
	 */
	public function get_head() {
		ob_start();
		?>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
			"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
			<meta http-equiv="Imagetoolbar" content="No"/>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title><?php esc_html_e( 'Request Unsubscribe', 'quillbooking' ); ?></title>
			<meta name="robots" content="noindex">
			<?php wp_head(); ?>
		</head>
		<body class="quillbooking-body">
		<?php
		return ob_get_clean();
	}

	/**
	 * Get footer
	 *
	 * @return string
	 */
	public function get_footer() {
		ob_start();
		wp_footer();
		?>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}
}
