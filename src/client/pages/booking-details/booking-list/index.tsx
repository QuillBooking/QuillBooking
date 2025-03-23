/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Typography } from 'antd';

/**
 * Internal dependencies
 */
import { NavLink as Link } from '@quillbooking/navigation';
import type { Booking } from '@quillbooking/client';

/*
 * Main Booking List Component (Details Page)
 */
const { Title, Text } = Typography;

interface BookingListProps {
	bookings: Record<string, Booking[]>;
	period: string;
}
const BookingList: React.FC<BookingListProps> = ({ bookings, period }) => {
	return (
		<Card style={{ flex: 1, minHeight: 250, padding: '1rem' }}>
			{Object.keys(bookings).length === 0 && (
				<Title level={5} type="secondary">
					{__('No bookings found based on your filter')}
				</Title>
			)}

			{Object.entries(bookings).map(([dateLabel, groupBookings]) => (
				<div key={dateLabel} style={{ marginBottom: '1rem' }}>
					<Title level={5} style={{ marginBottom: '0.5rem' }}>
						{dateLabel}
					</Title>

					{groupBookings.map((booking) => (
						<div
							key={booking.id}
							style={{
								border: '1px solid #d9d9d9',
								borderRadius: '4px',
								padding: '8px',
								marginBottom: '8px',
							}}
						>
							<Link
								to={`bookings/${booking.id}?period=${period}`}
							>
								<Text
									strong
									style={{
										display: 'block',
										marginBottom: '4px',
									}}
								>
									{booking.time_span}
								</Text>
								<Text
									style={{
										display: 'block',
										marginBottom: '4px',
									}}
								>
									{booking.event.name}
								</Text>
							</Link>
						</div>
					))}
				</div>
			))}
		</Card>
	);
};

export default BookingList;
