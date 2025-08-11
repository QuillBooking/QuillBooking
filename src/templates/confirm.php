<?php

use QuillBooking\Models\Booking_Model;
$icons_url = plugins_url( 'src/templates/icons/', QUILLBOOKING_PLUGIN_FILE );

$event_name  = $booking_array['event']['name'] ?? '';
$start_time  = $booking_array['start_time'] ?? ''; // Format: 'Y-m-d H:i:s' (stored as UTC)
$slot_time   = $booking_array['slot_time'] ?? 30; // Duration in minutes
$location    = $booking_array['location_value'] ?? '';
$description = $booking_array['description'] ?? $booking_array['event']['description'] ?? '';
$timezone    = $booking_array['timezone'] ?? 'UTC';

// Convert UTC time to user's timezone (same logic as your render_generic_page method)
try {
	$start_dt = new DateTime( $start_time, new DateTimeZone( 'UTC' ) );
	$start_dt->setTimezone( new DateTimeZone( $timezone ) );
	$end_dt = clone $start_dt;
	$end_dt->modify( "+{$slot_time} minutes" );
} catch ( Exception $e ) {
	// Fallback if timezone conversion fails
	$start_dt = new DateTime( $start_time );
	$end_dt   = new DateTime( $start_time );
	$end_dt->modify( '+30 minutes' );
}

// Format times in ISO 8601 for URLs
$start_iso = $start_dt->format( 'Ymd\THis' );
$end_iso   = $end_dt->format( 'Ymd\THis' );

// Google Calendar URL
$google_url = 'https://www.google.com/calendar/render?action=TEMPLATE'
	. '&text=' . urlencode( $event_name )
	. '&dates=' . $start_iso . '/' . $end_iso
	. '&details=' . urlencode( $description )
	. '&location=' . urlencode( $location )
	. '&sf=true&output=xml';

// Outlook Web Calendar URL
$outlook_url = 'https://outlook.live.com/calendar/0/deeplink/compose?'
	. 'subject=' . urlencode( $event_name )
	. '&startdt=' . $start_dt->format( 'Y-m-d\TH:i:s' )
	. '&enddt=' . $end_dt->format( 'Y-m-d\TH:i:s' )
	. '&body=' . urlencode( $description )
	. '&location=' . urlencode( $location );

// Apple iCloud Calendar URL
$apple_url = 'https://www.icloud.com/calendar/'
	. '?action=create'
	. '&title=' . urlencode( $event_name )
	. '&startDate=' . $start_iso
	. '&endDate=' . $end_iso
	. '&notes=' . urlencode( $description )
	. '&location=' . urlencode( $location );

// Keep ICS as fallback for offline calendar apps
$ics_content = 'BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//QuillBooking//EN
BEGIN:VEVENT
UID:' . uniqid() . '
DTSTAMP:' . gmdate( 'Ymd\THis\Z' ) . '
DTSTART:' . $start_dt->format( 'Ymd\THis' ) . '
DTEND:' . $end_dt->format( 'Ymd\THis' ) . '
SUMMARY:' . $event_name . '
DESCRIPTION:' . $description . '
LOCATION:' . $location . '
END:VEVENT
END:VCALENDAR';

$ics_filename = 'quillbooking_' . uniqid() . '.ics';
$upload_dir   = wp_upload_dir();
$ics_path     = trailingslashit( $upload_dir['path'] ) . $ics_filename;
$ics_url      = trailingslashit( $upload_dir['url'] ) . $ics_filename;

file_put_contents( $ics_path, $ics_content );

// Get advanced settings from the event


$advanced_settings = $booking_array['event']['advanced_settings'] ?? array();

// Check cancellation permissions
$can_cancel = true;

$find_booking = Booking_Model::find( $booking_array['id'] );

// resovle merge tags for permission_denied_message
$cancel_denied_message     = $merge_tags_manager->process_merge_tags( $advanced_settings['permission_denied_message'], $find_booking );
$reschedule_denied_message = $merge_tags_manager->process_merge_tags( $advanced_settings['reschedule_denied_message'], $find_booking );

if ( ! empty( $advanced_settings['attendee_cannot_cancel'] ) && $advanced_settings['attendee_cannot_cancel'] && $advanced_settings['cannot_cancel_time'] === 'event_start' ) {
	$can_cancel            = false;
	$cancel_denied_message = $cancel_denied_message ?? __( 'You do not have permission to cancel this booking.', 'quillbooking' );
} else {
	// Check time-based cancellation restrictions
	$cancel_time_restriction = $advanced_settings['cannot_cancel_time'];
	$cancel_time_value       = $advanced_settings['cannot_cancel_time_value'] ?? 24;
	$cancel_time_unit        = $advanced_settings['cannot_cancel_time_unit'] ?? 'hours';

	if ( $cancel_time_restriction === 'less_than' ) {
		try {
			$current_time     = new DateTime( 'now', new DateTimeZone( $timezone ) );
			$restriction_time = clone $start_dt;

			// Calculate the restriction time based on settings
			$time_modifier = "-{$cancel_time_value} {$cancel_time_unit}";
			$restriction_time->modify( $time_modifier );

			// If current time is past the restriction time, prevent cancellation
			if ( $current_time >= $restriction_time ) {
				$can_cancel            = false;
				$cancel_denied_message = $cancel_denied_message ?? __( 'Cancellation is no longer allowed for this booking.', 'quillbooking' );
			}
		} catch ( Exception $e ) {
			// If there's an error with time calculation, allow cancellation for safety
			$can_cancel = true;
		}
	}
}

// Check reschedule permissions
$can_reschedule = true;

if ( ! empty( $advanced_settings['attendee_cannot_reschedule'] ) && $advanced_settings['attendee_cannot_reschedule'] && $advanced_settings['cannot_reschedule_time'] === 'event_start' ) {
	$can_reschedule            = false;
	$reschedule_denied_message = $reschedule_denied_message ?? __( 'You do not have permission to reschedule this booking.', 'quillbooking' );
} else {
	// Check time-based reschedule restrictions
	$reschedule_time_restriction = $advanced_settings['cannot_reschedule_time'];
	$reschedule_time_value       = $advanced_settings['cannot_reschedule_time_value'] ?? 24;
	$reschedule_time_unit        = $advanced_settings['cannot_reschedule_time_unit'] ?? 'hours';

	if ( $reschedule_time_restriction === 'event_start' || $reschedule_time_restriction === 'less_than' ) {
		try {
			$current_time     = new DateTime( 'now', new DateTimeZone( $timezone ) );
			$restriction_time = clone $start_dt;

			// Calculate the restriction time based on settings
			$time_modifier = "-{$reschedule_time_value} {$reschedule_time_unit}";
			$restriction_time->modify( $time_modifier );

			// If current time is past the restriction time, prevent rescheduling
			if ( $current_time >= $restriction_time ) {
				$can_reschedule            = false;
				$reschedule_denied_message = $reschedule_denied_message ?? __( 'Rescheduling is no longer allowed for this booking.', 'quillbooking' );
			}
		} catch ( Exception $e ) {
			// If there's an error with time calculation, allow rescheduling for safety
			$can_reschedule = true;
		}
	}
}
?>

<div class="quillbooking-meeting">
	<div class="details-container">
		<div class="profile-picture">
			<img src="<?php echo esc_url( $icons_url . 'confirm.svg' ); ?>"
				alt="<?php esc_attr_e( 'confirmation', 'quillbooking' ); ?>" />
		</div>

		<h1 class="title"><?php esc_html_e( 'Your meeting has been Scheduled', 'quillbooking' ); ?></h1>
		<p class="calendar-info">
			<?php esc_html_e( 'A calendar invitation has been sent to your email address.', 'quillbooking' ); ?>
		</p>

		<div class="booking-card">
			<h2 class="event-title">
				<?php echo esc_html( $event_name ); ?>
			</h2>

			<p>
				<span><img src="<?php echo esc_url( $icons_url . 'profile.svg' ); ?>" alt="Host" /></span>
				<?php if ( ! empty( $booking_array['hosts'] ) && is_array( $booking_array['hosts'] ) ) : ?>
					<?php
					$host_names = array();
					foreach ( $booking_array['hosts'] as $host ) :
						if ( ! empty( $host['name'] ) ) :
							$host_names[] = esc_html( $host['name'] );
						endif;
					endforeach;
					?>
					<span><?php echo implode( ' - ', $host_names ); ?></span>
				<?php endif; ?>
			</p>
			<p>
				<span><img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="Date" /></span>
				<?php echo esc_html( $booking_array['formatted_time_range'] ?? '' ); ?>
			</p>
			<p>
				<span><img src="<?php echo esc_url( $icons_url . 'icon.svg' ); ?>" alt="Timezone" /></span>
				<?php echo esc_html( $timezone ); ?>
			</p>
			<p>
				<span><img src="<?php echo esc_url( $icons_url . 'location.svg' ); ?>" alt="Location" /></span>
				<?php echo wp_kses_post( $booking_array['location'] ?? '' ); ?>
			</p>
		</div>

		<div class="calendar-buttons">
			<p><?php esc_html_e( 'Add your Scheduled to calendars.', 'quillbooking' ); ?></p>
			<div class="icons">
				<!-- Outlook Web -->
				<a href="<?php echo esc_url( $outlook_url ); ?>" target="_blank" rel="noopener">
					<img src="<?php echo esc_url( $icons_url . 'outlook.svg' ); ?>" alt="Outlook" />
				</a>

				<!-- Google Calendar -->
				<a href="<?php echo esc_url( $google_url ); ?>" target="_blank" rel="noopener">
					<img src="<?php echo esc_url( $icons_url . 'google.svg' ); ?>" alt="Google Calendar" />
				</a>

				<!-- Apple iCloud Calendar -->
				<a href="<?php echo esc_url( $apple_url ); ?>" target="_blank" rel="noopener">
					<img src="<?php echo esc_url( $icons_url . 'apple.svg' ); ?>" alt="Apple Calendar" />
				</a>
			</div>
		</div>
	</div>

	<?php if ( ! isset( $_GET['embed_type'] ) || $_GET['embed_type'] !== 'Inline' ) : ?>
		<div class="confirmation-footer">
			<?php if ( $can_cancel || $can_reschedule ) : ?>
				<div class="change-options">
					<p><?php esc_html_e( 'Need to make a change?', 'quillbooking' ); ?>
						<?php if ( $can_cancel && $can_reschedule ) : ?>
							<a href="?quillbooking=booking&id=<?php echo esc_attr( $booking_array['hash_id'] ); ?>&type=cancel"
								class="cancel-link"><?php esc_html_e( 'Cancel', 'quillbooking' ); ?></a>
							<?php esc_html_e( 'or', 'quillbooking' ); ?>
							<a href="?quillbooking=booking&id=<?php echo esc_attr( $booking_array['hash_id'] ); ?>&type=reschedule"
								class="reschedule-link"><?php esc_html_e( 'Reschedule', 'quillbooking' ); ?></a>
						<?php elseif ( $can_cancel ) : ?>
							<a href="?quillbooking=booking&id=<?php echo esc_attr( $booking_array['hash_id'] ); ?>&type=cancel"
								class="cancel-link"><?php esc_html_e( 'Cancel', 'quillbooking' ); ?></a>
						<?php elseif ( $can_reschedule ) : ?>
							<a href="?quillbooking=booking&id=<?php echo esc_attr( $booking_array['hash_id'] ); ?>&type=reschedule"
								class="reschedule-link"><?php esc_html_e( 'Reschedule', 'quillbooking' ); ?></a>
						<?php endif; ?>
					</p>
				</div>
			
			<?php endif; ?>

			<?php if ( ! $can_cancel || ! $can_reschedule ) : ?>
				<div class="change-options">
					<p class="permission-denied-message">
						<?php
						if ( ! $can_cancel ) {
							echo '<p>';
							echo "<span class='cancel-link'>Cancel : </span>";
							echo esc_html( $cancel_denied_message );
							echo '</p>';
						}
						if ( ! $can_reschedule ) {
							echo '<p>';
							echo "<span class='reschedule-link'>Reschedule : </span>";
							echo esc_html( $reschedule_denied_message );
							echo '</p>';
						}
						?>
					</p>
				</div>
			<?php endif; ?>
			<!-- <div class="cancellation-policy">
			<h3>
			<?php
			// esc_html_e('Cancellation policy:', 'quillbooking');
			?>
			</h3> 
			<p>
				<?php
				// esc_html_e('You can cancel or reschedule anytime before the appointment time.', 'quillbooking');
				?>
				</p>

			<h3>
			<?php
			// esc_html_e('Additional information:', 'quillbooking');
			?>
			</h3>
			<p>
				<?php
				// esc_html_e('You may receive appointment-specific communication from Quill Booking. This includes confirmations, receipts and reminders via email and SMS.', 'quillbooking');
				?>
				</p>
		</div> -->

		</div>
	<?php endif; ?>
</div>
