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
import AvailaibilityIcon from '../../components/icons/availability-icon';
import BookingIcon from '../../components/icons/booking-icon';
import CalendarsIcon from '../../components/icons/calendars-icon';
import HelpIcon from '../../components/icons/help-icon';
import HomeIcon from '../../components/icons/home-icon';
import SettingsIcon from '../../components/icons/settings-icon';
import LogoutIcon from '../../components/icons/logout-icon';


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
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<HomeIcon/>
			<span>{__('Home', 'quillbooking')}</span>
		</span>
	),
});

registerAdminPage('calendars', {
	path: 'calendars',
	component: () => <Calendars />,
	label: (
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<CalendarsIcon/>
			<span>{__('Calendars', 'quillbooking')}</span>
		</span>
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
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<BookingIcon />
			<span>{__('Bookings', 'quillbooking')}</span>
		</span>
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
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<AvailaibilityIcon/>
			<span>{__('Availability', 'quillbooking')}</span>
		</span>
	),
});

registerAdminPage('settings', {
	path: 'settings',
	component: () => <Settings />,
	label: (
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<SettingsIcon/>
			<span>{__('Settings', 'quillbooking')}</span>
		</span>),
});

registerAdminPage('help', {
	path: 'help',
	component: () => <Help />,
	label: (
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<HelpIcon/>
			<span>{__('Help and Support', 'quillbooking')}</span>
		</span>),
});

registerAdminPage('logout', {
	path: 'logout',
	component: () => <Logout />,
	label: (
		<span style={{ display: "flex", alignItems: "center", color: "#292D32", fontWeight: "500", fontSize: "16px" }}>
			<LogoutIcon/>
			<span>{__('Logout', 'quillbooking')}</span>
		</span>),
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
	path: 'bookings/:id',
	component: () => <BookingDetails />,
	label: __('Booking Details', 'quillbooking'),
	hidden: true,
});