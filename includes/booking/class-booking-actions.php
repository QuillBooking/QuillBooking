<?php
namespace QuillBooking\Booking;

use QuillBooking\Booking\Booking_Validator;
use Illuminate\Support\Arr;

class Booking_Actions {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'wp_loaded', array( $this, 'init' ) );
	}

	/**
	 * Initialize
	 */
	public function init() {
		$this->process_booking_action( 'reject', 'rejected', __( 'Booking rejected', 'quillbooking' ), __( 'Booking rejected by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'confirm', 'scheduled', __( 'Booking confirmed', 'quillbooking' ), __( 'Booking confirmed by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'reschedule', 'rescheduled', __( 'Booking rescheduled', 'quillbooking' ), __( 'Booking rescheduled by Attendee', 'quillbooking' ) );
		$this->process_booking_action( 'cancel', 'cancelled', __( 'Booking cancelled', 'quillbooking' ), __( 'Booking cancelled by Attendee', 'quillbooking' ) );
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
		exit;
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
