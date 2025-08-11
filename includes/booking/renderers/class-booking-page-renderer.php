<?php


/**
 * Booking Page Renderer (React)
 */

namespace QuillBooking\Booking\Renderers;

use Illuminate\Support\Arr;

class Booking_Page_Renderer extends Base_Template_Renderer {

	private string $calendarModelClass;
	private string $eventModelClass;
	private string $globalSettingsClass;

	public function __construct(
		string $calendarModelClass,
		string $eventModelClass,
		string $globalSettingsClass
	) {
		parent::__construct();
		$this->calendarModelClass  = $calendarModelClass;
		$this->eventModelClass     = $eventModelClass;
		$this->globalSettingsClass = $globalSettingsClass;
	}

	public function render( $calendar_slug, $event_slug ) {
		$calendar        = Arr::get( $_GET, 'quillbooking_calendar', null );
		$global_settings = $this->globalSettingsClass::get_all();

		if ( ! $calendar ) {
			return false;
		}

		$calendar = $this->calendarModelClass::where( 'slug', $calendar )->first();
		if ( ! $calendar ) {
			return false;
		}

		$event_slug = Arr::get( $_GET, 'event', null );
		$event      = $this->eventModelClass::where( 'slug', $event_slug )
			->where( 'calendar_id', $calendar->id )
			->first();

		if ( ! $event ) {
			wp_redirect( home_url() );
			exit;
		}

		// Prepare event data
		$event->hosts             = $this->get_event_hosts( $event );
		$event->fields            = $event->getFieldsAttribute();
		$event->availability_data = $event->getAvailabilityAttribute();
		$event->reserve           = $event->getReserveTimesAttribute();
		$event->limits_data       = $event->getLimitsAttribute();
		$event->advanced_settings = $event->getAdvancedSettingsAttribute();

		// Add config filter
		add_filter(
			'quillbooking_config',
			function ( $config ) use ( $calendar, $event, $global_settings ) {
				$config['calendar']        = $calendar->toArray();
				$config['global_settings'] = $global_settings;
				if ( $event ) {
					$config['event'] = $event->toArray();
				}
				return $config;
			}
		);

		return $this->render_react_page( 'quillbooking-booking-page' );
	}
}
