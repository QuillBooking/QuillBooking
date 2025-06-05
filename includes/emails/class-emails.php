<?php

/**
 * Emails: class Emails
 *
 * @since 1.0.0
 * @package QuillBooking
 * @subpackage Emails
 */

namespace QuillBooking\Emails;

use QuillBooking\Settings;

use function add_action;
use function add_filter;
use function remove_filter;
use function get_bloginfo;
use function get_option;
use function is_email;
use function apply_filters;
use function wp_mail;
use function wpautop;
use function make_clickable;
use function load_template;
use function trailingslashit;
use function get_stylesheet_directory;
use function get_template_directory;
use function wp_check_invalid_utf8;
use function wp_pre_kses_less_than;
use function wp_strip_all_tags;
use function wp_kses_decode_entities;
use function wp_kses_post;

/**
 * Emails.
 *
 * This class handles all (notification) emails sent by Quill Forms .
 *
 * Heavily influenced by the great AffiliateWP plugin by Pippin Williamson and WP forms.
 * https://github.com/JustinSainton/AffiliateWP/blob/master/includes/emails/class-affwp-emails.php
 *
 * @since 1.0.0
 */
class Emails {

	/**
	 * Store the from address.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $from_address;

	/**
	 * Store the from name.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $from_name;

	/**
	 * Store the reply-to address.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $reply_to = false;

	/**
	 * Store the reply-to name.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $reply_to_name;

	/**
	 * Store the reply-to email.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $reply_to_email;

	/**
	 * Store the carbon copy addresses.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $cc = false;

	/**
	 * Store the email content type.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $content_type;

	/**
	 * Store the email headers.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $headers;

	/**
	 * Whether to send email in HTML.
	 *
	 * @since 1.0.0
	 *
	 * @var bool
	 */
	public $html = true;

	/**
	 * The email template to use.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $template;

	/**
	 * Store the recipient email address.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	private $to;

	/**
	 * Store the booking object.
	 *
	 * @since 1.0.0
	 *
	 * @var object
	 */
	public $booking;

	/**
	 * Store the custom footer.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $footer;

	/**
	 * Whether to use host from name.
	 *
	 * @since 1.0.0
	 *
	 * @var bool
	 */
	public $use_host_from_name;

	/**
	 * Whether to use host reply to email.
	 *
	 * @since 1.0.0
	 *
	 * @var bool
	 */
	public $use_host_reply_to_email;

	/**
	 * Get things going.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		if ( 'none' === $this->get_template() ) {
			$this->html = false;
		}

		add_action( 'quillbooking_email_send_before', array( $this, 'send_before' ) );
		add_action( 'quillbooking_email_send_after', array( $this, 'send_after' ) );
	}

	/**
	 * Get the email from name.
	 *
	 * @since 1.0.0
	 *
	 * @return string The email from name
	 */
	public function get_from_name() {
		$settings = self::getGlobalSettings( 'email' );

		// Check if we should use host name
		if ( ! empty( $settings['use_host_from_name'] ) && isset( $this->booking ) && isset( $this->booking->calendar ) && isset( $this->booking->calendar->user ) ) {
			$this->from_name = $this->booking->calendar->user->display_name;
		} elseif ( ! empty( $settings['from_name'] ) ) {
			$this->from_name = $settings['from_name'];
		} else {
			$this->from_name = get_bloginfo( 'name' );
		}

		return apply_filters( 'quillbooking_email_from_name', $this->decode_string( $this->from_name ), $this );
	}

	/**
	 * Get the email from address.
	 *
	 * @since 1.0.0
	 *
	 * @return string The email from address.
	 */
	public function get_from_address() {
		$settings = self::getGlobalSettings( 'email' );

		// Always use WordPress admin email as the default sender
		$admin_email = get_option( 'admin_email' );

		if ( ! empty( $settings['from_email'] ) && $settings['from_email'] !== $this->to ) {
			$this->from_address = $settings['from_email'];
		} else {
			$this->from_address = $admin_email;
		}

		return apply_filters( 'quillbooking_email_from_address', $this->decode_string( $this->from_address ), $this );
	}

	/**
	 * Get the email reply-to.
	 *
	 * @since 1.0.0
	 *
	 * @return string The email reply-to address.
	 */
	public function get_reply_to() {
		$settings       = self::getGlobalSettings( 'email' );
		$this->reply_to = false;

		// Check if we should use host email
		if ( ! empty( $settings['use_host_reply_to_email'] ) && isset( $this->booking ) && isset( $this->booking->calendar ) && isset( $this->booking->calendar->user ) ) {
			$host_email = $this->booking->calendar->user->user_email;

			if ( is_email( $host_email ) ) {
				$this->reply_to = $host_email;
			}
		} elseif ( ! empty( $settings['reply_to_email'] ) ) {
			$reply_to_email = $settings['reply_to_email'];

			if ( is_email( $reply_to_email ) ) {
				// Combine reply-to name and email if both are set
				if ( ! empty( $settings['reply_to_name'] ) ) {
					$this->reply_to = sprintf( '%s <%s>', $settings['reply_to_name'], $reply_to_email );
				} else {
					$this->reply_to = $reply_to_email;
				}
			}
		}

		// Apply filters but preserve the email format
		return apply_filters( 'quillbooking_email_reply_to', $this->reply_to, $this );
	}

	/**
	 * Get the email carbon copy addresses.
	 *
	 * @since 1.0.0
	 *
	 * @return string The email reply-to address.
	 */
	public function get_cc() {
		if ( ! empty( $this->cc ) ) {

			$this->cc = $this->cc;

			$addresses = array_map( 'trim', explode( ',', $this->cc ) );

			foreach ( $addresses as $key => $address ) {
				if ( ! is_email( $address ) ) {
					unset( $addresses[ $key ] );
				}
			}

			$this->cc = implode( ',', $addresses );
		}

		return apply_filters( 'quillbooking_email_cc', $this->decode_string( $this->cc ), $this );
	}

	/**
	 * Get the email content type.
	 *
	 * @since 1.0.0
	 *
	 * @return string The email content type.
	 */
	public function get_content_type() {
		if ( ! $this->content_type && $this->html ) {
			$this->content_type = apply_filters( 'quillbooking_email_default_content_type', 'text/html', $this );
		} elseif ( ! $this->html ) {
			$this->content_type = 'text/plain';
		}

		return apply_filters( 'quillbooking_email_content_type', $this->content_type, $this );
	}

	/**
	 * Get the email headers.
	 *
	 * @since 1.0.0
	 *
	 * @return string The email headers.
	 */
	public function get_headers() {
		if ( ! $this->headers ) {
			$from_address = $this->get_from_address();

			$this->headers = "From: {$this->get_from_name()} <{$from_address}>\r\n";
			if ( $this->get_reply_to() ) {
				$this->headers .= "Reply-To: {$this->get_reply_to()}\r\n";
			}
			if ( $this->get_cc() ) {
				$this->headers .= "Cc: {$this->get_cc()}\r\n";
			}
			$this->headers .= "Content-Type: {$this->get_content_type()}; charset=utf-8\r\n";
		}

		return apply_filters( 'quillbooking_email_headers', $this->headers, $this );
	}

	/**
	 * Build the email.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message The email message.
	 *
	 * @return string
	 */
	public function build_email( $message ) {
		$settings = self::getGlobalSettings( 'email' );

		// Plain text email shortcut.
		if ( false === $this->html ) {
			return apply_filters( 'quillbooking_email_message', $this->decode_string( $message ), $this );
		}

		/*
		 * Generate an HTML email.
		 */
		ob_start();

		$this->get_template_part( 'header', $this->get_template(), true );

		// Hooks into the email header.
		do_action( 'quillbooking_email_header', $this );

		$this->get_template_part( 'body', $this->get_template(), true );

		// Hooks into the email body.
		do_action( 'quillbooking_email_body', $this );

		$this->get_template_part( 'footer', $this->get_template(), true );

		// Add custom footer if set
		if ( ! empty( $settings['footer'] ) ) {
			echo wp_kses_post( $settings['footer'] );
		}

		// Hooks into the email footer.
		do_action( 'quillbooking_email_footer', $this );

		$message = htmlspecialchars_decode( $message );
		$message = nl2br( $message );

		$body = ob_get_clean();

		$message = str_replace( '{email}', $message, $body );
		$message = make_clickable( $message );

		return apply_filters( 'quillbooking_email_message', $message, $this );
	}

	/**
	 * Set the booking object.
	 *
	 * @since 1.0.0
	 *
	 * @param object $booking The booking object.
	 */
	public function set_booking( $booking ) {
		$this->booking = $booking;
	}

	/**
	 * Send the email.
	 *
	 * @since 1.0.0
	 *
	 * @param string $to          The To address.
	 * @param string $subject     The subject line of the email.
	 * @param string $message     The body of the email.
	 * @param array  $attachments Attachments to the email.
	 * @param object $booking     Optional. The booking object.
	 *
	 * @return bool
	 */
	public function send( $to, $subject, $message, $attachments = array(), $booking = null ) {
		$settings = self::getGlobalSettings( 'email' );

		// Set the booking object if provided
		if ( $booking ) {
			$this->set_booking( $booking );
		}

		// Don't send if email address is invalid.
		if ( ! is_email( $to ) ) {
			error_log( sprintf( '[QuillBooking] Error: Invalid recipient email address: %s', $to ) );
			return false;
		}

		// Store recipient for later use
		$this->to = $to;

		// Hooks before email is sent.
		do_action( 'quillbooking_email_send_before', $this );

		// Reset headers to ensure they are regenerated with correct from address
		$this->headers = null;

		$data = apply_filters(
			'quillbooking_emails_send_email_data',
			array(
				'to'          => $to,
				'subject'     => $subject,
				'message'     => $message,
				'headers'     => $this->get_headers(),
				'attachments' => $attachments,
			),
			$this
		);

		// Prepare subject and message.
		$prepared_subject = $this->get_prepared_subject( $data['subject'] );
		$prepared_message = $this->build_email( $data['message'] );

		// Send the email
		$result = wp_mail(
			$data['to'],
			$prepared_subject,
			$prepared_message,
			$data['headers'],
			$data['attachments']
		);

		// Hooks after the email is sent.
		do_action( 'quillbooking_email_send_after', $this );

		return $result;
	}

	/**
	 * Add filters/actions before the email is sent.
	 *
	 * @since 1.0.0
	 */
	public function send_before() {
		 add_filter( 'wp_mail_from', array( $this, 'get_from_address' ) );
		add_filter( 'wp_mail_from_name', array( $this, 'get_from_name' ) );
		add_filter( 'wp_mail_content_type', array( $this, 'get_content_type' ) );
	}

	/**
	 * Remove filters/actions after the email is sent.
	 *
	 * @since 1.0.0
	 */
	public function send_after() {
		remove_filter( 'wp_mail_from', array( $this, 'get_from_address' ) );
		remove_filter( 'wp_mail_from_name', array( $this, 'get_from_name' ) );
		remove_filter( 'wp_mail_content_type', array( $this, 'get_content_type' ) );
	}

	/**
	 * Convert text formatted HTML. This is primarily for turning line breaks
	 * into <p> and <br/> tags.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message Text to convert.
	 *
	 * @return string
	 */
	public function text_to_html( $message ) {

		if ( 'text/html' === $this->content_type || true === $this->html ) {
			$message = wpautop( $message );
		}

		return $message;
	}

	/**
	 * Get the enabled email template.
	 *
	 * @since 1.0.0
	 *
	 * @return string When filtering return 'none' to switch to text/plain email.
	 */
	public function get_template() {
		if ( ! $this->template ) {
			$this->template = 'default';
		}

		return apply_filters( 'quillbooking_email_template', $this->template );
	}

	/**
	 * Retrieve a template part. Taken from bbPress.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Template file slug.
	 * @param string $name Optional. Default null.
	 * @param bool   $load Maybe load.
	 *
	 * @return string
	 */
	public function get_template_part( $slug, $name = null, $load = true ) {

		// Setup possible parts.
		$templates = array();
		if ( isset( $name ) ) {
			$templates[] = $slug . '-' . $name . '.php';
		}
		$templates[] = $slug . '.php';

		// Return the part that is found.
		return $this->locate_template( $templates, $load, false );
	}

	/**
	 * Retrieve the name of the highest priority template file that exists.
	 *
	 * Search in the STYLESHEETPATH before TEMPLATEPATH so that themes which
	 * inherit from a parent theme can just overload one file. If the template is
	 * not found in either of those, it looks in the theme-compat folder last.
	 *
	 * Taken from bbPress.
	 *
	 * @since 1.0.0
	 *
	 * @param string|array $template_names Template file(s) to search for, in order.
	 * @param bool         $load           If true the template file will be loaded if it is found.
	 * @param bool         $require_once   Whether to require_once or require. Default true.
	 *                                     Has no effect if $load is false.
	 *
	 * @return string The template filename if one is located.
	 */
	public function locate_template( $template_names, $load = false, $require_once = true ) {

		// No file found yet.
		$located = false;

		// Try to find a template file.
		foreach ( (array) $template_names as $template_name ) {

			// Continue if template is empty.
			if ( empty( $template_name ) ) {
				continue;
			}

			// Trim off any slashes from the template name.
			$template_name = ltrim( $template_name, '/' );

			// Try locating this template file by looping through the template paths.
			foreach ( $this->get_theme_template_paths() as $template_path ) {
				if ( file_exists( $template_path . $template_name ) ) {
					$located = $template_path . $template_name;
					break;
				}
			}
		}

		if ( ( true === $load ) && ! empty( $located ) ) {
			load_template( $located, $require_once );
		}

		return $located;
	}

	/**
	 * Return a list of paths to check for template locations
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_theme_template_paths() {
		$template_dir = 'quillbooking-email';

		$file_paths = array(
			1   => trailingslashit( get_stylesheet_directory() ) . $template_dir,
			10  => trailingslashit( get_template_directory() ) . $template_dir,
			100 => QUILLBOOKING_PLUGIN_DIR . 'includes/emails/templates',
		);

		$file_paths = apply_filters( 'quillbooking_email_template_paths', $file_paths );

		// Sort the file paths based on priority.
		ksort( $file_paths, SORT_NUMERIC );

		return array_map( 'trailingslashit', $file_paths );
	}

	/**
	 * Perform email subject preparation: process tags, remove new lines, etc.
	 *
	 * @since 1.0.0
	 *
	 * @param string $subject Email subject to post-process.
	 *
	 * @return string
	 */
	private function get_prepared_subject( $subject ) {

		$subject = trim( str_replace( array( "\r\n", "\r", "\n" ), ' ', $subject ) );

		return $this->decode_string( $subject );
	}

	/**
	 * Helper function to sanitize a string from user input or from the db
	 * Forked from WordPress core
	 *
	 * @see https://developer.wordpress.org/reference/functions/_sanitize_text_fields/
	 * It is marked as a private function in WordPress.
	 * so we copied its implementation here in case it has been removed in any future WordPress version
	 *
	 * @since 1.0.0
	 *
	 * @param string $str           String to deeply sanitize.
	 * @param bool   $keep_newlines Whether to keep newlines. Default: false.
	 *
	 * @return string Sanitized string, or empty string if not a string provided.
	 */
	private function sanitize_text_fields( $str, $keep_newlines = false ) {
		if ( is_object( $str ) || is_array( $str ) ) {
			return '';
		}

		$str = (string) $str;

		$filtered = wp_check_invalid_utf8( $str );

		if ( strpos( $filtered, '<' ) !== false ) {
			$filtered = wp_pre_kses_less_than( $filtered );
			// This will strip extra whitespace for us.
			$filtered = wp_strip_all_tags( $filtered, false );

			// Use HTML entities in a special case to make sure no later
			// newline stripping stage could lead to a functional tag.
			$filtered = str_replace( "<\n", "&lt;\n", $filtered );
		}

		if ( ! $keep_newlines ) {
			$filtered = preg_replace( '/[\r\n\t ]+/', ' ', $filtered );
		}
		$filtered = trim( $filtered );

		$found = false;
		while ( preg_match( '/%[a-f0-9]{2}/i', $filtered, $match ) ) {
			$filtered = str_replace( $match[0], '', $filtered );
			$found    = true;
		}

		if ( $found ) {
			// Strip out the whitespace that may now exist after removing the octets.
			$filtered = trim( preg_replace( '/ +/', ' ', $filtered ) );
		}

		return $filtered;
	}

	/**
	 * Deeply sanitize the string, preserve newlines if needed.
	 * Prevent maliciously prepared strings from containing HTML tags.
	 * Heavily inspired by wpforms
	 *
	 * @since 1.0.0
	 *
	 * @param string $string        String to deeply sanitize.
	 * @param bool   $keep_newlines Whether to keep newlines. Default: false.
	 *
	 * @return string Sanitized string, or empty string if not a string provided.
	 */
	private function sanitize_text_deeply( $string, $keep_newlines = false ) {

		if ( is_object( $string ) || is_array( $string ) ) {
			return '';
		}

		$string        = (string) $string;
		$keep_newlines = (bool) $keep_newlines;

		$new_value = $this->sanitize_text_fields( $string, $keep_newlines );

		if ( strlen( $new_value ) !== strlen( $string ) ) {
			$new_value = $this->sanitize_text_deeply( $new_value, $keep_newlines );
		}

		return $new_value;
	}

	/**
	 * Decode special characters, both alpha- (<) and numeric-based (').
	 * Sanitize recursively, preserve new lines.
	 * Handle all the possible mixed variations of < and `&lt;` that can be processed into tags.
	 * Heavily inspired by wpforms
	 *
	 * @since 1.0.0
	 *
	 * @param string $string Raw string to decode.
	 *
	 * @return string
	 */
	private function decode_string( $string ) {

		if ( ! is_string( $string ) ) {
			return $string;
		}

		/*
		* Sanitization should be done first, so tags are stripped and < is converted to &lt; etc.
		* This iteration may do nothing when the string already comes with &lt; and &gt; only.
		*/
		$string = $this->sanitize_text_deeply( $string, true );

		// Now we need to convert the string without tags: &lt; back to < (same for quotes).
		$string = wp_kses_decode_entities( html_entity_decode( $string, ENT_QUOTES ) );

		// And now we need to sanitize AGAIN, to avoid unwanted tags that appeared after decoding.
		return $this->sanitize_text_deeply( $string, true );
	}

	/**
	 * Get global settings for the plugin
	 *
	 * @since 1.0.0
	 *
	 * @param string|null $settingsKey Optional. Specific settings key to retrieve.
	 * @return array|mixed The settings array or specific setting value.
	 */
	public static function getGlobalSettings( $settingsKey = null ) {

		if ( $settingsKey ) {
			return Settings::get( $settingsKey, array() );
		}
		return Settings::get_all();
	}
}
