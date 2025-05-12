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
console.log('config', config);

if (schedule) {
    createRoot(schedule).render(<EventCard event={config.event} ajax_url={config.ajax_url} />);
}

if (reschedule) {
    createRoot(reschedule).render(<ReschedulePage event={config.event} ajax_url={config.ajax_url} type="reschedule" booking={config.booking}/>);
}
