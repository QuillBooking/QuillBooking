<?php

/**
 * Base Template Renderer
 *
 * Contains common functionality for all renderers
 */

namespace QuillBooking\Booking\Renderers;

use QuillBooking\Booking\Data\Booking_Data_Formatter;
use QuillBooking\Models\User_Model;
use QuillBooking\Models\Booking_Model;

abstract class Base_Template_Renderer {

	protected Booking_Data_Formatter $dataFormatter;

	public function __construct() {
		$this->dataFormatter = new Booking_Data_Formatter();
	}

	/**
	 * Get common head HTML
	 */
	protected function get_head( $title = '' ) {
		ob_start();
		?>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
			<meta http-equiv="Imagetoolbar" content="No" />
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title><?php echo esc_html( $title ?: __( 'Booking', 'quillbooking' ) ); ?></title>
			<meta name="robots" content="noindex">
			<?php do_action( 'wp_enqueue_scripts' ); ?>
		</head>
		<body class="quillbooking-body">
		<?php
		return ob_get_clean();
	}

	/**
	 * Get common footer HTML
	 */
	protected function get_footer() {
		ob_start();
		wp_footer();
		?>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}

	/**
	 * Enqueue common page assets
	 */
	protected function enqueue_page_assets() {
		wp_enqueue_script( 'quillbooking-page' );
		wp_enqueue_style( 'quillbooking-page' );
	}

	/**
	 * Enqueue React assets
	 */
	protected function enqueue_react_assets() {
		do_action( 'quillbooking_renderer_enqueue_scripts' );
		wp_enqueue_script( 'quillbooking-renderer' );
		wp_enqueue_style( 'quillbooking-renderer' );
	}

	/**
	 * Get event hosts data
	 */
	protected function get_event_hosts( $event ) {
		$ids   = $event->getTeamMembersAttribute() ?: array( $event->user->ID );
		$ids   = is_array( $ids ) ? $ids : array( $ids );
		$hosts = array();

		foreach ( $ids as $userId ) {
			$user = User_Model::find( $userId );
			if ( ! $user ) {
				continue;
			}
			$hosts[] = array(
				'id'    => $user->ID,
				'name'  => $user->display_name,
				'image' => get_avatar_url( $user->ID ),
			);
		}

		return $hosts;
	}

	/**
	 * Render React page helper
	 */
	protected function render_react_page( string $div_id ) {
		$this->enqueue_react_assets();
		echo $this->get_head();
		printf( '<div id="%s"></div>', esc_attr( $div_id ) );
		echo $this->get_footer();
		exit( 200 );
	}

	/**
	 * Render template page helper
	 */
	protected function render_template_page( string $template_path, array $variables = array() ) {
		if ( ! file_exists( $template_path ) ) {
			return false;
		}

		$this->enqueue_page_assets();
		extract( $variables );

		echo $this->get_head( $variables['title'] ?? '' );
		include $template_path;
		echo $this->get_footer();

		exit( 200 );
	}

	/**
	 * Check if booking can be cancelled based on advanced settings
	 *
	 * @param array  $advanced_settings Event advanced settings
	 * @param array  $booking_array Booking data array
	 * @param string $timezone Timezone for calculations
	 * @param object $merge_tags_manager Merge tags manager instance
	 * @return array Returns array with 'can_cancel' boolean and 'message' string
	 */
	protected function check_cancellation_permissions( $advanced_settings, $booking_array, $timezone, $merge_tags_manager ) {
		$can_cancel            = true;
		$cancel_denied_message = '';

		// Get booking model for merge tag processing
		$find_booking = Booking_Model::find( $booking_array['id'] );

		// Process merge tags for permission denied message
		$cancel_denied_message = $merge_tags_manager->process_merge_tags(
			$advanced_settings['permission_denied_message'] ?? '',
			$find_booking
		);

		// Check if attendee cannot cancel at event start
		if ( ! empty( $advanced_settings['attendee_cannot_cancel'] ) &&
			 $advanced_settings['attendee_cannot_cancel'] &&
			 $advanced_settings['cannot_cancel_time'] === 'event_start' ) {

			$can_cancel            = false;
			$cancel_denied_message = $cancel_denied_message ?: __( 'You do not have permission to cancel this booking.', 'quillbooking' );
		} else {
			// Check time-based cancellation restrictions
			$cancel_time_restriction = $advanced_settings['cannot_cancel_time'] ?? '';
			$cancel_time_value       = $advanced_settings['cannot_cancel_time_value'] ?? 24;
			$cancel_time_unit        = $advanced_settings['cannot_cancel_time_unit'] ?? 'hours';

			if ( $cancel_time_restriction === 'less_than' ) {
				try {
					$start_time = $booking_array['start_time'] ?? '';
					$start_dt   = new \DateTime( $start_time, new \DateTimeZone( 'UTC' ) );
					$start_dt->setTimezone( new \DateTimeZone( $timezone ) );

					$current_time     = new \DateTime( 'now', new \DateTimeZone( $timezone ) );
					$restriction_time = clone $start_dt;

					// Calculate the restriction time based on settings
					$time_modifier = "-{$cancel_time_value} {$cancel_time_unit}";
					$restriction_time->modify( $time_modifier );

					// If current time is past the restriction time, prevent cancellation
					if ( $current_time >= $restriction_time ) {
						$can_cancel            = false;
						$cancel_denied_message = $cancel_denied_message ?: __( 'Cancellation is no longer allowed for this booking.', 'quillbooking' );
					}
				} catch ( \Exception $e ) {
					// If there's an error with time calculation, allow cancellation for safety
					$can_cancel = true;
				}
			}
		}

		return array(
			'can_cancel' => $can_cancel,
			'message'    => $cancel_denied_message,
		);
	}

	/**
	 * Check if booking can be rescheduled based on advanced settings
	 *
	 * @param array  $advanced_settings Event advanced settings
	 * @param array  $booking_array Booking data array
	 * @param string $timezone Timezone for calculations
	 * @param object $merge_tags_manager Merge tags manager instance
	 * @return array Returns array with 'can_reschedule' boolean and 'message' string
	 */
	protected function check_reschedule_permissions( $advanced_settings, $booking_array, $timezone, $merge_tags_manager ) {
		$can_reschedule            = true;
		$reschedule_denied_message = '';

		// Get booking model for merge tag processing
		$find_booking = Booking_Model::find( $booking_array['id'] );

		// Process merge tags for permission denied message
		$reschedule_denied_message = $merge_tags_manager->process_merge_tags(
			$advanced_settings['reschedule_denied_message'] ?? '',
			$find_booking
		);

		// Check if attendee cannot reschedule at event start
		if ( ! empty( $advanced_settings['attendee_cannot_reschedule'] ) &&
			 $advanced_settings['attendee_cannot_reschedule'] &&
			 $advanced_settings['cannot_reschedule_time'] === 'event_start' ) {

			$can_reschedule            = false;
			$reschedule_denied_message = $reschedule_denied_message ?: __( 'You do not have permission to reschedule this booking.', 'quillbooking' );
		} else {
			// Check time-based reschedule restrictions
			$reschedule_time_restriction = $advanced_settings['cannot_reschedule_time'] ?? '';
			$reschedule_time_value       = $advanced_settings['cannot_reschedule_time_value'] ?? 24;
			$reschedule_time_unit        = $advanced_settings['cannot_reschedule_time_unit'] ?? 'hours';

			if ( $reschedule_time_restriction === 'event_start' || $reschedule_time_restriction === 'less_than' ) {
				try {
					$start_time = $booking_array['start_time'] ?? '';
					$start_dt   = new \DateTime( $start_time, new \DateTimeZone( 'UTC' ) );
					$start_dt->setTimezone( new \DateTimeZone( $timezone ) );

					$current_time     = new \DateTime( 'now', new \DateTimeZone( $timezone ) );
					$restriction_time = clone $start_dt;

					// Calculate the restriction time based on settings
					$time_modifier = "-{$reschedule_time_value} {$reschedule_time_unit}";
					$restriction_time->modify( $time_modifier );

					// If current time is past the restriction time, prevent rescheduling
					if ( $current_time >= $restriction_time ) {
						$can_reschedule            = false;
						$reschedule_denied_message = $reschedule_denied_message ?: __( 'Rescheduling is no longer allowed for this booking.', 'quillbooking' );
					}
				} catch ( \Exception $e ) {
					// If there's an error with time calculation, allow rescheduling for safety
					$can_reschedule = true;
				}
			}
		}

		return array(
			'can_reschedule' => $can_reschedule,
			'message'        => $reschedule_denied_message,
		);
	}

	// /**
	// * Render method - must be implemented by child classes
	// *
	// * @param mixed ...$args Variable arguments depending on renderer type
	// * @return mixed|false Returns rendered content or false on failure
	// */
	// abstract public function render( ...$args );
}
