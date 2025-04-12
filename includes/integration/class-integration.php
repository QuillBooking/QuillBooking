<?php
/**
 * Class Integration
 *
 * This class is responsible for handling the integration
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integration;

use Illuminate\Support\Arr;
use QuillBooking\Managers\Integrations_Manager;
use QuillBooking\Models\Calendar_Model;

/**
 * Integration class
 */
abstract class Integration {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description;

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name;

	/**
	 * Remote Data
	 *
	 * @var Integration_Remote_Data
	 */
	public $remote_data;

	/**
	 * API
	 *
	 * @var API
	 */
	public $api;

	/**
	 * Accounts
	 *
	 * @var Accounts
	 */
	public $accounts;

	/**
	 * Meta key
	 *
	 * @var string
	 */
	public $meta_key;

	/**
	 * Host
	 *
	 * @var Calendar_Model
	 */
	public $host;

	/**
	 * Is calendar integration
	 *
	 * @var bool
	 */
	public $is_calendar = true;

	/**
	 * Has accounts
	 *
	 * @var bool
	 */
	public $has_accounts = true;

	/**
	 * Is global integration
	 *
	 * @var bool
	 */
	public $is_global = false;

	/**
	 * Auth type
	 *
	 * @var string
	 */
	public $auth_type = 'oauth';

	/**
	 * Subclasses instances.
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	private static $instances = array();

	/**
	 * Integration Instances.
	 *
	 * Instantiates or reuses an instances of Integration.
	 *
	 * @since 1.0.0
	 * @static
	 *
	 * @return static - Single instance
	 */
	public static function instance() {
		if ( ! isset( self::$instances[ static::class ] ) ) {
			$instance = new static();
			$instance->register();
			self::$instances[ static::class ] = $instance;
		}
		return self::$instances[ static::class ];
	}

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		// + classes from parent.
		// 'remote_data'   => Integration_Remote_Data::class,
		// 'rest_api'      => REST_API::class,
	);

	/**
	 * Constructor
	 */
	protected function __construct() {
		$this->init();
	}

	/**
	 * Init
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init() {
		if ( ! empty( static::$classes['rest_api'] ) ) {
			new static::$classes['rest_api']( $this );
		}

		if ( ! empty( static::$classes['remote_data'] ) ) {
			$this->remote_data = new static::$classes['remote_data']( $this );
		}

		$this->accounts    = new Accounts( $this );
		$this->option_name = 'quillbooking_' . $this->slug . '_settings';
		$this->meta_key    = 'quillbooking_' . $this->slug . '_accounts';
	}

	/**
	 * Register
	 *
	 * @return bool
	 */
	private function register() {
		try {
			Integrations_Manager::instance()->register_integration( $this );
		} catch ( \Exception $e ) {
			return false;
		}

		return true;
	}

	/**
	 * Set host
	 *
	 * @param int|Calendar_Model $host Host.
	 *
	 * @return void
	 */
	public function set_host( $host ) {
		if ( $host instanceof Calendar_Model ) {
			$this->host = $host;
			return;
		}

		$this->host = Calendar_Model::find( $host );
	}

	/**
	 * Connect the integration
	 *
	 * @since 1.0.0
	 *
	 * @param int $host_id Host ID.
	 * @param int $account_id Account ID.
	 *
	 * @return bool|Integration_API
	 */
	public function connect( $host_id, $account_id ) {
		$this->set_host( $host_id );
		if ( ! $this->host ) {
			return new \WP_Error( 'host_not_found', __( 'Host not found.', 'quillbooking' ) );
		}
		// Implement this method in the child class.
	}

	/**
	 * Get the settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_settings() {
		return get_option( $this->option_name, array() );
	}

	/**
	 * Get the setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key
	 * @param mixed  $default
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = '' ) {
		$settings = $this->get_settings();
		return Arr::get( $settings, $key, $default );
	}

	/**
	 * Update the settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 *
	 * @return void
	 */
	public function update_settings( $settings ) {
		update_option( $this->option_name, $settings );
	}

	/**
	 * Update the setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key
	 * @param mixed  $value
	 *
	 * @return void
	 */
	public function update_setting( $key, $value ) {
		$settings         = $this->get_settings();
		$settings[ $key ] = $value;
		$this->update_settings( $settings );
	}

	/**
	 * validate the integration
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 *
	 * @return bool
	 */
	public function validate( $settings ) {
		return true;
	}

	/**
	 * Is connected
	 *
	 * @since 1.0.0
	 *
	 * @param int $host_id Host ID.
	 * @param int $account_id Account ID.
	 *
	 * @return bool
	 */
	public function is_connected( $host_id, $account_id ) {
		$api = $this->connect( $host_id, $account_id );
		if ( $api instanceof Integration_API ) {
			return true;
		}

		return new \WP_Error( 'integration_not_connected', sprintf( __( 'Integration %s is not connected.', 'quillbooking' ), $this->name ) );
	}

	/**
	 * Get icon
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_icon() {
		return QUILLBOOKING_PLUGIN_URL . 'assets/icons/' . $this->slug . '/icon.svg';
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}

	/**
	 * Auth fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_auth_fields() {
		return array();
	}
}
