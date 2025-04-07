/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Space, Typography } from 'antd';

/**
 * Internal dependencies
 */
import type { Booking } from '@quillbooking/client';
import BookingActions from '../booking-actions';

/*
 * Main Invitee Information Component
 */
interface BookingDetailsProps {
	booking: Booking;
	handleStatusUpdated?: () => void;
}

const { Title, Text } = Typography;

const InviteeInformation: React.FC<BookingDetailsProps> = ({ booking, handleStatusUpdated }) => {
	return (
		<Card
			title={
				<Text strong>
					{__('meeting between', 'quillbooking')}{' '}
					{booking.calendar?.user?.display_name}{' '}
					{__('and', 'quillbooking')}{' '}
					{Array.isArray(booking.guest)
						? booking.guest.map((g) => g.name).join(', ')
						: booking.guest?.name}{' '}
					@ {booking.start_time} - {booking.status}
					<BookingActions booking={booking} onStatusUpdated={handleStatusUpdated} />
				</Text>
			}
			style={{ flex: 3 }}
		>
			<Title level={4}>
				{__('Invitees Information', 'quillbooking')}
			</Title>

			<Space
				direction="vertical"
				size="middle"
				style={{ display: 'flex' }}
			>
				<Space>
					<Title level={5}>
						{__('Invitee Name', 'quillbooking')}
					</Title>
					<Text>
						{Array.isArray(booking.guest)
							? booking.guest.map((g) => g.name).join(', ')
							: booking.guest?.name}
					</Text>
				</Space>

				<Space>
					<Title level={5}>
						{__('Invitee Email', 'quillbooking')}
					</Title>
					<Text>
						{Array.isArray(booking.guest)
							? booking.guest.map((g) => g.email).join(', ')
							: booking.guest?.email}
					</Text>
				</Space>

				<Space>
					<Title level={5}>
						{__('Invitee Timezone', 'quillbooking')}
					</Title>
					<Text>{booking.timezone}</Text>
				</Space>

				<Space>
					<Title level={5}>{__('Booked At', 'quillbooking')}</Title>
					<Text>{booking.created_at}</Text>
				</Space>
			</Space>
		</Card>
	);
};

export default InviteeInformation;
