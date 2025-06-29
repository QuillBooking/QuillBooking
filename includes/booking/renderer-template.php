<?php
defined( 'ABSPATH' ) || exit;
?>
<!DOCTYPE html>
<html lang="<?php echo get_locale(); ?>">

<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex">
	<title><?php echo esc_html__( 'Booking', 'quillbooking' ); ?></title>
	<style>
		html,
		body {
			margin: 0 !important;
			padding: 0 !important;
			width: 100%;
			height: 100%;
		}

		#quillbooking-booking-page,
		#quillbooking-reschedule-page {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
		}

		#quillbooking-booking-page~*,
		#quillbooking-reschedule-page~* {
			display: none !important;
		}

		* {
			box-sizing: border-box;
		}
	</style>
	<?php wp_head(); ?>
</head>

<body>
	<?php
	// Render the correct root div for React or PHP template
	if ( isset( $_GET['type'] ) && $_GET['type'] === 'reschedule' ) {
		echo '<div id="quillbooking-reschedule-page"></div>';
	} elseif ( ! isset( $_GET['type'] ) || ( $_GET['type'] !== 'reschedule' && $_GET['type'] !== 'confirm' && $_GET['type'] !== 'cancel' ) ) {
		echo '<div id="quillbooking-booking-page"></div>';
	}
	?>
	<?php wp_footer(); ?>
</body>

</html>