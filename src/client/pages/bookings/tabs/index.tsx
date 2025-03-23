/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BookingsTabsTypes } from 'client/types';

/**
 * Main Bookings Tabs Component
 */
interface BookingsTabsProps {
	setPeriod: (period: BookingsTabsTypes) => void;
	period: string;
	pendingCount?: number;
	cancelled?: number;
}

type TabItem = {
	value: BookingsTabsTypes;
	label: string;
	icon: string;
};

const BookingsTabs: React.FC<BookingsTabsProps> = ({
	setPeriod,
	period,
	pendingCount,
	cancelled,
}) => {
	let tabs: TabItem[] = [
		{ value: 'upcoming', label: 'Upcoming', icon: 'calendars/icon-2.svg' },
		{ value: 'completed', label: 'Completed', icon: 'calendars/icon-2.svg' },
		{ value: 'latest', label: 'Latest Bookings', icon: 'calendars/icon-2.svg' },
		{ value: 'all', label: 'All', icon: 'calendars/icon-2.svg' },
	];

	if (pendingCount && pendingCount > 0) {
		tabs.splice(2, 0, {
			value: 'pending',
			label: `Pending (${pendingCount})`,
			icon: 'calendars/icon-2.svg',
		});
	}

	if (cancelled && cancelled > 0) {
		tabs.splice(3, 0, {
			value: 'cancelled',
			label: 'Cancelled',
			icon: 'calendars/icon-2.svg',
		});
	}
	return (
		<div className='flex space-x-4 items-baseline'>
			{tabs.map((tab) => (
				<div
					key={tab.value}
					onClick={() => setPeriod(tab.value)}
					className={`cursor-pointe cursor-pointer px-2 py-1 rounded-md font-bold ${tab.value === period ? 'bg-color-tertiary text-color-primary' : ''}`}
				>
					<span>
						{/* <img src={tab.icon} alt={tab.label} /> */}
					</span>
					<span>{__(tab.label, 'quillbooking')}</span>
				</div>
			))}
		</div>
	);
};

export default BookingsTabs;
