<?php

/**
 * Reschedule Page Renderer (React)
 */

namespace QuillBooking\Booking\Renderers;

use Illuminate\Support\Arr;

class Reschedule_Page_Renderer extends Base_Template_Renderer {

	private string $eventModelClass;
	private string $bookingValidatorClass;
	private string $globalSettingsClass;
	private string $calendarModelClass;

	public function __construct(
		string $eventModelClass,
		string $bookingValidatorClass,
		string $globalSettingsClass,
		string $calendarModelClass
	) {
		parent::__construct();
		$this->eventModelClass       = $eventModelClass;
		$this->bookingValidatorClass = $bookingValidatorClass;
		$this->globalSettingsClass   = $globalSettingsClass;
		$this->calendarModelClass    = $calendarModelClass;
	}

	public function render( $booking ) {
		$global_settings = $this->globalSettingsClass::get_all();

		if ( ! $booking || ! $booking->event ) {
			wp_redirect( home_url() );
			exit;
		}

		$calendar = $this->calendarModelClass::where( 'id', $booking->event->calendar_id )->first();
		if ( ! $calendar ) {
			wp_redirect( home_url() );
			exit;
		}

		$event                    = $booking->event;
		$event->hosts             = $this->get_event_hosts( $event );
		$event->fields            = $event->getFieldsAttribute();
		$event->availability_data = $event->getAvailabilityAttribute();
		$event->reserve           = $event->getReserveTimesAttribute();
		$event->advanced_settings = $event->getAdvancedSettingsAttribute();

		// Check reschedule permissions
		$booking_array          = $this->dataFormatter->format_booking_data( $booking );
		$advanced_settings      = $event->advanced_settings ?? array();
		$timezone               = $booking_array['timezone'] ?? 'UTC';
		$merge_tags_manager     = \QuillBooking\Managers\Merge_Tags_Manager::instance();
		$reschedule_permissions = $this->check_reschedule_permissions( $advanced_settings, $booking_array, $timezone, $merge_tags_manager );

		add_filter(
			'quillbooking_config',
			function ( $config ) use ( $booking, $calendar, $event, $global_settings, $reschedule_permissions ) {
				$config['calendar']                  = $calendar->toArray();
				$config['event']                     = $event->toArray();
				$config['booking']                   = $booking->toArray();
				$config['global_settings']           = $global_settings;
				$config['can_reschedule']            = $reschedule_permissions['can_reschedule'];
				$config['reschedule_denied_message'] = $reschedule_permissions['message'];
				return $config;
			}
		);

		return $this->render_react_page( 'quillbooking-reschedule-page' );
	}
}
