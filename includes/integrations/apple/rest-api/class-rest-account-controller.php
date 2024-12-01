<?php
/**
 * Class REST Integration Account Controller
 *
 * This class is responsible for handling the Integration Account REST API
 *
 * @since 1.0.0
 */

namespace QuillBooking\Integrations\Apple\REST_API;

use QuillBooking\Integration\REST_API\REST_Account_Controller as Abstract_REST_Account_Controller;
use QuillBooking\Integrations\Apple\Client;
use WP_REST_Response;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;

/**
 * Rest Integration Account Controller
 */
class REST_Account_Controller extends Abstract_REST_Account_Controller {

	/**
	 * Entities.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $entities = array(
		'calendars' => array(
			'callback' => 'fetch_calendars',
		),
		'events'    => array(
			'callback' => 'fetch_events',
		),
	);

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_item' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
				'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::CREATABLE ),
			)
		);
	}

	/**
	 * Get item schema
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'type'        => 'integer',
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => false,
				),
				'name'        => array(
					'type'        => 'string',
					'description' => __( 'Name of the account.', 'quillbooking' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'required'    => false,
				),
				'credentials' => array(
					'type'                 => 'object',
					'description'          => __( 'Credentials for the account.', 'quillbooking' ),
					'context'              => array( 'view', 'edit', 'embed' ),
					'required'             => true,
					'properties'           => array(
						'apple_id'     => array(
							'type'        => 'string',
							'description' => __( 'Apple ID for the account.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
						'app_password' => array(
							'type'        => 'string',
							'description' => __( 'App password for the account.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
					),
					'additionalProperties' => true,
				),
				'config'      => array(
					'type'                 => 'object',
					'description'          => __( 'Configuration for the account.', 'quillbooking' ),
					'context'              => array( 'view', 'edit', 'embed' ),
					'required'             => true,
					'additionalProperties' => true,
				),
			),
		);
	}

	/**
	 * Get remote data
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @param string          $entity Entity.
	 * @return array|WP_Error
	 */
	public function get_remote_data( $request, $entity ) {
		$host_id    = $request->get_param( 'calendar_id' );
		$account_id = $request->get_param( 'id' );
		$connect    = $this->integration->connect( $host_id, $account_id );
		if ( ! $connect instanceof Client ) {
			return new \WP_Error( 'unable_to_connect', __( 'Unable to connect to the integration.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		$params = $request->get_params();
		$entity = $this->get_entities()[ $entity ];
		// remote account data.
		$result = $this->integration->remote_data->{$entity['callback']}( $params );

		return rest_ensure_response( $result );
	}

	/**
	 * Create item
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_item( $request ) {
		$params       = $request->get_params();
		$apple_id     = Arr::get( $params, 'credentials.apple_id' );
		$app_password = Arr::get( $params, 'credentials.app_password' );
		$host_id      = $request->get_param( 'calendar_id' );

		try {
			$client     = new Client( $apple_id, $app_password );
			$data       = $client->get_calendars();
			$account_id = Arr::get( $data, 'account_id' );
			if ( ! $account_id ) {
				throw new Exception( __( 'Could not add Apple account.', 'quillbooking' ) );
			}
			$calendars = Arr::get( $data, 'calendars', array() );

			$this->integration->set_host( $host_id );
			$this->integration->accounts->add_account(
				$account_id,
				array(
					'name'        => $apple_id,
					'credentials' => array(
						'apple_id'     => $apple_id,
						'app_password' => $app_password,
					),
					'config'      => array(
						'host_id' => $host_id,
					),
				)
			);

			return new WP_REST_Response( $calendars, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'add_apple_account_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item permissions check
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return bool|\WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
