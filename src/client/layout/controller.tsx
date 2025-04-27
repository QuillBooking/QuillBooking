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
import Bookings from '../pages/bookings';
import BookingDetails from '../pages/booking-details';
import Event from '../pages/event';
import Help from '../pages/help';
import Logout from '../pages/logout';
import { AvailabilityIcon, BookingIcon, HelpIcon, HomeIcon, SettingsIcon, LogoutIcon, UpcomingCalendarIcon } from '@quillbooking/components';
import Navmenu from './navmenu';
import GeneralSettings from '../pages/global-settings';
import ProtectedRoute from './protected-route';


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
			<ProtectedRoute page={page} />
		</motion.div>
	);
};

registerAdminPage('home', {
	path: '/',
	component: () => <Home />,
	label: (
		<Navmenu icon={<HomeIcon width={24} height={24}/>} title={__('Home', 'quillbooking')} />
	),
});

registerAdminPage('calendars', {
	path: 'calendars',
	component: () => <Calendars />,
	label: (
		<Navmenu icon={<UpcomingCalendarIcon width={24} height={24} />} title={__('Calendars', 'quillbooking')} />
	),
	capabilities: [
		'quillbooking_manage_own_calendars',
		'quillbooking_read_all_calendars',
	],
});

registerAdminPage('calendar', {
	path: 'calendars/:id/:tab?/:subtab?',
	component: () => <Calendar />,
	label: __('Calendar', 'quillbooking'),
	hidden: true,
	capabilities: [
		'quillbooking_manage_own_calendars',
		'quillbooking_manage_all_calendars'
	],
});

registerAdminPage('bookings', {
	path: 'bookings',
	component: () => <Bookings />,
	label: (
		<Navmenu icon={<BookingIcon width={24} height={24}/>} title={__('Bookings', 'quillbooking')} />
	),
	capabilities: [
		'quillbooking_read_own_bookings',
		'quillbooking_read_all_bookings',
	],
})

registerAdminPage('event', {
	path: 'calendars/:id/events/:eventId/:tab?',
	component: () => <Event />,
	label: __('Event', 'quillbooking'),
	hidden: true,
	capabilities: [
		'quillbooking_manage_own_calendars',
		'quillbooking_manage_all_calendars'
	],
});

registerAdminPage('availability', {
	path: 'availability',
	component: () => <Availability />,
	label: (
		<Navmenu icon={<AvailabilityIcon width={24} height={24}/>} title={__('Availability', 'quillbooking')} />
	),
	capabilities: [
		'quillbooking_read_own_availability',
		'quillbooking_read_all_availability'
	],
});

registerAdminPage('settings', {
	path: 'settings/:tab?',
	component: () => <GeneralSettings />,
	label: (
		<Navmenu icon={<SettingsIcon width={24} height={24}/>} title={__('Settings', 'quillbooking')} />
	),
});

registerAdminPage('help', {
	path: 'help',
	component: () => <Help />,
	label: (
		<Navmenu icon={<HelpIcon width={24} height={24}/>} title={__('Help and Support', 'quillbooking')} />
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

registerAdminPage('booking-details', {
	path: 'bookings/:id/:period?',
	component: () => <BookingDetails />,
	label: __('Booking Details', 'quillbooking'),
	hidden: true,
});