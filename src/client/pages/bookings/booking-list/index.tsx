/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Divider, List } from 'antd';

/**
 * Internal dependencies
 */
import { Booking } from 'client/types';

/**
 * Main Bookings List Component.
 */
interface BookingListProps {
	bookings: Record<string, Booking[]>;
	period: string;
}

const BookingList: React.FC<BookingListProps> = ({ bookings, period }) => {
	return (
		<>
			{period === 'latest' && (
				<>
					<Divider orientation="left">
						{__('Sorted by booked at date time', 'quillbooking')}
					</Divider>
					{Object.entries(bookings).map(
						([groupKey, groupBookings]) => (
							<div key={groupKey}>
								<List
									itemLayout="horizontal"
									dataSource={groupBookings}
									renderItem={(booking) => (
										<List.Item key={booking.id}>
											<List.Item.Meta
												title={`Booking ID: ${booking.id}`}
												description={`Time: ${booking.time_span}`}
											/>
										</List.Item>
									)}
								/>
							</div>
						)
					)}
				</>
			)}
			{period !== 'latest' &&
				Object.entries(bookings).map(([groupKey, groupBookings]) => (
					<div key={groupKey}>
						<Divider orientation="left">{groupKey}</Divider>
						<List
							itemLayout="horizontal"
							dataSource={groupBookings}
							renderItem={(booking) => (
								<List.Item key={booking.id}>
									<List.Item.Meta
										title={`Booking ID: ${booking.id}`}
										description={`Time: ${booking.time_span}`}
									/>
								</List.Item>
							)}
						/>
					</div>
				))}
		</>
	);
};

export default BookingList;
