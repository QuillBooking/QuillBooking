<?php
$icons_url           = plugins_url( 'src/templates/icons/', QUILLBOOKING_PLUGIN_FILE );
$cancellation_reason = $fields['cancellation_reason'];
$status              = $booking_array['status'] ?? '';
?>

<link rel="stylesheet" href="<?php echo esc_url( plugins_url( 'src/templates/css/cancellation.css', QUILLBOOKING_PLUGIN_FILE ) ); ?>">

<div class="quillbooking-meeting">
	<div class="details-container">
		<div class="profile-picture">
			<img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="<?php esc_attr_e( 'cancellation', 'quillbooking' ); ?>" />
		</div>

		<h1 class="title"><?php esc_html_e( 'Booking Cancellation', 'quillbooking' ); ?></h1>
		<p class="calendar-info"><?php esc_html_e( 'Confirm and cancel the scheduled booking', 'quillbooking' ); ?></p>

		<div class="booking-card">
			<h2 class="event-title"><?php echo esc_html( $booking_array['event']['name'] ?? '' ); ?></h2>
			<p><span><img src="<?php echo esc_url( $icons_url . 'profile.svg' ); ?>" alt="Host" /></span><?php echo esc_html( $booking_array['event']['host'] ?? '' ); ?></p>
			<p><span><img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="Time" /></span><?php echo esc_html( $booking_array['start_time'] ?? '' ); ?></p>
			<p><span><img src="<?php echo esc_url( $icons_url . 'icon.svg' ); ?>" alt="Timezone" /></span><?php echo esc_html( $booking_array['timezone'] ?? '' ); ?></p>
			<p><span><img src="<?php echo esc_url( $icons_url . 'location.svg' ); ?>" alt="Location" /></span><?php echo esc_html( $booking_array['location'] ?? '' ); ?></p>
		</div>

		<?php if ( strtolower( $status ) == 'cancelled' ) : ?>
			<div class="already-cancelled-message">
				<?php esc_html_e( 'This booking has already been cancelled.', 'quillbooking' ); ?>
			</div>
		<?php else : ?>
			<div class="cancellation-container">
				<div class="cancellation-input-container">
					<label for="cancellation_reason">
						<?php echo esc_attr( $cancellation_reason['label'] ); ?>
						<?php if ( ! empty( $cancellation_reason['required'] ) ) : ?>
							<span class="required">*</span>
						<?php endif; ?>
					</label>
					<div class="validation-message" id="validation_message" aria-live="polite"></div>
					<textarea class="cancellation-reason" name="cancellation_reason" id="cancellation_reason" rows="4" placeholder="<?php echo esc_attr( $cancellation_reason['placeholder'] ); ?>"
						<?php
						if ( ! empty( $cancellation_reason['required'] ) ) :
							?>
						required<?php endif; ?>></textarea>
				</div>

				<div class="calendar-buttons-container" id="buttons_container">
					<a href="?quillbooking=booking&id=<?php echo esc_attr( $booking_array['hash_id'] ); ?>&type=confirm" class="cancel-btn nevermind-btn"><?php esc_html_e( 'Nevermind', 'quillbooking' ); ?></a>
					<button class="cancel-btn" id="cancel_booking_button"><?php esc_html_e( 'Cancel Booking', 'quillbooking' ); ?></button>
				</div>
			</div>
		<?php endif; ?>

		<div class="success-message" id="success_message" aria-live="polite" hidden></div>
	</div>
</div>

<script>
	document.getElementById('cancel_booking_button')?.addEventListener('click', function(event) {
		event.preventDefault();
		const textarea = document.getElementById('cancellation_reason');
		const validation = document.getElementById('validation_message');
		validation.textContent = '';

		if (!textarea.value.trim() && <?php echo json_encode( ! empty( $cancellation_reason['required'] ) ); ?>) {
			validation.textContent = '<?php echo esc_js( __( 'This field is required.', 'quillbooking' ) ); ?>';
			textarea.classList.add('error');
			return;
		}

		const formData = new FormData();
		formData.append('id', '<?php echo esc_js( $booking_array['hash_id'] ); ?>');
		formData.append('cancellation_reason', textarea.value);
		formData.append('action', 'quillbooking_cancel_booking');

		fetch('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', {
				method: 'POST',
				body: formData,
			})
			.then(response => response.json())
			.then(data => {
				if (data.success) {
					// Hide input container and buttons on success
					document.querySelector('.cancellation-container').hidden = true;

					const successDiv = document.getElementById('success_message');
					successDiv.textContent = '<?php echo esc_js( __( 'Booking successfully canceled.', 'quillbooking' ) ); ?>';
					successDiv.hidden = false;
				} else {
					validation.textContent = data.message || '<?php echo esc_js( __( 'An error occurred while canceling the booking.', 'quillbooking' ) ); ?>';
					textarea.classList.add('error');
				}
			})
			.catch(() => {
				validation.textContent = '<?php echo esc_js( __( 'An error occurred. Please try again later.', 'quillbooking' ) ); ?>';
				textarea.classList.add('error');
			});
	});
</script>
