<?php
/**
 * Confirm Page Renderer
 */

namespace QuillBooking\Booking\Renderers;

class Confirm_Page_Renderer extends Base_Template_Renderer {

	private string $eventModelClass;

	public function __construct( string $eventModelClass ) {
		parent::__construct();
		$this->eventModelClass = $eventModelClass;
	}

	public function render( $booking ) {
		$booking_array          = $this->dataFormatter->format_booking_data( $booking );
		$booking_array['hosts'] = array();

		foreach ( $booking->hosts as $host ) {
			$booking_array['hosts'][] = array(
				'name'  => $host->display_name ?? $host->name ?? '',
				'image' => $host->image ?? ( $host->avatar ?? '' ),
				'email' => $host->user_email ?? $host->email ?? '',
			);
		}
		// $this->get_event_hosts( $booking );

		// Get advanced settings and merge tags manager
		$advanced_settings  = $booking_array['event']['advanced_settings'] ?? array();
		$timezone           = $booking_array['timezone'] ?? 'UTC';
		$merge_tags_manager = \QuillBooking\Managers\Merge_Tags_Manager::instance();

		// Check permissions using the base class methods
		$cancel_permissions     = $this->check_cancellation_permissions( $advanced_settings, $booking_array, $timezone, $merge_tags_manager );
		$reschedule_permissions = $this->check_reschedule_permissions( $advanced_settings, $booking_array, $timezone, $merge_tags_manager );

		$template_path = QUILLBOOKING_PLUGIN_DIR . 'src/templates/confirm.php';

		return $this->render_template_page(
			$template_path,
			array(
				'booking_array'             => $booking_array,
				'title'                     => $booking->event->name ?? __( 'Booking Confirmation', 'quillbooking' ),
				'can_cancel'                => $cancel_permissions['can_cancel'],
				'cancel_denied_message'     => $cancel_permissions['message'],
				'can_reschedule'            => $reschedule_permissions['can_reschedule'],
				'reschedule_denied_message' => $reschedule_permissions['message'],
			)
		);
	}
}
