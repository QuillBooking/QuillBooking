/**
 * QuillCRM dependencies
 */
import { registerAdminPage } from '@quillbooking/navigation';
import ConfigAPI from '@quillbooking/config';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External Dependencies
 */
import { motion } from 'framer-motion';
import React from 'react';

/**
 * Internal Dependencies
 */
import Dashboard from '../pages/dashboard';
import Calendars from '../pages/calendars';
import Calendar from '../pages/calendar';
import Availability from '../pages/availability';
import AvailabilityDetails from '../pages/availability-details';
import Bookings from '../pages/bookings';
import BookingDetails from '../pages/booking-details';
import Event from '../pages/event';
import GettingStarted from '../pages/getting-started';
import Integrations from '../pages/integrations';
import GeneralSettings from '../pages/global-settings';
import { useApi } from '@quillbooking/hooks';
import {
	AvailabilityIcon,
	BookingIcon,
	HomeIcon,
	SettingsIcon,
	UpcomingCalendarIcon,
	IntegrationsTabIcon,
} from '@quillbooking/components';
import Navmenu from './navmenu';
import ProtectedRoute from './protected-route';

// Declare global window interface
declare global {
	interface Window {
		quillbooking?: {
			adminUrl?: string;
		};
	}
}

const ShimmerLoader = () => (
	<div className="p-16 pt-8 animate-pulse">
		{/* Header */}
		<div className="flex justify-between border-b border-[#E5E5E5] pb-7 mb-10">
			<div className="h-8 w-48 bg-gray-200 rounded-md" />
			<div className="h-8 w-32 bg-gray-200 rounded-md" />
		</div>

		{/* Main Flex Row */}
		<div className="flex gap-8">
			{/* Left Column: 4 Cards (2/3 width) */}
			<div className="w-2/3 flex flex-col gap-6">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="bg-white shadow border border-gray-200 rounded-xl p-6"
					>
						<div className="h-5 w-1/3 bg-gray-200 rounded" />
						<div className="mt-4 h-4 w-2/3 bg-gray-200 rounded" />
						<div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
					</div>
				))}
			</div>

			{/* Right Column: 3 Cards (1/3 width) */}
			<div className="w-1/3 flex flex-col gap-6">
				{Array.from({ length: 3 }).map((_, index) => (
					<div
						key={index}
						className="bg-white shadow border border-gray-200 rounded-xl p-6"
					>
						<div className="h-5 w-1/2 bg-gray-200 rounded" />
						<div className="mt-4 h-4 w-3/4 bg-gray-200 rounded" />
						<div className="mt-2 h-4 w-full bg-gray-200 rounded" />
					</div>
				))}
			</div>
		</div>
	</div>
);

// Create a context for calendar state
const CalendarContext = React.createContext({
	hasCalendars: false,
	isLoading: true,
	checkCalendars: async () => {},
});

// Create a single instance of CalendarProvider at the app level
const AppCalendarProvider = ({ children }) => {
	const { callApi } = useApi();
	const configHasCalendarsValue =
		typeof ConfigAPI.getHasCalendars === 'function'
			? ConfigAPI.getHasCalendars()
			: false;

	console.log('Calendars = ', configHasCalendarsValue);
	const [hasCalendars, setHasCalendars] = useState(configHasCalendarsValue);
	const [isLoading, setIsLoading] = useState(false);
	const [initialized, setInitialized] = useState(true);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = React.useMemo(() => {
		const checkCalendars = async () => {
			// Skip API call if we already have calendar info from config
			if (configHasCalendarsValue !== false) {
				return;
			}

			setIsLoading(true);
			try {
				await callApi({
					path: 'calendars',
					method: 'GET',
					onSuccess: (response) => {
						setHasCalendars(response.data.length > 0);
					},
					onError: () => {
						setHasCalendars(false);
					},
				});
			} catch {
				setHasCalendars(false);
			} finally {
				setIsLoading(false);
				setInitialized(true);
			}
		};

		return {
			hasCalendars,
			isLoading,
			checkCalendars,
		};
	}, [hasCalendars, isLoading, callApi, configHasCalendarsValue]);

	useEffect(() => {
		if (!initialized && !configHasCalendarsValue) {
			contextValue.checkCalendars();
		}
	}, [initialized, contextValue, configHasCalendarsValue]);

	return (
		<CalendarContext.Provider value={contextValue}>
			{children}
		</CalendarContext.Provider>
	);
};

// Create a wrapper component for Dashboard to handle the visibility check
const DashboardWrapper = () => {
	const { hasCalendars, isLoading } = React.useContext(CalendarContext);

	// Show loading spinner while loading
	if (isLoading) {
		return <ShimmerLoader />;
	}

	// If no calendars, show getting started page
	if (!hasCalendars) {
		return <GettingStarted />;
	}

	// If there are calendars, show dashboard
	return <Dashboard />;
};

// Create a custom component for the dashboard label
const DashboardLabel = () => {
	const { hasCalendars } = React.useContext(CalendarContext);
	// Always use "Dashboard" for the label to avoid flickering
	return (
		<Navmenu
			icon={<HomeIcon width={24} height={24} />}
			title={
				hasCalendars
					? __('Dashboard', 'quillbooking')
					: __('Getting Started', 'quillbooking')
			}
		/>
	);
};
const DashboardPageWithProvider = () => (
	<AppCalendarProvider>
		<DashboardWrapper />
	</AppCalendarProvider>
);

const DashboardLabelWithProvider = () => (
	<AppCalendarProvider>
		<DashboardLabel />
	</AppCalendarProvider>
);

registerAdminPage('dashboard', {
	path: '/',
	component: DashboardPageWithProvider,
	label: <DashboardLabelWithProvider />,
});

export const Controller = ({ page }) => {
	useEffect(() => {
		window.document.documentElement.scrollTop = 0;
	}, []);

	return (
		<motion.div
			layoutScroll
			className="quillbooking-page-component-wrapper"
		>
			<AppCalendarProvider>
				<ProtectedRoute page={page} />
			</AppCalendarProvider>
		</motion.div>
	);
};

registerAdminPage('calendars', {
	path: 'calendars',
	component: () => <Calendars />,
	label: (
		<Navmenu
			icon={<UpcomingCalendarIcon width={24} height={24} />}
			title={__('Calendars', 'quillbooking')}
		/>
	),
	capabilities: [
		'quillbooking_manage_own_calendars',
		'quillbooking_read_all_calendars',
	],
});

registerAdminPage('calendar', {
	path: 'calendars/:id',
	component: () => <Calendar />,
	label: __('Calendar', 'quillbooking'),
	hidden: true,
	capabilities: [
		'quillbooking_manage_own_calendars',
		'quillbooking_manage_all_calendars',
	],
});

registerAdminPage('bookings', {
	path: 'bookings',
	component: () => <Bookings />,
	label: (
		<Navmenu
			icon={<BookingIcon width={24} height={24} />}
			title={__('Bookings', 'quillbooking')}
		/>
	),
	capabilities: [
		'quillbooking_read_own_bookings',
		'quillbooking_read_all_bookings',
	],
});

registerAdminPage('event', {
	path: 'calendars/:id/events/:eventId/:tab?',
	component: () => <Event />,
	label: __('Event', 'quillbooking'),
	hidden: true,
	capabilities: [
		'quillbooking_manage_own_calendars',
		'quillbooking_manage_all_calendars',
	],
});

registerAdminPage('availability', {
	path: 'availability',
	component: () => <Availability />,
	label: (
		<Navmenu
			icon={<AvailabilityIcon width={24} height={24} />}
			title={__('Availability', 'quillbooking')}
		/>
	),
	capabilities: [
		'quillbooking_read_own_availability',
		'quillbooking_read_all_availability',
	],
});

registerAdminPage('integrations', {
	path: 'integrations',
	component: () => <Integrations />,
	label: (
		<Navmenu
			icon={<IntegrationsTabIcon width={24} height={24} />}
			title={__('Integrations', 'quillbooking')}
		/>
	),
});

registerAdminPage('settings', {
	path: 'settings/',
	component: () => <GeneralSettings />,
	label: (
		<Navmenu
			icon={<SettingsIcon width={24} height={24} />}
			title={__('Settings', 'quillbooking')}
		/>
	),
});

// registerAdminPage('help', {
// 	path: 'help',
// 	component: () => <Help />,
// 	label: (
// 		<Navmenu icon={<HelpIcon width={24} height={24}/>} title={__('Help and Support', 'quillbooking')} />
// 	),
// });

// registerAdminPage('logout', {
// 	path: 'logout',
// 	component: () => <Logout />,
// 	label: (
// 		<Navmenu icon={<LogoutIcon />} title={__('Logout', 'quillbooking')} />
// 	),
// });

registerAdminPage('availability', {
	path: 'availability',
	component: () => <Availability />,
	label: __('Availability', 'quillbooking'),
});

registerAdminPage('availability/:id', {
	path: 'availability/:id',
	component: () => <AvailabilityDetails />,
	label: __('Availability Details', 'quillbooking'),
	hidden: true,
});

registerAdminPage('booking-details', {
	path: 'bookings/:id/:period?',
	component: () => <BookingDetails />,
	label: __('Booking Details', 'quillbooking'),
	hidden: true,
});
