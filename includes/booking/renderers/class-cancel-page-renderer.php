<?php

/**
 * Cancel Page Renderer
 */

namespace QuillBooking\Booking\Renderers;

class Cancel_Page_Renderer extends Base_Template_Renderer {

	private string $eventModelClass;

	public function __construct( string $eventModelClass ) {
		parent::__construct();
		$this->eventModelClass = $eventModelClass;
	}

	public function render( $booking ) {
		$event = $this->eventModelClass::where( 'slug', $booking['event']['slug'] )->first();
		$fields = $event->getFieldsAttribute();
		$other_fields = $fields['other'];

		$booking_array = $this->dataFormatter->format_booking_data( $booking );
		$booking_array['hosts'] = $this->get_event_hosts( $booking->event );

		$template_path = QUILLBOOKING_PLUGIN_DIR . 'src/templates/cancel.php';

		return $this->render_template_page( $template_path, [
			'booking_array' => $booking_array,
			'fields'        => $other_fields,
			'title'         => __( 'Cancel Booking', 'quillbooking' )
		]);
	}
}
