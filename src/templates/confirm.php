<?php
$icons_url = plugins_url( 'src/templates/icons/', QUILLBOOKING_PLUGIN_FILE );
?>

<div class="quillbooking-meeting">
	<div class="details-container">
		<div class="profile-picture">
			<img src="<?php echo esc_url( $icons_url . 'confirm.svg' ); ?>" alt="<?php esc_attr_e( 'confirmation', 'quillbooking' ); ?>" />
		</div>

		<h1 class="title"><?php esc_html_e( 'Your meeting has been Scheduled', 'quillbooking' ); ?></h1>
		<p class="calendar-info"><?php esc_html_e( 'A calendar invitation has been sent to your email address.', 'quillbooking' ); ?></p>

		<div class="booking-card">
			<h2 class="event-title">
				<?php echo esc_html( $booking_array['event']['name'] ?? '' ); ?>
			</h2>

			<p>
				<span>
					<img src="<?php echo esc_url( $icons_url . 'profile.svg' ); ?>" alt="Outlook" />
				</span>
				<?php if ( ! empty( $booking_array['hosts'] ) && is_array( $booking_array['hosts'] ) ) : ?>
					<?php foreach ( $booking_array['hosts'] as $host ) : ?>
						<?php if ( ! empty( $host['name'] ) ) : ?>
							<span><?php echo esc_html( $host['name'] ); ?></span>
						<?php endif; ?>
					<?php endforeach; ?>
				<?php endif; ?>
			</p>
			<p>
				<span>
					<img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="Outlook" />
				</span>

				<?php echo esc_html( $booking_array['formatted_time_range'] ?? '' ); ?>
			</p>
			<p>
				<span>
					<img src="<?php echo esc_url( $icons_url . 'icon.svg' ); ?>" alt="Outlook" />
				</span>
				<?php echo esc_html( $booking_array['timezone'] ?? '' ); ?>
			</p>
			<p>
				<span>
					<img src="<?php echo esc_url( $icons_url . 'location.svg' ); ?>" alt="Outlook" />
				</span>
				<?php echo wp_kses_post( $booking_array['location'] ?? '' ); ?>
			</p>
		</div>

		<div class="calendar-buttons">
			<p><?php esc_html_e( 'Add your Scheduled to calendars.', 'quillbooking' ); ?></p>
			<div class="icons">
				<img src="<?php echo esc_url( $icons_url . 'outlook.svg' ); ?>" alt="Outlook" />
				<img src="<?php echo esc_url( $icons_url . 'google.svg' ); ?>" alt="Google Calendar" />
				<img src="<?php echo esc_url( $icons_url . 'apple.svg' ); ?>" alt="Apple Calendar" />
			</div>
		</div>
	</div>



	<div class="confirmation-footer">
		<div class="change-options">
			<p><?php esc_html_e( 'Need to make a change?', 'quillbooking' ); ?>
				<a href="?quillbooking=booking&id=<?php echo $booking_array['hash_id']; ?>&type=cancel" class="cancel-link"><?php esc_html_e( 'Cancel', 'quillbooking' ); ?></a>
				<?php esc_html_e( 'or', 'quillbooking' ); ?>
				<a href="?quillbooking=booking&id=<?php echo $booking_array['hash_id']; ?>&type=reschedule" class="reschedule-link"><?php esc_html_e( 'Reschedule', 'quillbooking' ); ?></a>
			</p>
		</div>

		<div class="cancellation-policy">
			<h3><?php esc_html_e( 'Cancellation policy:', 'quillbooking' ); ?></h3>
			<p><?php esc_html_e( 'You can cancel or reschedule anytime before the appointment time.', 'quillbooking' ); ?></p>

			<h3><?php esc_html_e( 'Additional information:', 'quillbooking' ); ?></h3>
			<p><?php esc_html_e( 'You may receive appointment-specific communication from Quill Booking. This includes confirmations, receipts and reminders via email and SMS.', 'quillbooking' ); ?></p>
		</div>
	</div>
</div>
