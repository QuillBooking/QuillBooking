<?php
$icons_url           = plugins_url( 'src/templates/icons/', QUILLBOOKING_PLUGIN_FILE );
$cancellation_reason = $fields['cancellation_reason'];
$status              = $booking_array['status'] ?? '';
?>

<link rel="stylesheet" href="<?php echo esc_url( plugins_url( 'src/templates/css/cancellation.css', QUILLBOOKING_PLUGIN_FILE ) ); ?>">
<style>
@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

#cancel_booking_button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

#loading_spinner {
	display: inline-flex;
	align-items: center;
}

.cancellation-denied-message {
	background-color: #fef2f2;
	border: 1px solid #fecaca;
	color: #dc2626;
	padding: 15px;
	border-radius: 6px;
	margin: 20px 0;
	text-align: center;
}
</style>

<div class="quillbooking-meeting">
	<div class="details-container">
		<div class="profile-picture">
			<img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="<?php esc_attr_e( 'cancellation', 'quillbooking' ); ?>" />
		</div>

		<h1 class="title"><?php esc_html_e( 'Booking Cancellation', 'quillbooking' ); ?></h1>
		<p class="calendar-info"><?php esc_html_e( 'Confirm and cancel the scheduled booking', 'quillbooking' ); ?></p>

		<div class="booking-card">
			<h2 class="event-title"><?php echo esc_html( $booking_array['event']['name'] ?? '' ); ?></h2>
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
			<p><span><img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="Time" /></span><?php echo esc_html( $booking_array['formatted_time_range'] ?? '' ); ?>
			</p>
			<p><span><img src="<?php echo esc_url( $icons_url . 'icon.svg' ); ?>" alt="Timezone" /></span><?php echo esc_html( $booking_array['timezone'] ?? '' ); ?></p>
			<p><span><img src="<?php echo esc_url( $icons_url . 'location.svg' ); ?>" alt="Location" /></span> <?php echo wp_kses_post( $booking_array['location'] ?? '' ); ?></p>
		</div>

		<?php if ( strtolower( $status ) == 'cancelled' ) : ?>
			<div class="already-cancelled-message">
				<?php esc_html_e( 'This booking has already been cancelled.', 'quillbooking' ); ?>
			</div>
		<?php elseif ( ! $can_cancel ) : ?>
			<div class="cancellation-denied-message">
				<?php echo wp_kses_post( $cancel_denied_message ); ?>
			</div>
		<?php else : ?>
			<div class="cancellation-container">
				<?php if ( $cancellation_reason['enabled'] ) : ?>
					<div class="cancellation-input-container">
						<label for="cancellation_reason">
							<?php echo esc_attr( $cancellation_reason['label'] ); ?>
							<?php if ( $cancellation_reason['required'] ) : ?>
								<span class="required">*</span>
							<?php endif; ?>
						</label>
						<div class="validation-message" id="validation_message" aria-live="polite"></div>
						<textarea class="cancellation-reason" name="cancellation_reason" id="cancellation_reason" rows="4" placeholder="<?php echo esc_attr( $cancellation_reason['placeholder'] ); ?>"
							<?php
							if ( $cancellation_reason['required'] ) :
								?>
							required<?php endif; ?>></textarea>
					</div>
					<?php if ( $cancellation_reason['helpText'] ) : ?>
						<p class="help-text"><?php echo $cancellation_reason['helpText']; ?></p>
					<?php endif; ?>
				<?php endif; ?>

				<div class="calendar-buttons-container" id="buttons_container">
					<a href="?quillbooking=booking&id=<?php echo esc_attr( $booking_array['hash_id'] ); ?>&type=confirm" class="cancel-btn nevermind-btn"><?php esc_html_e( 'Nevermind', 'quillbooking' ); ?></a>
					<button class="cancel-btn" id="cancel_booking_button">
						<span id="button_text"><?php esc_html_e( 'Cancel Booking', 'quillbooking' ); ?></span>
						<span id="loading_spinner" style="display: none;">
							<svg width="16" height="16" viewBox="0 0 16 16" style="animation: spin 1s linear infinite; margin-right: 8px;">
								<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="37.7" stroke-dashoffset="37.7" opacity="0.25"></circle>
								<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="37.7" stroke-dashoffset="9.4"></circle>
							</svg>
							<?php esc_html_e( 'Cancelling...', 'quillbooking' ); ?>
						</span>
					</button>
				</div>
			</div>
		<?php endif; ?>

		<div class="success-message" id="success_message" aria-live="polite" hidden></div>
	</div>
</div>

<script>
	document.getElementById('cancel_booking_button')?.addEventListener('click', function(event) {
		event.preventDefault();
		
		// Check if cancellation is allowed
		if (!<?php echo json_encode( $can_cancel ); ?>) {
			return;
		}
		
		const textarea = document.getElementById('cancellation_reason');
		const validation = document.getElementById('validation_message');
		const button = document.getElementById('cancel_booking_button');
		const buttonText = document.getElementById('button_text');
		const loadingSpinner = document.getElementById('loading_spinner');
		
		if (validation) {
			validation.textContent = '';
		}

		if (textarea && !textarea.value.trim() && <?php echo json_encode( $cancellation_reason['required'] ); ?> && <?php echo json_encode( $cancellation_reason['enabled'] ); ?>) {
			validation.textContent = '<?php echo esc_js( __( 'This field is required.', 'quillbooking' ) ); ?>';
			textarea.classList.add('error');
			return;
		}

		// Show loading state
		button.disabled = true;
		buttonText.style.display = 'none';
		loadingSpinner.style.display = 'inline-flex';
		loadingSpinner.style.alignItems = 'center';

		const formData = new FormData();
		formData.append('id', '<?php echo esc_js( $booking_array['hash_id'] ); ?>');
		if (textarea) {
			formData.append('cancellation_reason', textarea.value);
		}
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
					// Reset loading state on error
					button.disabled = false;
					buttonText.style.display = 'inline';
					loadingSpinner.style.display = 'none';
					
					validation.textContent = data.message || '<?php echo esc_js( __( 'An error occurred while canceling the booking.', 'quillbooking' ) ); ?>';
					textarea.classList.add('error');
				}
			})
			.catch(() => {
				// Reset loading state on error
				button.disabled = false;
				buttonText.style.display = 'inline';
				loadingSpinner.style.display = 'none';
				
				validation.textContent = '<?php echo esc_js( __( 'An error occurred. Please try again later.', 'quillbooking' ) ); ?>';
				textarea.classList.add('error');
			});
	});
</script>
