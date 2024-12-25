<?php
/**
 * Class REST Integration Account Controller
 *
 * This class is responsible for handling the Integration Account REST API
 *
 * @since 1.0.0
 */

namespace QuillBooking\Integration\REST_API;

use QuillBooking\Integration\Integration;
use QuillBooking\Integration\API;
use QuillBooking\Abstracts\REST_Controller;
use WP_REST_Server;
use WP_REST_Response;
use WP_Error;
use Exception;

/**
 * Rest Integration Account Controller
 */
class REST_Account_Controller extends REST_Controller {

	/**
	 * Integration.
	 *
	 * @var Integration
	 */
	protected $integration;

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $rest_base = 'accounts';

	/**
	 * Entities.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $entities;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration
	 */
	public function __construct( Integration $integration ) {
		$this->integration = $integration;
		$this->rest_base   = "integrations/{$this->integration->slug}/(?P<calendar_id>[\d]+)/{$this->rest_base}";

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Get entities.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_entities() {
		return $this->entities;
	}

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/(?P<id>[\w]+)",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::READABLE ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::DELETABLE ),
				),
			)
		);

		$entities = $this->get_entities();

		foreach ( $entities ?? array() as $entity => $data ) {
			register_rest_route(
				$this->namespace,
				"/{$this->rest_base}/(?P<id>[\w]+)" . "/{$entity}",
				array(
					'methods'             => 'GET',
					'callback'            => function( $request ) use ( $entity ) {
						return $this->get_remote_data( $request, $entity );
					},
					'permission_callback' => array( $this, 'get_entity_permissions_check' ),
				)
			);
		}
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
				'id'     => array(
					'type'        => array( 'integer', 'string' ),
					'description' => __( 'Unique identifier for the object.', 'quillbooking' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'name'   => array(
					'type'        => 'string',
					'description' => __( 'Name of the account.', 'quillbooking' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'required'    => true,
				),
				'tokens' => array(
					'type'                 => 'object',
					'description'          => __( 'Credentials for the account.', 'quillbooking' ),
					'context'              => array( 'view', 'edit', 'embed' ),
					'required'             => true,
					'properties'           => array(
						'access_token'  => array(
							'type'        => 'string',
							'description' => __( 'Access token for the account.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
						'refresh_token' => array(
							'type'        => 'string',
							'description' => __( 'Refresh token for the account.', 'quillbooking' ),
							'context'     => array( 'view', 'edit', 'embed' ),
							'required'    => true,
						),
					),
					'additionalProperties' => true,
				),
				'config' => array(
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
		if ( ! $connect instanceof API ) {
			return new \WP_Error( 'unable_to_connect', __( 'Unable to connect to the integration.', 'quill-booking' ), array( 'status' => 400 ) );
		}

		$params = $request->get_params();
		$entity = $this->get_entities()[ $entity ];
		// remote account data.
		$result = $this->integration->remote_data->{$entity['callback']}( $params );

		return rest_ensure_response( $result );
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		try {
			$host_id = $request->get_param( 'calendar_id' );
			$this->integration->set_host( $host_id );
			$accounts = $this->integration->accounts->get_accounts();

			return new WP_REST_Response( $accounts, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		try {
			$account_id = $request->get_param( 'id' );
			$host_id    = $request->get_param( 'calendar_id' );
			$this->integration->set_host( $host_id );
			$account = $this->integration->accounts->get_account( $account_id );

			return new WP_REST_Response( $account, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		try {
			$account_id = $request->get_param( 'id' );
			$host_id    = $request->get_param( 'calendar_id' );
			$config     = $request->get_param( 'config' );
			$this->integration->set_host( $host_id );
			$account = $this->integration->accounts->update_account(
				$account_id,
				array(
					'config' => $config,
				)
			);

			return new WP_REST_Response( $account, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		try {
			$account_id = $request->get_param( 'id' );
			$host_id    = $request->get_param( 'calendar_id' );
			$this->integration->set_host( $host_id );
			$this->integration->accounts->delete_account( $account_id );

			return new WP_REST_Response( null, 204 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get entity permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool|WP_Error
	 */
	public function get_entity_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
