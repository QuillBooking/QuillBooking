<div class="quillbooking-meeting-confirmation">
	<div class="confirmation-details-container">
		<div class="profile-picture">
			<img src="URL_TO_PROFILE_IMAGE" alt="<?php esc_attr_e( 'confirmation', 'quillbooking' ); ?>" />
		</div>

		<h1 class="confirmation-title"><?php esc_html_e( 'Your meeting has been Scheduled', 'quillbooking' ); ?></h1>
		<p class="calendar-info"><?php esc_html_e( 'A calendar invitation has been sent to your email address.', 'quillbooking' ); ?></p>

		<div class="booking-card">
			<h2 class="event-title">
				<?php echo esc_html( $booking_array['event']['name'] ?? '' ); ?>
			</h2>

			<p><strong><?php esc_html_e( 'Host:', 'quillbooking' ); ?></strong> <?php echo esc_html( $booking_array['event']['host'] ?? 'Khaled Nour' ); ?></p>
			<p><strong><?php esc_html_e( 'Date & Time:', 'quillbooking' ); ?></strong>
				<?php echo esc_html( $booking_array['start_time'] ?? '' ); ?>
			</p>
			<p><strong><?php esc_html_e( 'Time Zone:', 'quillbooking' ); ?></strong> <?php echo esc_html( $booking_array['timezone'] ?? '' ); ?></p>
			<p><strong><?php esc_html_e( 'Location:', 'quillbooking' ); ?></strong> <?php echo esc_html( $booking_array['location'] ?? '' ); ?></p>
		</div>

		<div class="calendar-buttons">
			<p><?php esc_html_e( 'Add your Scheduled to calendars.', 'quillbooking' ); ?></p>
			<div class="icons">
				<img src="URL_TO_OUTLOOK_ICON" alt="Outlook" />
				<img src="URL_TO_GOOGLE_CALENDAR_ICON" alt="Google Calendar" />
				<img src="URL_TO_APPLE_CALENDAR_ICON" alt="Apple Calendar" />
			</div>
		</div>
	</div>



	<div class="confirmation-footer">
		<div class="change-options">
			<p><?php esc_html_e( 'Need to make a change?', 'quillbooking' ); ?>
				<a href="#" class="cancel-link"><?php esc_html_e( 'Cancel', 'quillbooking' ); ?></a>
				<?php esc_html_e( 'or', 'quillbooking' ); ?>
				<a href="#" class="reschedule-link"><?php esc_html_e( 'Reschedule', 'quillbooking' ); ?></a>
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
