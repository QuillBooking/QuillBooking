/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import { useParams } from '@quillbooking/navigation';
import { useApi, useNotice } from '@quillbooking/hooks';
import type { Booking } from '@quillbooking/client';
import { groupBookingsByDate } from '@quillbooking/utils';
import AddBookingModal from '../bookings/add-booking-modal';
import BookingList from './booking-list';
import MeetingInformation from './meeting-information';
import InviteeInformation from './invitee-information';
import MeetingActivities from './booking-activities';

/*
 * Main Booking Details Component
 */

const BookingDetails: React.FC = () => {
	const [booking, setBooking] = useState<Booking | null>(null);
	const [open, setOpen] = useState<boolean>(false);

	const { callApi } = useApi();
	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const { errorNotice } = useNotice();
	const [refresh, setRefresh] = useState(false);

	const handleStatusUpdated = () => {
		setRefresh((prev) => !prev);
	};

	const fetchBooking = async () => {
		callApi({
			path: `bookings/${bookingId}`,
			method: 'GET',
			onSuccess: (response) => {
				setBooking(response);
			},
			onError: (error) => {
				console.error(error);
			},
		});
	};
	const { id: bookingId, period = 'all' } = useParams<{
		id: string;
		period: string;
	}>();

	useEffect(() => {
		fetchBooking();
	}, [bookingId, refresh]);

	useEffect(() => {
		const fetchBookings = () => {
			callApi({
				path: addQueryArgs('bookings', {
					filter: {
						period: period,
						user: 'own',
					},
				}),
				method: 'GET',
				onSuccess: (res) => {
					const bookings = groupBookingsByDate(res.bookings.data);
					setBookings(bookings);
				},
				onError: () => {
					errorNotice(__('Error fetching bookings', 'quillbooking'));
				},
			});
		};

		fetchBookings();
	}, [period]);

	return (
		<>
			<Flex gap={16} align="start">
				<BookingList bookings={bookings} period={period} />

				{/* Main Booking Information */}
				{booking && (
					<Flex vertical gap={16}>
						<InviteeInformation booking={booking} handleStatusUpdated={handleStatusUpdated} />
						<MeetingInformation booking={booking} />
					</Flex>
				)}

				{/* Meeting Activities */}
				{booking && <MeetingActivities booking={booking} />}
			</Flex>
			{open && (
				<AddBookingModal
					open={open}
					onClose={() => setOpen(false)}
					onSaved={() => setOpen(false)}
					booking={booking || undefined}
				/>
			)}
		</>
	);
};

export default BookingDetails;
