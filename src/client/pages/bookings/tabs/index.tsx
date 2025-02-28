/**
 * Internal dependencies
 */
import { Segmented } from 'antd';
import { BookingsTabsTypes } from 'client/types';

/**
 * Main Bookings Tabs Component
 */
const tabs: BookingsTabsTypes[] = [
  "Upcoming",
  "Completed",
  "Pending",
  "LatestBookings",
  "All"
];

const BookingsTabs: React.FC = () => {
	return (
		<Segmented<BookingsTabsTypes>
			options={tabs}
			onChange={(value) => {
				console.log(value);
			}}
		/>
	);
};

export default BookingsTabs;
