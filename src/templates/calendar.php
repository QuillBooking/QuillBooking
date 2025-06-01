<link rel="stylesheet" href="<?php echo esc_url( plugins_url( 'src/templates/css/cancellation.css', QUILLBOOKING_PLUGIN_FILE ) ); ?>">

<div class="quillbooking-meeting">
  <div class="details-container">
	<div class="profile-picture">
	  <img src="<?php echo esc_url( $icons_url . 'calendar.svg' ); ?>" alt="<?php esc_attr_e( 'cancellation', 'quillbooking' ); ?>" />
	</div>

	<h1 class="title"><?php esc_html_e( 'Booking Cancellation', 'quillbooking' ); ?></h1>
	<p class="calendar-info"><?php esc_html_e( 'Confirm and cancel the scheduled booking', 'quillbooking' ); ?></p>


  </div>
</div>
