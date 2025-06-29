<?php

/**
 * Template Renderer Factory
 * 
 * Creates appropriate renderer instances
 */

namespace QuillBooking\Booking\Renderers;

use QuillBooking\Booking\Renderers\Calendar_Page_Renderer;
use QuillBooking\Booking\Renderers\Booking_Page_Renderer;
use QuillBooking\Booking\Renderers\Cancel_Page_Renderer;
use QuillBooking\Booking\Renderers\Confirm_Page_Renderer;
use QuillBooking\Booking\Renderers\Reschedule_Page_Renderer;

class Template_Renderer_Factory {

	public function create_calendar_renderer( string $calendarModelClass ): Calendar_Page_Renderer {
		return new Calendar_Page_Renderer( $calendarModelClass );
	}

	public function create_booking_renderer( 
		string $calendarModelClass, 
		string $eventModelClass, 
		string $globalSettingsClass 
	): Booking_Page_Renderer {
		return new Booking_Page_Renderer( 
			$calendarModelClass, 
			$eventModelClass, 
			$globalSettingsClass 
		);
	}

	public function create_action_renderer( 
		string $type, 
		string $eventModelClass, 
		string $bookingValidatorClass, 
		string $globalSettingsClass 
	) {
		switch ( $type ) {
			case 'cancel':
				return new Cancel_Page_Renderer( $eventModelClass );
			case 'confirm':
				return new Confirm_Page_Renderer( $eventModelClass );
			case 'reschedule':
				return new Reschedule_Page_Renderer( 
					$eventModelClass, 
					$bookingValidatorClass, 
					$globalSettingsClass 
				);
			default:
				throw new \InvalidArgumentException( "Unknown page type: {$type}" );
		}
	}
}
