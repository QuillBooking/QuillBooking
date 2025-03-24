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
import Availability from '../pages/availability';
import AvailabilityDetails from '../pages/availability-details';
import CreateEvent from '../pages/create-event';
import Bookings from '../pages/bookings';
import BookingDetails from '../pages/booking-details';
import Event from '../pages/event';
import Settings from '../pages/settings';
import Help from '../pages/help';
import Logout from '../pages/logout';
import { AvailabilityIcon, BookingIcon, CalendarsIcon, HelpIcon, HomeIcon, SettingsIcon, LogoutIcon } from '@quillbooking/components';
import Navmenu from './navmenu';


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
	label: (
		<Navmenu icon={<HomeIcon />} title={__('Home', 'quillbooking')} />
	),
});

registerAdminPage('calendars', {
	path: 'calendars',
	component: () => <Calendars />,
	label: (
		<Navmenu icon={<CalendarsIcon />} title={__('Calendars', 'quillbooking')} />
	),
});

registerAdminPage('calendar', {
	path: 'calendars/:id/:tab?/:subtab?',
	component: () => <Calendar />,
	label: __('Calendar', 'quillbooking'),
	hidden: true,
});

registerAdminPage('bookings', {
	path: 'bookings',
	component: () => <Bookings />,
	label: (
		<Navmenu icon={<BookingIcon />} title={__('Bookings', 'quillbooking')} />
	),
})

registerAdminPage('event', {
	path: 'calendars/:id/events/:eventId/:tab?',
	component: () => <Event />,
	label: __('Event', 'quillbooking'),
	hidden: true,
});

registerAdminPage('availability', {
	path: 'availability',
	component: () => <Availability />,
	label: (
		<Navmenu icon={<AvailabilityIcon />} title={__('Availability', 'quillbooking')} />
	),
});

registerAdminPage('settings', {
	path: 'settings',
	component: () => <Settings />,
	label: (
		<Navmenu icon={<SettingsIcon />} title={__('Settings', 'quillbooking')} />
	),
});

registerAdminPage('help', {
	path: 'help',
	component: () => <Help />,
	label: (
		<Navmenu icon={<HelpIcon />} title={__('Help and Support', 'quillbooking')} />
	),
});

registerAdminPage('logout', {
	path: 'logout',
	component: () => <Logout />,
	label: (
		<Navmenu icon={<LogoutIcon />} title={__('Logout', 'quillbooking')} />
	),
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
	hidden: true
});

registerAdminPage('create-event', {
	path: 'calendars/:id/create-event/:type',
	hidden: true,
	component: () => <CreateEvent />,
	label: __('Create Event', 'quillbooking'),
});


registerAdminPage('booking-details', {
	path: 'bookings/:id/:period?',
	component: () => <BookingDetails />,
	label: __('Booking Details', 'quillbooking'),
	hidden: true,
});