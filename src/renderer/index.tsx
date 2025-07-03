/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Config } from './types';
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
		/>
	);
}
