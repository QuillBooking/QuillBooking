<?php

/**
 * Booking Actions
 *
 * This class is responsible for handling booking actions
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Booking;

use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use Illuminate\Support\Arr;
use QuillBooking\Models\User_Model;

class Booking_Actions {



	// --- Dependency Properties ---
	private string $calendarModelClass;
	private string $eventModelClass;
	private string $bookingValidatorClass; // Inject validator class name too

	public function __construct(
		string $calendarModelClass = Calendar_Model::class,
		string $eventModelClass = Event_Model::class,
		string $bookingValidatorClass = Booking_Validator::class
	) {
		$this->calendarModelClass    = $calendarModelClass;
		$this->eventModelClass       = $eventModelClass;
		$this->bookingValidatorClass = $bookingValidatorClass;

		add_action( 'wp_loaded', array( $this, 'init' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	public function enqueue_scripts() {
		 $asset_file  = QUILLBOOKING_PLUGIN_DIR . 'build/renderer/index.asset.php';
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

		wp_register_style(
			'quillbooking-renderer',
			QUILLBOOKING_PLUGIN_URL . 'build/renderer/style.css',
			array(),
			$version
		);

		wp_style_add_data( 'quillbooking-renderer', 'rtl', 'replace' );
	}

	public function init() {
		$this->render_booking_page();
		$this->process_booking_action( 'reject', 'rejected', __( 'Booking rejected', 'quillbooking' ), __( 'Booking rejected by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'confirm', 'scheduled', __( 'Booking confirmed', 'quillbooking' ), __( 'Booking confirmed by Organizer', 'quillbooking' ) );
		$this->process_booking_action( 'reschedule', 'rescheduled', __( 'Booking rescheduled', 'quillbooking' ), __( 'Booking rescheduled by Attendee', 'quillbooking' ) );
		$this->process_booking_action( 'cancel', 'cancelled', __( 'Booking cancelled', 'quillbooking' ), __( 'Booking cancelled by Attendee', 'quillbooking' ) );
	}

	public function render_booking_page() {
		 $calendar = Arr::get( $_GET, 'quillbooking_calendar', null );

		if ( ! $calendar ) {
			return;
		}

		$calendar = $this->calendarModelClass::where( 'slug', $calendar )->first();
		if ( ! $calendar ) {
			return;
		}
		$event_slug = Arr::get( $_GET, 'event', null );
		$event      = $this->eventModelClass::where( 'slug', $event_slug )
			->where( 'calendar_id', $calendar->id )
			->first();

		$usersId = $event->getTeamMembersAttribute() ?: array( $event->user->ID );
		$usersId = is_array( $usersId ) ? $usersId : array( $usersId );

		$users = array();

		foreach ( $usersId as $userId ) {
				$user = User_Model::find( $userId );

			if ( $user ) {
					$user_avatar_url = get_avatar_url( $user->ID );

					$users[] = array(
						'id'    => $user->ID,
						'name'  => $user->display_name,
						'image' => $user_avatar_url,
					);
			}
		}

		$event->hosts             = $users;
		$event->availability_data = $event->getAvailabilityAttribute();
		$event->reserve           = $event->getReserveTimesAttribute();

		if ( ! $event && $event_slug ) {
			return;
		}

		wp_enqueue_script( 'quillbooking-renderer' );
		wp_enqueue_style( 'quillbooking-renderer' );

		add_filter(
			'quillbooking_config',
			function ( $config ) use ( $calendar, $event ) {
				$config['calendar'] = $calendar->toArray();
				if ( $event ) {
					$config['event'] = $event->toArray();
				}
				return $config;
			}
		);

		echo $this->get_head();
		?>
		<div id="quillbooking-booking-page"></div>
		<?php
		echo $this->get_footer();
		return true;
	}

	public function process_booking_action( $action_type, $new_status, $log_message, $log_details ) {
		$action = Arr::get( $_GET, 'quillbooking_action', null );
		if ( $action_type !== $action ) {
			return;
		}

		try {
			$id      = sanitize_text_field( Arr::get( $_GET, 'id', null ) );
			$booking = $this->bookingValidatorClass::validate_booking( $id );

			if ( $booking->status === $new_status ) {
				throw new \Exception( sprintf( __( 'Booking is already %s', 'quillbooking' ), $new_status ) );
			}

			$booking->status = $new_status;
			$booking->save();

			$booking->logs()->create(
				array(
					'type'    => 'info',
					'message' => $log_message,
					'details' => $log_details,
				)
			);

			do_action( "quillbooking_booking_{$action_type}", $booking );

			wp_send_json_success( $this->generate_success_message( ucfirst( $action_type ), $new_status ) );
		} catch ( \Exception $e ) {
			wp_send_json_error( $this->generate_error_message( ucfirst( $action_type ), $e->getMessage() ) );
		}
	}

	public function generate_success_message( $action, $status ) {
		return array(
			'status'  => 'success',
			'title'   => sprintf( __( '%s Successful', 'quillbooking' ), ucfirst( $action ) ),
			'message' => sprintf( __( 'The booking has been successfully %s.', 'quillbooking' ), $status ),
		);
	}

	public function generate_error_message( $action, $message ) {
		return array(
			'status'  => 'error',
			'title'   => sprintf( __( '%s Failed', 'quillbooking' ), ucfirst( $action ) ),
			'message' => $message,
		);
	}

	public function get_head() {
		ob_start();
		?>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>

		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
			<meta http-equiv="Imagetoolbar" content="No" />
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title><?php esc_html_e( 'Request Unsubscribe', 'quillbooking' ); ?></title>
			<meta name="robots" content="noindex">
			<?php wp_head(); ?>
		</head>

		<body class="quillbooking-body">
		<?php
		return ob_get_clean();
	}

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
