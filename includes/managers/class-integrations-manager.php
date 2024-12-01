<?php
/**
 * Class Integrations Manager
 * This class is responsible for handling the integrations
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Managers;

use Exception;
use QuillBooking\Integration\Integration;

/**
 * Integrations class
 */
final class Integrations_Manager {

	/**
	 * Registed integrations
	 *
	 * @since 1.0.0
	 *
	 * @var Integration[]
	 */
	protected $integrations = array();

	/**
	 * Options
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Integrations_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Integrations_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register Integration
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration
	 * @return void
	 */
	public function register( Integration $integration ) {
		if ( ! $integration instanceof Integration ) {
			throw new Exception( __( 'Invalid integration', 'quillbooking' ) );
		}

		if ( isset( $this->integrations[ $integration->slug ] ) ) {
			return;
		}

		$this->integrations[ $integration->slug ] = $integration;
		$this->options[ $integration->slug ]      = array(
			'label'       => $integration->name,
			'description' => $integration->description,
			'settings'    => $integration->get_settings(),
		);
	}

	/**
	 * Get Integration
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Integration
	 */
	public function get_integration( $slug ) {
		if ( isset( $this->integrations[ $slug ] ) ) {
			return $this->integrations[ $slug ];
		}

		throw new Exception( sprintf( __( 'Integration %s not found', 'quillbooking' ), $slug ) );
	}

	/**
	 * Get Integrations
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_integrations() {
		return $this->integrations;
	}

	/**
	 * Get Options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return $this->options;
	}
}
