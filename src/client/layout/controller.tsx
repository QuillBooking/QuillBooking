/**
 * QuillCRM dependencies
 */
import { registerAdminPage } from '@quillbooking/navigation';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External Dependencies
 */
import { motion } from 'framer-motion';

/**
 * Internal Dependencies
 */
import Home from '../pages/home';
import Calendars from '../pages/calendars';
import Calendar from '../pages/calendar';
import Event from '../pages/event';
import Availability from '../pages/availability';
import AvailabilityDetails from '../pages/availability-details';

export const Controller = ({ page }) => {
	useEffect(() => {
		window.document.documentElement.scrollTop = 0;
	}, []);

	return (
		// Using motion div with layoutScroll to reevaluate positions when the user scrolls.
		<motion.div
			layoutScroll
			className="quillbooking-page-component-wrapper"
		>
			<page.component />
		</motion.div>
	);
};

registerAdminPage('home', {
	path: '/',
	component: () => <Home />,
	label: __('Home', 'quillbooking'),
});

registerAdminPage('calendars', {
	path: 'calendars',
	component: () => <Calendars />,
	label: __('Calendars', 'quillbooking'),
});

registerAdminPage('calendar', {
	path: 'calendars/:id/:tab?/:subtab?',
	component: () => <Calendar />,
	label: __('Calendar', 'quillbooking'),
	hidden: true,
});

registerAdminPage('availability', {
	path: 'availability',
	component: () => <Availability />,
	label: __('Availability', 'quillbooking'),
});

registerAdminPage('availability/:id', {
	path: 'availability/:id',
	component: () => <AvailabilityDetails />,
	label: __('Availability Details', 'quillbooking'),
});
