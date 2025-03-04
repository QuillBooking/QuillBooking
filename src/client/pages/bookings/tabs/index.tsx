/**
 * Internal dependencies
 */
import { Segmented } from 'antd';
import { BookingsTabsTypes } from 'client/types';

/**
 * Main Bookings Tabs Component
 */
interface BookingsTabsProps {
	setPeriod: (period: BookingsTabsTypes) => void;
	pendingCount?: number;
	cancelled?: number;
}

type TabItem = {
	value: BookingsTabsTypes;
	label: string;
};

const BookingsTabs: React.FC<BookingsTabsProps> = ({
	setPeriod,
	pendingCount,
	cancelled,
}) => {
	let tabs: TabItem[] = [
		{ value: 'upcoming', label: 'Upcoming' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'latest', label: 'Latest Bookings' },
		{ value: 'all', label: 'All' },
	];

	if (pendingCount && pendingCount > 0) {
		tabs.splice(2, 0, {
			value: 'pending',
			label: `Pending (${pendingCount})`,
		});
	}

	if (cancelled && cancelled == 0) {
		tabs.splice(3, 0, {
			value: 'cancelled',
			label: 'Cancelled',
		});
	}

	return (
		<Segmented<BookingsTabsTypes>
			defaultValue="all"
			options={tabs}
			onChange={(value) => {
				setPeriod(value);
			}}
		/>
	);
};

export default BookingsTabs;
