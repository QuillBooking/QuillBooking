<?php
/**
 * Class QuillBooking
 *
 * @since 1.0.0
 * @package QuillBooking
 */

namespace QuillBooking;

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;
use QuillBooking\REST_API\REST_API;
use QuillBooking\Capabilities;
use QuillBooking\Availabilities;
use QuillBooking\Booking\Booking;
use QuillBooking\Traits\Singleton;

use QuillBooking\Webhook_Feeds;
use QuillBooking\Admin\Admin;
use QuillBooking\Admin\Admin_Loader;

/**
 * Main QuillBooking Class
 * The main class that initiates the plugin
 *
 * @since 1.0.0
 */
class QuillBooking
{

	use Singleton;

	/**
	 * Booking Tasks
	 *
	 * @since 1.0.0
	 *
	 * @var Tasks
	 */
	public $tasks;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct()
	{
		$this->init_illuminate();
		$this->load_dependencies();
		$this->init_objects();
		$this->init_hooks();
	}

	/**
	 * This method for illuminate events
	 *
	 * @since 1.0.0
	 */
	private function init_illuminate()
	{
		$capsule = new Capsule();

		$capsule->addConnection(
			array(
				'driver' => 'mysql',
				'host' => DB_HOST,
				'database' => DB_NAME,
				'username' => DB_USER,
				'password' => DB_PASSWORD,
				'charset' => DB_CHARSET,
				'collation' => DB_COLLATE,
				'prefix' => '',
			)
		);

		$capsule->setEventDispatcher(new Dispatcher(new Container));

		$capsule->setAsGlobal();

		$capsule->bootEloquent();
	}

	/**
	 * Load Dependencies
	 *
	 * @since 1.0.0
	 */
	private function load_dependencies()
	{
		require_once QUILLBOOKING_PLUGIN_DIR . 'includes/functions.php';
		require_once QUILLBOOKING_PLUGIN_DIR . 'includes/event-locations/loader.php';
		require_once QUILLBOOKING_PLUGIN_DIR . 'includes/merge-tags/loader.php';
		require_once QUILLBOOKING_PLUGIN_DIR . 'includes/payment-gateway/loader.php';
	}

	/**
	 * Initialize Objects
	 *
	 * @since 1.0.0
	 */
	private function init_objects()
	{
		$this->tasks = new Tasks('quillbooking');

		Admin::instance();
		Admin_Loader::instance();
		REST_API::instance();
		Capabilities::assign_capabilities_for_user_roles();
		Booking::instance();

		// WooCommerce integration is now in the Pro version

		Webhook_Feeds::instance();

	}

	/**
	 * Initialize Hooks
	 *
	 * @since 1.0.0
	 */
	private function init_hooks()
	{
		add_action('init', array(Capabilities::class, 'assign_capabilities_for_user_roles'));
		add_action('init', array(Availabilities::class, 'add_default_availability'));
	}
}
