/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Col, List, Row, Space, Tag, Typography } from 'antd';

/**
 * Internal dependencies
 */
import { Booking } from 'client/types';
import { NavLink as Link } from '@quillbooking/navigation';

/**
 * Main Bookings List Component.
 */
interface BookingListProps {
	bookings: Record<string, Booking[]>;
	period: string;
}

const { Title, Text } = Typography;

const BookingList: React.FC<BookingListProps> = ({ bookings, period }) => {
	return (
		<>
			{period === 'latest' && (
				<Title level={4}>
					{__('Sorted by booked at date time', 'quillbooking')}
				</Title>
			)}

			{Object.entries(bookings).map(([dateLabel, groupBookings]) => (
				<div key={dateLabel} style={{ marginBottom: 24 }}>
					{period !== 'latest' && (
						<Title level={5} style={{ marginBottom: 16 }}>
							{dateLabel}
						</Title>
					)}

					<List
						dataSource={groupBookings}
						renderItem={(booking) => (
							<Link to={`bookings/${booking.id}`}>
								<List.Item
									key={booking.id}
									style={{ padding: '12px 0' }}
								>
									<Row
										align="middle"
										style={{ width: '100%' }}
										gutter={16}
									>
										<Col
											flex="none"
											style={{ minWidth: 120 }}
										>
											<Text>{booking.time_span}</Text>
										</Col>

										<Col flex="auto">
											<div
												style={{
													fontWeight: 'bold',
													marginBottom: 4,
												}}
											>
												{booking.event.name ??
													'Untitled Booking'}
											</div>
											<Space wrap>
												<Tag
													color={getColorByStatus(
														booking.status
													)}
												>
													{booking.status}
												</Tag>
											</Space>
										</Col>

										<Col flex="none">
											<Button type="primary">
												{__(
													'View Details',
													'quillbooking'
												)}
											</Button>
										</Col>
									</Row>
								</List.Item>
							</Link>
						)}
					/>
				</div>
			))}
		</>
	);
};

export default BookingList;

/**
 * Helper to map status -> tag color
 */
function getColorByStatus(status: string) {
	switch (status.toLowerCase()) {
		case 'completed':
			return 'blue';
		case 'cancelled':
			return 'red';
		case 'pending':
			return 'geekblue';
		case 'scheduled':
			return 'green';
		default:
			return 'default';
	}
}
