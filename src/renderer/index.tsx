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

const appRoot = document.getElementById('quillbooking-booking-page');
const config = window['quillbooking_config'] as Config;
console.log('config', config);

if (appRoot) {
    createRoot(appRoot).render(<EventCard event={config.event} />);
}

