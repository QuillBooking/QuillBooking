/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Config } from '@quillbooking/types';
import './style.scss';
import EventCard from './components/event-card';
import ReschedulePage from './reschedule-page';

const schedule = document.getElementById('quillbooking-booking-page');
const reschedule = document.getElementById('quillbooking-reschedule-page');
const config = window['quillbooking_config'] as Config;

if (schedule) {
	createRoot(schedule).render(
		<EventCard
			event={config.event}
			ajax_url={config.ajax_url}
			url={config.url}
			globalCurrency={config.global_settings.payments.currency}
			timeFormat={config.global_settings.general.time_format}
		/>
	);
}

if (reschedule) {
	createRoot(reschedule).render(
		<ReschedulePage
			event={config.event}
			ajax_url={config.ajax_url}
			type="reschedule"
			booking={config.booking}
			url={config.url}
			globalCurrency={config.global_settings.payments.currency}
			canReschedule={config.can_reschedule}
			rescheduleDeniedMessage={config.reschedule_denied_message}
			timeFormat={config.global_settings.general.time_format}
		/>
	);
}
