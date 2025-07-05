<?php

/**
 * Refactored Booking Frontend Handler
 * 
 * This is now a lightweight router that delegates to specific renderers
 */

namespace QuillBooking\Booking;

use DateTime;
use DateTimeZone;
use Exception;
use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use Illuminate\Support\Arr;
use QuillBooking\Models\User_Model;
use QuillBooking\Renderer;
use QuillBooking\Settings;
use QuillBooking\Booking\Renderers\Template_Renderer_Factory;
use QuillBooking\Managers\Locations_Manager;
use QuillBooking\Utils;


class Booking_Frontend_Handler {

	private string $calendarModelClass;
	private string $eventModelClass;
	private string $bookingValidatorClass;
	private string $globalSettingsClass;
	private Template_Renderer_Factory $rendererFactory;

	public function __construct(
		string $calendarModelClass = Calendar_Model::class,
		string $eventModelClass = Event_Model::class,
		string $bookingValidatorClass = Booking_Validator::class,
		string $globalSettingsClass = Settings::class
	) {
		$this->calendarModelClass    = $calendarModelClass;
		$this->eventModelClass       = $eventModelClass;
		$this->bookingValidatorClass = $bookingValidatorClass;
		$this->globalSettingsClass   = $globalSettingsClass;
		$this->rendererFactory       = new Template_Renderer_Factory();

		add_action( 'wp_loaded', array( $this, 'init' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
        add_filter('show_admin_bar', array( $this, 'hide_admin_bar' ));
	}

	public function enqueue_scripts() {
        global $wp_scripts, $wp_styles;
        $calendar_slug = sanitize_text_field( Arr::get( $_GET, 'quillbooking_calendar', '' ) );
		$quillbooking_query_string = sanitize_text_field( Arr::get( $_GET, 'quillbooking', '' ) );
        if($calendar_slug || $quillbooking_query_string) {
            $wp_scripts->queue= [];
            $wp_styles->queue= [];
			$asset_file  = QUILLBOOKING_PLUGIN_DIR . 'build/renderer/index.asset.php';
			$asset        = file_exists( $asset_file ) ? require $asset_file : null;
			$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
			$version      = isset( $asset['version'] ) ? $asset['version'] : QUILLBOOKING_VERSION;
	
			// Register core scripts and styles
			wp_register_script(
				'quillbooking-renderer',
				QUILLBOOKING_PLUGIN_URL . 'build/renderer/index.js',
				$dependencies,
				$version,
				true
			);
	
			wp_register_style(
				'quillbooking-renderer',
				QUILLBOOKING_PLUGIN_URL . 'build/renderer/style.css',
				array(),
				$version
			);
	
			wp_register_style(
				'quillbooking-page',
				QUILLBOOKING_PLUGIN_URL . 'assets/css/style.css',
				array(),
				$version
			);
	
			wp_register_script(
				'quillbooking-page',
				QUILLBOOKING_PLUGIN_URL . 'assets/js/booking-script.js',
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
	
			wp_style_add_data( 'quillbooking-renderer', 'rtl', 'replace' );	
			$this->set_renderer_config();
			do_action( 'quillbooking_renderer_enqueue_scripts' );
		}
	}

	public function init() {
		add_action( 'template_redirect', array( $this, 'route_frontend' ) );
	}

    /**
	 * Set renderer config
	 *
	 * @since 1.8.0
	 *
	 * @return void
	 */
	public function set_renderer_config() {
        // Check if Pro plugin is active
       $pro_active = defined( 'QUILLBOOKING_PRO_VERSION' ) ? 'true' : 'false';

       wp_add_inline_script(
           'quillbooking-renderer',
           'if (window.quillbooking === undefined) { window.quillbooking = {}; }' .
           'window.quillbooking.pro_active = ' . $pro_active . ';' .
           'quillbooking.config.setLocations( ' . json_encode( Locations_Manager::instance()->get_options() ) . ' );' .
           'quillbooking.config.setTimezones( ' . json_encode( Utils::get_timezones() ) . ' );' . 'quillbooking.config.setAjaxUrl( ' . json_encode( admin_url( 'admin-ajax.php' ) ) . ' );'
       );
   }

	/**
	 * Main routing method - delegates to appropriate renderers
	 */
	public function route_frontend() {
		$hash          = sanitize_text_field( Arr::get( $_GET, 'id', '' ) );
		$type          = sanitize_text_field( Arr::get( $_GET, 'type', '' ) );
		$calendar_slug = sanitize_text_field( Arr::get( $_GET, 'quillbooking_calendar', '' ) );
		$quillbooking_query_string = sanitize_text_field( Arr::get( $_GET, 'quillbooking', '' ) );
		$event_slug    = sanitize_text_field( Arr::get( $_GET, 'event', '' ) );
        if($calendar_slug || $quillbooking_query_string) {
            // Calendar page - no hash, no type, no event
            if ( $calendar_slug && ! $hash && ! $type && ! $event_slug ) {
                return $this->render_calendar_page( $calendar_slug );
            }

            // Booking action pages (cancel, confirm, reschedule)
            if ( $hash && $this->is_valid_page_type( $type ) ) {
                return $this->render_action_page( $hash, $type );
            }

            // Default: new booking flow (React page)
            return $this->render_booking_page( $calendar_slug, $event_slug );
        }
	}

    public function hide_admin_bar($show_bar) {
        $calendar_slug = sanitize_text_field( Arr::get( $_GET, 'quillbooking_calendar', '' ) );
		$quillbooking_query_string = sanitize_text_field( Arr::get( $_GET, 'quillbooking', '' ) );
        if($calendar_slug || $quillbooking_query_string) {
           return false;
        }

        return $show_bar;

    }

	private function render_calendar_page( string $calendar_slug ) {
		$renderer = $this->rendererFactory->create_calendar_renderer(
			$this->calendarModelClass
		);
		return $renderer->render( $calendar_slug );
	}

	private function render_booking_page( string $calendar_slug, string $event_slug ) {
		$renderer = $this->rendererFactory->create_booking_renderer(
			$this->calendarModelClass,
			$this->eventModelClass,
			$this->globalSettingsClass
		);
		return $renderer->render( $calendar_slug, $event_slug );
	}

	private function render_action_page( string $hash, string $type ) {
		try {
			$booking = $this->bookingValidatorClass::validate_booking( $hash );
			
			$renderer = $this->rendererFactory->create_action_renderer(
				$type,
				$this->eventModelClass,
				$this->bookingValidatorClass,
				$this->globalSettingsClass,
                $this->calendarModelClass
			);
			
			return $renderer->render( $booking );
			
		} catch ( \Exception $e ) {
			wp_die( esc_html__( 'Invalid or expired booking link.', 'quillbooking' ) );
		}
	}

	private function is_valid_page_type( string $type ): bool {
		return in_array( $type, array( 'cancel', 'reschedule', 'confirm' ), true );
	}
}
