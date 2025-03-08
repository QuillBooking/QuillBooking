/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { NavLink as Link, useParams } from '@quillbooking/navigation';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import type {
	Availability,
	TimeSlot,
	DateOverrides,
	Booking,
} from '@quillbooking/client';
import { TimezoneSelect } from '@quillbooking/components';
import { OverrideSection, OverrideModal } from '@quillbooking/components';
import { Card, Flex, Space, Typography } from 'antd';

/*
 * Main Booking Details Component
 */
const { Title, Text } = Typography;

const BookingDetails: React.FC = () => {
	const [booking, setBooking] = useState<Booking | null>(null);
	const { callApi } = useApi();

	const fetchBooking = async () => {
		callApi({
			path: `bookings/${bookingId}`,
			method: 'GET',
			onSuccess: (response) => {
				console.log(response);
				setBooking(response);
			},
			onError: (error) => {
				console.error(error);
			},
		});
	};
	useEffect(() => {
		fetchBooking();
	}, []);
	const { id: bookingId } = useParams<{ id: string }>();
	return (
		<Flex gap={16} align="start">
			{/* Left Card - No Bookings Found */}
			<Card style={{ flex: 1, minHeight: 250 }}>
				<Title level={5} type="secondary">
					No bookings found based on your filter
				</Title>
			</Card>

			{/* Main Booking Information */}
			{booking && (
				<>
					<Card
						title={
							<Text strong>
								meeting between and {booking.guest?.name} @{' '}
								{booking.start_time} - {booking.status}
							</Text>
						}
						style={{ flex: 2 }}
					>
						<Title level={4}>Invitees Information</Title>

						<Space
							direction="vertical"
							size="middle"
							style={{ display: 'flex' }}
						>
							<Space>
								<Title level={5}>Invitee Name</Title>
								<Text>{booking.calendar?.display_name}</Text>
							</Space>

							<Space>
								<Title level={5}>Invitee Email</Title>
								<Text>{booking.guest?.email}</Text>
							</Space>

							<Space>
								<Title level={5}>Invitee Timezone</Title>
								<Text>{booking.timezone}</Text>
							</Space>

							<Space>
								<Title level={5}>Booked At</Title>
								<Text>{booking.created_at}</Text>
							</Space>
						</Space>
					</Card>

					{/* Meeting Information */}
					<Card title="Meeting Information" style={{ flex: 1 }}>
						<Space
							direction="vertical"
							size="middle"
							style={{ display: 'flex' }}
						>
							<Text>
								<strong>Meeting Host:</strong> {booking.calendar?.user?.display_name}
							</Text>

							<Text>
								<strong>Meeting Title:</strong>{' '}
								{booking.event?.name}
							</Text>

							<Text>
								<strong>Meeting Duration:</strong>{' '}
								{booking.event?.duration} minutes
							</Text>

							<Text>
								<strong>Location:</strong> {booking.location}
							</Text>

							<Text>
								<strong>Status:</strong> {booking.status}
							</Text>
						</Space>
					</Card>
				</>
			)}

			{/* Meeting Activities */}
			<Card title="Meeting Activities" style={{ flex: 1 }}>
				<Text type="secondary">
					No activities have been recorded for this booking
				</Text>
			</Card>
		</Flex>
	);
};

export default BookingDetails;
