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

use DateTime;
use DateTimeZone;
use Exception;
use QuillBooking\Booking\Booking_Validator;
use QuillBooking\Models\Calendar_Model;
use QuillBooking\Models\Event_Model;
use Illuminate\Support\Arr;
use QuillBooking\Models\User_Model;
use QuillBooking\Renderer;

class Booking_Actions
{







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

		add_action('wp_loaded', array($this, 'init'));
		add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
		add_filter('template_include', array($this, 'template_loader'), 99999);
	}

	public function enqueue_scripts()
	{
		$asset_file  = QUILLBOOKING_PLUGIN_DIR . 'build/renderer/index.asset.php';
		$asset        = file_exists($asset_file) ? require $asset_file : null;
		$dependencies = isset($asset['dependencies']) ? $asset['dependencies'] : array();
		$version      = isset($asset['version']) ? $asset['version'] : QUILLBOOKING_VERSION;

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
					'ajax_url' => admin_url('admin-ajax.php'),
					'nonce'    => wp_create_nonce('quillbooking'),
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

		wp_style_add_data('quillbooking-renderer', 'rtl', 'replace');
		Renderer::set_renderer();
	}

	public function init()
	{
		$this->booking_actions();
		add_action('template_redirect', array($this, 'route_frontend'));
	}

	/**
	 * Helper to render React-powered pages
	 *
	 * @param string $div_id ID of the root div
	 *
	 * @return bool
	 */
	private function render_react_page(string $div_id): bool
	{
		wp_enqueue_script('quillbooking-renderer');
		wp_enqueue_style('quillbooking-renderer');

		echo $this->get_head();
		printf('<div id="%s"></div>', esc_attr($div_id));
		echo $this->get_footer();

		return true;
	}

	public function render_booking_page()
	{
		$calendar = Arr::get($_GET, 'quillbooking_calendar', null);

		if (! $calendar) {
			return;
		}

		$calendar = $this->calendarModelClass::where('slug', $calendar)->first();
		if (! $calendar) {
			return;
		}
		$event_slug = Arr::get($_GET, 'event', null);
		$event      = $this->eventModelClass::where('slug', $event_slug)
			->where('calendar_id', $calendar->id)
			->first();

		$event->hosts             = $this->getEventHosts($event);
		$event->fields            = $event->getFieldsAttribute();
		$event->availability_data = $event->getAvailabilityAttribute();
		$event->reserve           = $event->getReserveTimesAttribute();
		$event->limits_data       = $event->getLimitsAttribute();

		if (! $event && $event_slug) {
			return;
		}

		wp_enqueue_script('quillbooking-renderer');
		wp_enqueue_style('quillbooking-renderer');

		add_filter(
			'quillbooking_config',
			function ($config) use ($calendar, $event) {
				$config['calendar'] = $calendar->toArray();
				if ($event) {
					$config['event'] = $event->toArray();
				}
				return $config;
			}
		);

		return $this->render_react_page('quillbooking-booking-page');
	}

	public function process_booking_action($action_type, $new_status, $log_message, $log_details)
	{
		$action = Arr::get($_GET, 'quillbooking_action', null);
		if ($action_type !== $action) {
			return;
		}

		try {
			$id      = sanitize_text_field(Arr::get($_GET, 'id', null));
			$booking = $this->bookingValidatorClass::validate_booking($id);

			if ($booking->status === $new_status) {
				throw new \Exception(sprintf(__('Booking is already %s', 'quillbooking'), $new_status));
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

			do_action("quillbooking_booking_{$action_type}", $booking);

			wp_send_json_success($this->generate_success_message(ucfirst($action_type), $new_status));
		} catch (\Exception $e) {
			wp_send_json_error($this->generate_error_message(ucfirst($action_type), $e->getMessage()));
		}
	}

	public function generate_success_message($action, $status)
	{
		return array(
			'status'  => 'success',
			'title'   => sprintf(__('%s Successful', 'quillbooking'), ucfirst($action)),
			'message' => sprintf(__('The booking has been successfully %s.', 'quillbooking'), $status),
		);
	}

	public function generate_error_message($action, $message)
	{
		return array(
			'status'  => 'error',
			'title'   => sprintf(__('%s Failed', 'quillbooking'), ucfirst($action)),
			'message' => $message,
		);
	}

	public function get_head()
	{
		ob_start();
?>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>

		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
			<meta http-equiv="Imagetoolbar" content="No" />
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title><?php esc_html_e('Request Unsubscribe', 'quillbooking'); ?></title>
			<meta name="robots" content="noindex">
			<?php wp_head(); ?>
		</head>

		<body class="quillbooking-body">
		<?php
		return ob_get_clean();
	}

	public function get_footer()
	{
		ob_start();
		wp_footer();
		?>
		</body>

		</html>
<?php
		return ob_get_clean();
	}


	private function booking_actions()
	{
		$this->process_booking_action('reject', 'rejected', __('Booking rejected', 'quillbooking'), __('Booking rejected by Organizer', 'quillbooking'));
		$this->process_booking_action('confirm', 'scheduled', __('Booking confirmed', 'quillbooking'), __('Booking confirmed by Organizer', 'quillbooking'));
		$this->process_booking_action('reschedule', 'rescheduled', __('Booking rescheduled', 'quillbooking'), __('Booking rescheduled by Attendee', 'quillbooking'));
		$this->process_booking_action('cancel', 'cancelled', __('Booking cancelled', 'quillbooking'), __('Booking cancelled by Attendee', 'quillbooking'));
	}

	public function route_frontend()
	{
		$hash = sanitize_text_field(Arr::get($_GET, 'id', ''));
		$type = sanitize_text_field(Arr::get($_GET, 'type', ''));

		// Default: new booking flow
		if (! $hash || ! $this->isValidPageType($type)) {
			return $this->render_booking_page();
		}

		if ($hash && $type === 'reschedule') {
			return $this->render_reschedule_page();
		}
		// Validate booking by hash
		try {
			$booking      = $this->bookingValidatorClass::validate_booking($hash);
			$event        = $this->eventModelClass::where('slug', $booking['event']['slug'])->first();
			$fields       = $event->getFieldsAttribute();
			$other_fields = $fields['other'];
		} catch (\Exception $e) {
			wp_die(esc_html__('Invalid or expired booking link.', 'quillbooking'));
		}

		// Dispatch to specific page
		return $this->dispatchPage($type, $booking, $other_fields);
	}

	private function isValidPageType(string $type)
	{
		return in_array($type, array('cancel', 'reschedule', 'confirm'), true);
	}

	private function dispatchPage(string $type, $booking, $fields)
	{
		$map = array(
			'cancel'  => 'render_cancel_page',
			'confirm' => 'render_confirmation_page',
		);

		if (isset($map[$type]) && method_exists($this, $map[$type])) {
			return $this->{$map[$type]}($booking, $fields);
		}

		// Fallback
		return $this->render_booking_page();
	}

	/**
	 * Render cancel page
	 */
	protected function render_cancel_page($booking, $fields)
	{
		return $this->render_generic_page('cancel', $booking, $fields,);
	}

	/**
	 * Render reschedule page
	 */
	protected function render_reschedule_page()
	{
		$booking_id = Arr::get($_GET, 'id', null);

		if (! $booking_id) {
			return;
		}
		$booking  = $this->bookingValidatorClass::validate_booking($booking_id);
		$calendar = $this->calendarModelClass::where('id', $booking->event->calendar_id)->first();
		if (! $calendar) {
			return;
		}

		$event = $booking->event;

		$event->hosts             = $this->getEventHosts($event);
		$event->fields            = $event->getFieldsAttribute();
		$event->availability_data = $event->getAvailabilityAttribute();
		$event->reserve           = $event->getReserveTimesAttribute();

		if (! $event) {
			return;
		}

		wp_enqueue_script('quillbooking-renderer');
		wp_enqueue_style('quillbooking-renderer');

		add_filter(
			'quillbooking_config',
			function ($config) use ($booking, $calendar, $event) {
				$config['calendar'] = $calendar->toArray();
				$config['event']    = $event->toArray();
				$config['booking']  = $booking->toArray();

				return $config;
			}
		);

		return $this->render_react_page('quillbooking-reschedule-page');
	}

	/**
	 * Render confirmation page
	 */
	protected function render_confirmation_page($booking)
	{
		return $this->render_generic_page('confirm', $booking);
	}


	/**
	 * Generic renderer for cancel/confirm pages
	 */
	protected function render_generic_page(string $page, $booking, $fields = array())
	{
		$template_path = QUILLBOOKING_PLUGIN_DIR . "src/templates/{$page}.php";

		if (! file_exists($template_path)) {
			return false;
		}
		$booking_array = $booking->toArray();

		// Format the booking time range string
		if (
			! empty($booking_array['start_time']) &&
			! empty($booking_array['timezone']) &&
			! empty($booking_array['slot_time'])
		) {
			try {
				$start = new DateTime($booking_array['start_time'], new DateTimeZone('UTC'));
				$start->setTimezone(new DateTimeZone($booking_array['timezone']));

				$end = clone $start;
				$end->modify("+{$booking_array['slot_time']} minutes");

				$formatted_time_range = sprintf(
					'%s - %s, %s',
					$start->format('H:i'),
					$end->format('H:i'),
					$start->format('l, F d, Y')
				);

				$booking_array['formatted_time_range'] = $formatted_time_range;
			} catch (Exception $e) {
				$booking_array['formatted_time_range'] = '';
			}
		} else {
			$booking_array['formatted_time_range'] = '';
		}

		// handle location formatting
		if (! empty($booking_array['location'])) {
			$type  = isset($booking_array['location']['type']) ? strtolower($booking_array['location']['type']) : '';
			$label = $booking_array['location']['label'] ?? '';
			$value = $booking_array['location']['value'] ?? '';
			$booking_array['location_value'] = $value;

			$link_types = array('online', 'zoom', 'ms-teams', 'google-meet');
			if (in_array($type, $link_types, true) && filter_var($value, FILTER_VALIDATE_URL)) {
				$value                     = sprintf('<a class="link" href="%s" target="_blank" rel="noopener noreferrer">%s</a>', esc_url($value), esc_html($label));
				$booking_array['location'] = $value;
			} else {
				$value                     = esc_html($value);
				$booking_array['location'] = $label . ' : ' . $value;
			}
		}


		$booking_array['hosts'] = $this->getEventHosts($booking->event);

		// Make the booking data available to the template
		extract(
			array(
				'booking' => $booking_array,
				'fields'  => $fields,
			)
		);

		wp_enqueue_script('quillbooking-page');
		wp_enqueue_style('quillbooking-page');

		wp_head();
		// Provide variables to the template
		include $template_path;

		echo $this->get_footer();

		return true;
	}


	/**
	 * Fetches host users attached to an event.
	 *
	 * @param Event_Model \ $event
	 * @return array<int, array{id: int, name: string, image: string}>
	 */
	private function getEventHosts(Event_Model $event): array
	{
		$ids   = $event->getTeamMembersAttribute() ?: array($event->user->ID);
		$ids   = is_array($ids) ? $ids : array($ids);
		$hosts = array();

		foreach ($ids as $userId) {
			$user = User_Model::find($userId);
			if (! $user) {
				continue;
			}
			$hosts[] = array(
				'id'    => $user->ID,
				'name'  => $user->display_name,
				'image' => get_avatar_url($user->ID),
			);
		}

		return $hosts;
	}

	/**
	 * Template loader for standalone booking pages
	 */
	public function template_loader($template)
	{
		// Only override for booking pages (adjust logic as needed)
		if (isset($_GET['quillbooking_calendar']) || isset($_GET['quillbooking']) || isset($_GET['id'])) {
			return QUILLBOOKING_PLUGIN_DIR . 'includes/booking/renderer-template.php';
		}
		return $template;
	}
}
