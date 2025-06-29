<?php

/**
 * Calendar Page Renderer
 */

namespace QuillBooking\Booking\Renderers;

class Calendar_Page_Renderer extends Base_Template_Renderer {

	private string $calendarModelClass;

	public function __construct( string $calendarModelClass ) {
		parent::__construct();
		$this->calendarModelClass = $calendarModelClass;
	}

	public function render( string $slug ) {
		if ( ! $slug ) {
			return false;
		}

		$calendar = $this->calendarModelClass::where( 'slug', $slug )
			->with( 'user', 'events' )
			->first();

		if ( ! $calendar ) {
			return false;
		}

		$template_path = QUILLBOOKING_PLUGIN_DIR . 'src/templates/calendar.php';
		
		return $this->render_template_page( $template_path, [
			'calendar' => $calendar,
			'title'    => $calendar->name ?? __( 'Calendar', 'quillbooking' )
		]);
	}
}