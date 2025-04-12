<?php
/**
 * Class Team_Model
 *
 * This class is responsible for handling the team model
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Models;

use QuillBooking\Models\User_Model;
use QuillBooking\Capabilities;

/**
 * Team Model class
 */
class Team_Model extends User_Model {

	/**
	 * Appends
	 *
	 * @var array
	 */
	protected $appends = array(
		'is_admin',
		'capabilities',
	);

	/**
	 * Get members
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public static function get_members() {
		$members = self::whereHas(
			'meta',
			function( $query ) {
				$query->where( 'meta_key', 'quillbooking_team_member' )->where( 'meta_value', 'yes' )->orWhere( 'meta_key', 'wp_capabilities' )->where( 'meta_value', 'like', '%administrator%' );
			}
		);

		return $members;
	}

	/**
	 * Check if user has 'administrator' capability
	 *
	 * @return bool
	 */
	public function getIsAdminAttribute() {
		return $this->meta()->where( 'meta_key', 'wp_capabilities' )
			->where( 'meta_value', 'like', '%administrator%' )
			->exists();
	}

	/**
	 * Is user a team member
	 *
	 * @return bool
	 */
	public function is_team_member() {
		return $this->meta()->where( 'meta_key', 'quillbooking_team_member' )
			->where( 'meta_value', 'yes' )
			->exists();
	}

	/**
	 * Get user capabilities specific to quillbooking
	 *
	 * @return array Filtered list of user capabilities
	 */
	public function getCapabilitiesAttribute() {
		$user_id                   = $this->ID;
		$user                      = new \WP_User( $user_id );
		$capabilities              = $user->get_role_caps();
		$quillbooking_capabilities = Capabilities::get_all_capabilities();

		return array_intersect_key( $capabilities, array_flip( $quillbooking_capabilities ) );
	}

	/**
	 * Boot method to attach specific quillbooking capabilities on user retrieval.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();
	}

}
