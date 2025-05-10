<?php
/**
 * Mock Payment Gateway for testing
 *
 * @package QuillBooking\Tests
 */

namespace QuillBooking\Tests\Mocks;

use QuillBooking\Payment_Gateway\Payment_Gateway;

/**
 * Mock Payment Gateway implementation
 */
class Mock_Payment_Gateway extends Payment_Gateway {

	/**
	 * Payment Gateway Name
	 *
	 * @var string
	 */
	public $name = 'Mock Gateway';

	/**
	 * Payment Gateway Slug
	 *
	 * @var string
	 */
	public $slug = 'mock_gateway';

	/**
	 * Payment Gateway Description
	 *
	 * @var string
	 */
	public $description = 'Mock Payment Gateway for Testing';

	/**
	 * Config state for testing
	 *
	 * @var bool
	 */
	private $configured = true;

	/**
	 * Mode settings for testing
	 *
	 * @var array
	 */
	private $mode_settings = array(
		'mode'    => 'test',
		'api_key' => 'test_key',
	);

	/**
	 * Constructor
	 */
	public function __construct( $configured = true, $mode_settings = null ) {
		$this->configured = $configured;
		if ( $mode_settings !== null ) {
			$this->mode_settings = $mode_settings;
		}
	}

	/**
	 * Set configured state
	 *
	 * @param bool $configured
	 */
	public function set_configured( $configured ) {
		$this->configured = $configured;
	}

	/**
	 * Set mode settings
	 *
	 * @param array $mode_settings
	 */
	public function set_mode_settings( $mode_settings ) {
		$this->mode_settings = $mode_settings;
	}

	/**
	 * Is gateway and method configured
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public function is_configured() {
		return $this->configured;
	}

	/**
	 * Get mode settings
	 *
	 * @since 1.0.0
	 *
	 * @param string $mode Mode. Current mode will be used if not specified.
	 * @return array|false
	 */
	public function get_mode_settings( $mode = null ) {
		if ( ! $this->configured ) {
			return false;
		}
		return $this->mode_settings;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'test_field' => array(
				'type'     => 'text',
				'label'    => 'Test Field',
				'default'  => '',
				'required' => true,
			),
		);
	}

	/**
	 * Get settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_settings() {
		$option_name = $this->get_option_name();
		$settings    = get_option( $option_name, array() );

		if ( empty( $settings ) || ! is_array( $settings ) ) {
			return array();
		}

		return $settings;
	}

	/**
	 * Update settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 * @return bool
	 */
	public function update_settings( $settings ) {
		$option_name = $this->get_option_name();
		return update_option( $option_name, $settings );
	}

	/**
	 * Validate settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 * @return bool|WP_Error
	 */
	public function validate( $settings ) {
		// Validate settings here
		// For testing, just return true
		return true;
	}

	/**
	 * Get option name
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	private function get_option_name() {
		return $this->option_name ?? 'quillbooking_' . $this->slug . '_settings';
	}
}
