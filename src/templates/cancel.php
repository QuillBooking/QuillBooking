<?php
$icons_url          = plugins_url( 'src/templates/icons/', QUILLBOOKING_PLUGIN_FILE );
$cancelation_reason = $other_fields['cancellation_reason'];
?>

<div class="quillbooking-meeting-confirmation">
	<div class="confirmation-details-container">
		<div class="profile-picture">
			<img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="<?php esc_attr_e( 'confirmation', 'quillbooking' ); ?>" />
		</div>

		<h1 class="confirmation-title"><?php esc_html_e( 'Booking Cancellation', 'quillbooking' ); ?></h1>
		<p class="calendar-info"><?php esc_html_e( 'Confirm and cancel the scheduled booking', 'quillbooking' ); ?></p>

		<div class="booking-card">
			<h2 class="event-title">
				<?php echo esc_html( $booking_array['event']['name'] ?? '' ); ?>
			</h2>

			<p>
				<span>
					<img src="<?php echo esc_url( $icons_url . 'profile.svg' ); ?>" alt="Outlook" />
				</span>
				<?php echo esc_html( $booking_array['event']['host'] ?? '' ); ?>
			</p>
			<p>
				<span>
					<img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="Outlook" />
				</span>

				<?php echo esc_html( $booking_array['start_time'] ?? '' ); ?>
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
				<?php echo esc_html( $booking_array['location'] ?? '' ); ?>
			</p>
		</div>

		<div class="cancelation-input-container">
			<p><?php esc_html_e( 'Reason for cancellation', 'quillbooking' ); ?></p>
			<textarea class="cancellation-reason" name="cancellation_reason" id="cancellation_reason" rows="4" placeholder="<?php $cancelation_reason['placeholder']; ?>"></textarea>
		</div>

		<div class="calendar-buttons-container">
			<button class="cancel-btn" id="cancel_booking_button">
				<?php esc_html_e( 'Nevermind', 'quillbooking' ); ?>
			</button>
			<button class="cancel-btn" id="cancel_booking_button">
				<?php esc_html_e( 'Cancel Booking', 'quillbooking' ); ?>
			</button>
		</div>
	</div>
</div>
