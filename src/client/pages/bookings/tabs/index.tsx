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
}

type TabItem = {
	value: BookingsTabsTypes;
	label: string;
};

const BookingsTabs: React.FC<BookingsTabsProps> = ({setPeriod , pendingCount}) => {
	const tabs: TabItem[] = [
		{ value: 'upcoming', label: 'Upcoming' },
		{ value: 'completed', label: 'Completed' },
		{
			value: 'pending',
			label:
				pendingCount && pendingCount > 0
					? `Pending (${pendingCount})`
					: 'Pending',
		},
		{ value: 'latest', label: 'Latest Bookings' },
		{ value: 'all', label: 'All' },
	];

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
