<?php

/**
 * Base Template Renderer
 * 
 * Contains common functionality for all renderers
 */

namespace QuillBooking\Booking\Renderers;

use QuillBooking\Booking\Data\Booking_Data_Formatter;
use QuillBooking\Models\User_Model;

abstract class Base_Template_Renderer {

	protected Booking_Data_Formatter $dataFormatter;

	public function __construct() {
		$this->dataFormatter = new Booking_Data_Formatter();
	}

	/**
	 * Get common head HTML
	 */
	protected function get_head( $title = '' ) {
		ob_start();
		?>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
		<head>
			<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
			<meta http-equiv="Imagetoolbar" content="No" />
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title><?php echo esc_html( $title ?: __( 'Booking', 'quillbooking' ) ); ?></title>
			<meta name="robots" content="noindex">
			<?php do_action('wp_enqueue_scripts'); ?>
		</head>
		<body class="quillbooking-body">
		<?php
		return ob_get_clean();
	}

	/**
	 * Get common footer HTML
	 */
	protected function get_footer() {
		ob_start();
		wp_footer();
		?>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}

	/**
	 * Enqueue common page assets
	 */
	protected function enqueue_page_assets() {
		wp_enqueue_script( 'quillbooking-page' );
		wp_enqueue_style( 'quillbooking-page' );
	}

	/**
	 * Enqueue React assets
	 */
	protected function enqueue_react_assets() {
		do_action( 'quillbooking_renderer_enqueue_scripts' );
		wp_enqueue_script( 'quillbooking-renderer' );
		wp_enqueue_style( 'quillbooking-renderer' );
	}

	/**
	 * Get event hosts data
	 */
	protected function get_event_hosts( $event ) {
		$ids   = $event->getTeamMembersAttribute() ?: array( $event->user->ID );
		$ids   = is_array( $ids ) ? $ids : array( $ids );
		$hosts = array();

		foreach ( $ids as $userId ) {
			$user = User_Model::find( $userId );
			if ( ! $user ) {
				continue;
			}
			$hosts[] = array(
				'id'    => $user->ID,
				'name'  => $user->display_name,
				'image' => get_avatar_url( $user->ID ),
			);
		}

		return $hosts;
	}

	/**
	 * Render React page helper
	 */
	protected function render_react_page( string $div_id ) {
		$this->enqueue_react_assets();
		echo $this->get_head();
		printf( '<div id="%s"></div>', esc_attr( $div_id ) );
		echo $this->get_footer();
		exit(200);
	}

	/**
	 * Render template page helper
	 */
	protected function render_template_page( string $template_path, array $variables = [] ) {
		if ( ! file_exists( $template_path ) ) {
			return false;
		}

		$this->enqueue_page_assets();
		extract( $variables );
		
		echo $this->get_head( $variables['title'] ?? '' );
		include $template_path;
		echo $this->get_footer();
		
		exit(200);
	}

	// /**
	//  * Render method - must be implemented by child classes
	//  * 
	//  * @param mixed ...$args Variable arguments depending on renderer type
	//  * @return mixed|false Returns rendered content or false on failure
	//  */
	// abstract public function render( ...$args );
}
