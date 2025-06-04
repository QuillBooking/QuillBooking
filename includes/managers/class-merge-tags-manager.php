<?php
/**
 * Class Merge Tag Manager
 *
 * This class is responsible for handling the merge tags
 *
 * @since 1.0.0
 *
 * @package QuillBooking
 */

namespace QuillBooking\Managers;

use QuillBooking\Abstracts\Merge_Tag;
use QuillBooking\Models\Booking_Model;
use QuillBooking\Abstracts\Manager;
use QuillBooking\Traits\Singleton;

final class Merge_Tags_Manager extends Manager {

	use Singleton;

	/**
	 * Merge Tag Groups
	 *
	 * @var array
	 */
	private $groups = array();

	/**
	 * Register Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param Merge_Tag $merge_tag Merge Tag.
	 */
	public function register_merge_tag( Merge_Tag $merge_tag ) {
		$slug            = $merge_tag->slug;
		$merge_tag->slug = $merge_tag->group . '_' . $merge_tag->slug;
		parent::register( $merge_tag, Merge_Tag::class, 'slug' );

		$this->groups[ $merge_tag->group ]['mergeTags'][ $slug ] = array(
			'name'  => $merge_tag->name,
			'value' => "{{{$merge_tag->group}:{$slug}}}",
		);
	}

	/**
	 * Get Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Slug.
	 *
	 * @return Merge_Tag|null
	 */
	public function get_merge_tag( $slug ) {
		return $this->get_item( $slug );
	}

	/**
	 * Get Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_merge_tags() {
		return $this->get_items();
	}

	/**
	 * Get Merge Tag Groups
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Process Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @param string             $content Content.
	 * @param Booking_Model|null $booking Booking Model.
	 *
	 * @return string
	 */
	public function process_merge_tags( $content, $booking ) {
		// Return early if content is empty or null to avoid preg_replace_callback warnings
		if ( empty( $content ) ) {
			return '';
		}

		return preg_replace_callback(
			'/{{(.*?):(.*?)}}/',
			function( $matches ) use ( $booking ) {
				$group   = $matches[1];
				$slug    = $matches[2];
				$options = array();

				// Extract options from the slug
				if ( preg_match_all( '/(\w+)="([^"]+)"/', $slug, $option_matches ) ) {
					foreach ( $option_matches[1] as $key => $option_name ) {
						$options[ $option_name ] = $option_matches[2][ $key ];
					}

					// Remove options from the slug
					$slug = strtok( $slug, ' ' );
				}

				// Get the merge tag instance by group and slug
				$merge_tag = $this->get_item( $group . '_' . $slug );

				if ( ! $merge_tag ) {
					return '';
				}

				return $merge_tag->get_value( $booking, $options );
			},
			$content
		);
	}
}
