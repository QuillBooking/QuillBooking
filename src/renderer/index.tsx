/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Config } from './types';

const appRoot = document.getElementById('quillbooking-booking-page');
const config = window['quillbooking_config'] as Config;

if (appRoot) {
    createRoot(appRoot).render(<div>Quill Booking</div>);
}

