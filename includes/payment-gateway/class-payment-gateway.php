<?php
/**
 * Abstract Payment Gateway class.
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Payment_Gateway;

use Illuminate\Support\Arr;
use QuillBooking\Managers\Payment_Gateways_Manager;

/**
 * Payment Gateway class.
 */
abstract class Payment_Gateway {

	/**
	 * Payment Gateway Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Payment Gateway Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Payment Gateway Description
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
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		// + classes.
		// 'rest_api' => REST_API::class,
	);

	/**
	 * Subclasses instances.
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	private static $instances = array();

	/**
	 * Payment_Gateway Instances.
	 *
	 * Instantiates or reuses an instances of Payment_Gateway.
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
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
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

		$this->option_name = 'quillbooking_' . $this->slug . '_settings';
	}

	/**
	 * Register
	 *
	 * @return bool
	 */
	private function register() {
		try {
			Payment_Gateways_Manager::instance()->register_payment_gateway( $this );
		} catch ( \Exception $e ) {
			return false;
		}

		return true;
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
	 * Is gateway and method configured
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	abstract public function is_configured();

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	abstract public function get_fields();
}
