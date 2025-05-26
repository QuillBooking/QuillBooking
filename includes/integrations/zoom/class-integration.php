<?php

/**
 * Zoom Calendar / Meet Integration
 *
 * This class is responsible for handling the Zoom Calendar / Meet Integration
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Integrations\Zoom;

use Illuminate\Support\Arr;
use QuillBooking\Event_Locations\Zoom;
use QuillBooking\Integration\Integration as Abstract_Integration;
use QuillBooking\Models\Event_Model;
use QuillBooking\Integrations\Zoom\REST_API\REST_API;
use QuillBooking\Utils;

/**
 * Zoom Integration class
 */
class Integration extends Abstract_Integration {









	/**
	 * Integration Name
	 *
	 * @var string
	 */
	public $name = 'Zoom';

	/**
	 * Integration Slug
	 *
	 * @var string
	 */
	public $slug = 'zoom';

	/**
	 * Integration Description
	 *
	 * @var string
	 */
	public $description = 'Host meetings and webinars with Zoom. Easily sync your Zoom events directly from the platform.';

	/**
	 * App
	 *
	 * @var App
	 */
	public $app;

	/**
	 * API
	 *
	 * @var API
	 */
	public $api;

	/**
	 * Is calendar integration
	 *
	 * @var bool
	 */
	public $is_calendar = false;

	/**
	 * Has acconuts
	 *
	 * @var bool
	 */
	public $has_accounts = false;

	/**
	 * Auth type
	 *
	 * @var string
	 */
	public $auth_type = 'basic';

	/**
	 * Classes
	 *
	 * @var array
	 */
	protected static $classes = array(
		'remote_data' => Remote_Data::class,
		'rest_api'    => REST_API::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		 parent::__construct();
		$this->app = new App( $this );
		add_action( 'quillbooking_booking_created', array( $this, 'add_event_to_calendars' ) );
		add_action( 'quillbooking_booking_cancelled', array( $this, 'remove_event_from_calendars' ) );
		add_action( 'quillbooking_booking_rescheduled', array( $this, 'reschedule_event' ) );
	}

	/**
	 * Reschedule event
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return Booking_Model
	 */
	public function reschedule_event( $booking ) {
		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$zoom_meetings = $booking->get_meta( 'zoom_event_details', array() );
		if ( empty( $zoom_meetings ) ) {
			return;
		}

		$meeting_id = Arr::get( $zoom_meetings, 'meeting.id' );
		$account_id = Arr::get( $zoom_meetings, 'account_id' );

		// Try to connect using the stored account_id
		$api = $this->connect( $host, $account_id );
		if ( ! $api ) {
			// If that fails, try global settings
			$api = $this->connect( $host, 'global' );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Zoom.', 'quillbooking' ),
						'details' => __( 'Error connecting to Zoom with both account and global settings.', 'quillbooking' ),
					)
				);
				return;
			}
		}

		$start_time = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
		$data       = array(
			'start_time' => $start_time->format( 'Y-m-d\TH:i:s\Z' ),
			'duration'   => $booking->slot_time,
		);

		$response = $api->update_meeting( $meeting_id, $data );
		if ( ! $response['success'] ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __( 'Error rescheduling meeting in Zoom.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Error rescheduling event in Zoom Account %1$s: %2$s', 'quillbooking' ),
						$account_id,
						Arr::get( $response, 'data.error.message' )
					),
				)
			);
			return;
		}

		$booking->update_meta(
			'zoom_event_details',
			array(
				'event'      => Arr::get( $response, 'data' ),
				'account_id' => $account_id,
			)
		);

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Meeting rescheduled in Zoom Calendar.', 'quillbooking' ),
				'details' => sprintf(
					__( 'Event has been rescheduled in Zoom Account %1$s.', 'quillbooking' ),
					$account_id
				),
			)
		);
	}

	/**
	 * Remove event from calendars
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return Booking_Model
	 */
	public function remove_event_from_calendars( $booking ) {
		$event = $booking->event;
		$host  = $event->calendar->id;
		$this->set_host( $host );

		$zoom_meetings = $booking->get_meta( 'zoom_event_details', array() );
		if ( empty( $zoom_meetings ) ) {
			return;
		}

		$meeting_id = Arr::get( $zoom_meetings, 'meeting.id' );
		$account_id = Arr::get( $zoom_meetings, 'account_id' );

		// Try to connect using the stored account_id
		$api = $this->connect( $host, $account_id );
		if ( ! $api ) {
			// If that fails, try global settings
			$api = $this->connect( $host, 'global' );
			if ( ! $api ) {
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'Error connecting to Zoom.', 'quillbooking' ),
						'details' => __( 'Error connecting to Zoom with both account and global settings.', 'quillbooking' ),
					)
				);
				return;
			}
		}

		$response = $api->delete_meeting( $meeting_id );
		if ( ! $response['success'] ) {
			$booking->logs()->create(
				array(
					'type'    => 'error',
					'message' => __( 'Error removing meeting from Zoom.', 'quillbooking' ),
					'details' => sprintf(
						__( 'Error removing event from Zoom Account %1$s: %2$s', 'quillbooking' ),
						$account_id,
						Arr::get( $response, 'data.error.message' )
					),
				)
			);
			return;
		}

		$booking->logs()->create(
			array(
				'type'    => 'info',
				'message' => __( 'Meeting removed from Zoom Calendar.', 'quillbooking' ),
				'details' => __( 'Event has been removed from Zoom Calendar.', 'quillbooking' ),
			)
		);
	}

	/**
	 * Add event to calendars
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return Booking_Model
	 */
	public function add_event_to_calendars( $booking ) {
		error_log( 'Event Location: ' . $booking->location );
		if ( ! in_array( $booking->location, array( Zoom::instance()->slug ) ) ) {
			return $booking;
		}

		try {
			$event = $booking->event;
			$host  = $event->calendar->id;
			$this->set_host( $host );

			// First try to get host-specific settings
			$zoom_integration = $this->host->get_meta( $this->meta_key, array() );

			// If no host settings, try to get global settings
			if ( empty( $zoom_integration ) ) {
				$global_settings = get_option( 'quillbooking_zoom_settings', array() );
				error_log( 'Zoom Integration Debug - Global Settings: ' . print_r( $global_settings, true ) );

				if ( ! empty( $global_settings ) && ! empty( $global_settings['app_credentials'] ) ) {
					$zoom_integration = array(
						'global' => array(
							'app_credentials' => $global_settings['app_credentials'],
							'tokens'          => $global_settings['tokens'] ?? array(),
						),
					);
					error_log( 'Zoom Integration Debug - Using global settings for integration' );
				}
			}

			if ( empty( $zoom_integration ) ) {
				error_log( 'Zoom Integration Debug - No settings found for host or globally' );
				$booking->logs()->create(
					array(
						'type'    => 'error',
						'message' => __( 'No Zoom settings found for host or globally', 'quillbooking' ),
					)
				);
				return $booking;
			}

			$start_date = new \DateTime( $booking->start_time, new \DateTimeZone( 'UTC' ) );
			foreach ( $zoom_integration as $account_id => $data ) {
				error_log( 'Zoom Integration Debug - Processing account: ' . $account_id );
				error_log( 'Zoom Integration Debug - Account data: ' . print_r( $data, true ) );

				$api = $this->connect( $host, $account_id );
				if ( ! $api || is_wp_error( $api ) ) {
					error_log( 'Zoom Integration Debug - Failed to connect to Zoom API' );
					$booking->logs()->create(
						array(
							'type'    => 'error',
							'message' => __( 'Error connecting to Zoom.', 'quillbooking' ),
							'details' => sprintf(
								__( 'Error connecting host %1$s with Zoom Account %2$s.', 'quillbooking' ),
								$host->name,
								$account_id
							),
						)
					);
					continue;
				}

				$account = $account_id === 'global' ? $data : $this->accounts->get_account( $account_id );
				error_log( 'Zoom Integration Debug - Using account data: ' . print_r( $account, true ) );

				$meeting_data = array(
					'agenda'       => $booking->event->name,
					'start_time'   => $start_date->format( 'Y-m-d\TH:i:s\Z' ),
					'duration'     => $booking->slot_time,
					'type'         => '2',
					'schedule_for' => Arr::get( $account, 'name' ),
					'settings'     => array(
						'meeting_invitees' => array(
							array(
								'email' => $booking->guest->email,
							),
						),
					),
					'topic'        => $booking->event->name,
				);

				// Remove any empty values recursively.
				$meeting_data = array_filter( $meeting_data );
				error_log( 'Zoom Integration Debug - Meeting data to be sent: ' . print_r( $meeting_data, true ) );

				// Add retry logic for API requests
				$max_retries = 3;
				$retry_count = 0;
				$success     = false;
				$response    = null;

				while ( ! $success && $retry_count < $max_retries ) {
					try {
						// Increase timeout for API requests
						add_filter(
							'http_request_timeout',
							function () {
								return 30;
							}
						);
						$response = $api->create_meeting( $meeting_data );
						remove_filter(
							'http_request_timeout',
							function () {
								return 30;
							}
						);

						error_log( 'Zoom Integration Debug - API Response (Attempt ' . ( $retry_count + 1 ) . '): ' . print_r( $response, true ) );

						if ( $response['success'] ) {
							$success = true;
						} else {
							$error_message = Arr::get( $response, 'data.error.message', 'Unknown error' );
							$error_code    = Arr::get( $response, 'data.wp_error.code', '' );

							// Check if it's a timeout error
							if ( $error_code === 'http_request_failed' && strpos( $error_message, 'timed out' ) !== false ) {
								$retry_count++;
								if ( $retry_count < $max_retries ) {
									error_log( 'Zoom Integration Debug - Timeout occurred, retrying... (Attempt ' . ( $retry_count + 1 ) . ' of ' . $max_retries . ')' );
									sleep( 2 ); // Wait 2 seconds before retrying
									continue;
								}
							}

							error_log( 'Zoom Integration Debug - Error creating meeting: ' . $error_message );
							$booking->logs()->create(
								array(
									'type'    => 'error',
									'message' => __( 'Error creating meeting in Zoom.', 'quillbooking' ),
									'details' => sprintf(
										__( 'Error adding event to Zoom Account %1$s: %2$s', 'quillbooking' ),
										$account_id,
										$error_message
									),
								)
							);
							break;
						}
					} catch ( \Exception $e ) {
						error_log( 'Zoom Integration Debug - Exception during API call: ' . $e->getMessage() );
						$retry_count++;
						if ( $retry_count < $max_retries ) {
							error_log( 'Zoom Integration Debug - Retrying after exception... (Attempt ' . ( $retry_count + 1 ) . ' of ' . $max_retries . ')' );
							sleep( 2 );
							continue;
						}
						throw $e;
					}
				}

				if ( ! $success ) {
					continue;
				}

				$meeting = Arr::get( $response, 'data' );
				$booking->update_meta(
					'zoom_event_details',
					array(
						'meeting'    => $meeting,
						'account_id' => $account_id,
					)
				);

				$booking->logs()->create(
					array(
						'type'    => 'info',
						'message' => __( 'Meeting created in Zoom Calendar.', 'quillbooking' ),
						'details' => sprintf(
							__( 'Event has been added to Zoom Account %1$s: %2$s', 'quillbooking' ),
							$account_id,
							$meeting['join_url']
						),
					)
				);
			}
		} catch ( \Exception $e ) {
			error_log( 'Zoom Integration Debug - Exception: ' . $e->getMessage() );
			error_log( 'Zoom Integration Debug - Stack trace: ' . $e->getTraceAsString() );
		}
	}

	/**
	 * Get event description
	 *
	 * @since 1.0.0
	 *
	 * @param Booking_Model $booking Booking model.
	 *
	 * @return string
	 */
	public function get_event_description( $booking ) {
		$description  = sprintf(
			__( 'Event Detials:', 'quillbooking' ),
			$booking->event->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee: %s', 'quillbooking' ),
			$booking->guest->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee Email: %s', 'quillbooking' ),
			$booking->guest->email
		);
		$description .= PHP_EOL . PHP_EOL;
		$start_date   = new \DateTime( $booking->start_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$end_date     = new \DateTime( $booking->end_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$description .= sprintf(
			__( 'When:%4$s%1$s to %2$s (%3$s)', 'quillbooking' ),
			$start_date->format( 'Y-m-d H:i' ),
			$end_date->format( 'Y-m-d H:i' ),
			$booking->calendar->timezone,
			PHP_EOL
		);

		return $description;
		$description  = sprintf(
			__( 'Event Detials:', 'quillbooking' ),
			$booking->event->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee: %s', 'quillbooking' ),
			$booking->guest->name
		);
		$description .= PHP_EOL;
		$description .= sprintf(
			__( 'Invitee Email: %s', 'quillbooking' ),
			$booking->guest->email
		);
		$description .= PHP_EOL . PHP_EOL;
		$start_date   = new \DateTime( $booking->start_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$end_date     = new \DateTime( $booking->end_time, new \DateTimeZone( $booking->calendar->timezone ) );
		$description .= sprintf(
			__( 'When:%4$s%1$s to %2$s (%3$s)', 'quillbooking' ),
			$start_date->format( 'Y-m-d H:i' ),
			$end_date->format( 'Y-m-d H:i' ),
			$booking->calendar->timezone,
			PHP_EOL
		);

		return $description;
	}

	/**
	 * Get site UID
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_site_uid() {
		$site_uid = get_option( 'quillbooking_site_uid', '' );
		if ( empty( $site_uid ) ) {
			$site_uid = Utils::generate_hash_key();
			update_option( 'quillbooking_site_uid', $site_uid );
		}

		return $site_uid;
	}

	/**
	 * Connect the integration
	 *
	 * @since 1.0.0
	 *
	 * @param int $host_id Host ID.
	 * @param int $account_id Account ID.
	 *
	 * @return bool|API
	 */
	public function connect( $host_id, $account_id ) {
		parent::connect( $host_id, $account_id );

		// First try to get account from host
		$account = $this->accounts->get_account( $account_id );

		// If no account found, try to get global settings
		if ( empty( $account ) ) {
			$global_settings = get_option( 'quillbooking_zoom_settings', array() );
			if ( ! empty( $global_settings ) && ! empty( $global_settings['app_credentials'] ) ) {
				$account = array(
					'id'              => 'global',
					'app_credentials' => $global_settings['app_credentials'],
					'tokens'          => $global_settings['tokens'] ?? array(),
				);
				error_log( 'Zoom Integration Debug - Using global settings' );
			}
		}

		if ( empty( $account ) ) {
			error_log( 'Zoom Integration Debug - No account found for host or globally' );
			return false;
		}

		$access_token  = Arr::get( $account, 'tokens.access_token', '' );
		$refresh_token = Arr::get( $account, 'tokens.refresh_token', '' );

		error_log( 'Zoom Integration Debug - Access Token: ' . ( empty( $access_token ) ? 'Empty' : 'Present' ) );
		error_log( 'Zoom Integration Debug - Refresh Token: ' . ( empty( $refresh_token ) ? 'Empty' : 'Present' ) );

		// If we have an access token but no refresh token, we can still proceed
		if ( ! empty( $access_token ) ) {
			try {
				$this->api = new API( $access_token, $refresh_token, $this->app, $account_id, $this );
				error_log( 'Zoom Integration Debug - API initialized successfully with access token' );
				return $this->api;
			} catch ( \Exception $e ) {
				error_log( 'Zoom Integration Debug - API initialization failed: ' . $e->getMessage() );
			}
		}

		// If we get here, we need to try refreshing the tokens
		error_log( 'Zoom Integration Debug - Attempting to refresh tokens' );
		$app_credentials = Arr::get( $account, 'app_credentials', array() );
		if ( ! empty( $app_credentials ) ) {
			try {
				$tokens = $this->app->get_tokens(
					array(
						'client_id'     => Arr::get( $app_credentials, 'client_id' ),
						'client_secret' => Arr::get( $app_credentials, 'client_secret' ),
						'grant_type'    => 'client_credentials',
					),
					$account_id
				);

				if ( ! empty( $tokens ) ) {
					// Update global settings if we're using them
					if ( $account['id'] === 'global' ) {
						$global_settings           = get_option( 'quillbooking_zoom_settings', array() );
						$global_settings['tokens'] = $tokens;
						update_option( 'quillbooking_zoom_settings', $global_settings );
						error_log( 'Zoom Integration Debug - Updated global tokens' );
					} else {
						$this->accounts->update_account(
							$account_id,
							array(
								'tokens' => $tokens,
							)
						);
						error_log( 'Zoom Integration Debug - Updated account tokens' );
					}

					$access_token  = Arr::get( $tokens, 'access_token', '' );
					$refresh_token = Arr::get( $tokens, 'refresh_token', '' );
					error_log( 'Zoom Integration Debug - Tokens refreshed successfully' );

					if ( ! empty( $access_token ) ) {
						try {
							$this->api = new API( $access_token, $refresh_token, $this->app, $account_id, $this );
							error_log( 'Zoom Integration Debug - API initialized successfully after token refresh' );
							return $this->api;
						} catch ( \Exception $e ) {
							error_log( 'Zoom Integration Debug - API initialization failed after token refresh: ' . $e->getMessage() );
						}
					}
				}
			} catch ( \Exception $e ) {
				error_log( 'Zoom Integration Debug - Token refresh failed: ' . $e->getMessage() );
			}
		}

		error_log( 'Zoom Integration Debug - Failed to initialize API after all attempts' );
		$this->api = new \WP_Error( 'zoom_integration_error', __( 'Zoom Integration Error: Unable to initialize API.', 'quillbooking' ) );
		return false;
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
			'account_id'    => array(
				'type'        => 'text',
				'label'       => __( 'Account ID', 'quillbooking' ),
				'required'    => true,
				'placeholder' => __( 'Enter your Zoom Account ID', 'quillbooking' ),
				'description' => __( 'You can find your Account ID in your Zoom app settings.', 'quillbooking' ),
			),
			'client_id'     => array(
				'type'        => 'text',
				'label'       => __( 'Client ID', 'quillbooking' ),
				'required'    => true,
				'placeholder' => __( 'Enter your Zoom Client ID', 'quillbooking' ),
				'description' => __( 'You can find your Client ID in your Zoom app settings.', 'quillbooking' ),
			),
			'client_secret' => array(
				'type'        => 'text',
				'label'       => __( 'Secret Key', 'quillbooking' ),
				'required'    => true,
				'placeholder' => __( 'Enter your Zoom Secret Key', 'quillbooking' ),
				'description' => __( 'You can find your Secret Key in your Zoom app settings.', 'quillbooking' ),
			),
		);
	}

	/**
	 * Delete settings
	 *
	 * @since 1.0.0
	 *
	 * @param string|int $account_id Account ID. If empty, deletes global settings.
	 * @return void
	 */
	public function delete_settings( $account_id = '' ) {
		if ( empty( $account_id ) ) {
			// Delete global settings
			delete_option( $this->option_name );
			return;
		}

		// Delete account-specific settings
		$this->accounts->delete_account( $account_id );
	}
}
