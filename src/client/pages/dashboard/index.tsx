/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import { Header } from '@quillbooking/components';
import BookingAnalytics from './booking-analytics';
import BookingAnalyticsChart from './booking-analytics-chart';
import LatestEvents from './latest-events';
import LatestBookings from './latest-bookings';
import { useCurrentUser } from '@quillbooking/hooks';

const Dashboard: React.FC = () => {
	const canManageAllCalendars = useCurrentUser().hasCapability(
		'quillbooking_manage_all_calendars'
	);
	return (
		<div className="quillbooking-dashboard">
			<Header
				header={__('Dashboard Overview', 'quillbooking')}
				subHeader={__(
					'Follow Up Your Booking Analytics and Statistics ',
					'quillbooking'
				)}
			/>
			<div className="grid grid-cols-2 gap-5 mt-4">
				<Flex gap={20} vertical>
					<BookingAnalytics
						canManageAllCalendars={canManageAllCalendars}
					/>
					<LatestEvents
						canManageAllCalendars={canManageAllCalendars}
					/>
				</Flex>
				<Flex gap={20} vertical>
					<BookingAnalyticsChart
						canManageAllCalendars={canManageAllCalendars}
					/>
					<LatestBookings />
				</Flex>
			</div>
		</div>
	);
};

export default Dashboard;
