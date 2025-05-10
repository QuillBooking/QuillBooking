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
import { CancelIcon, UpcomingCalendarIcon } from '@quillbooking/components';
import { BookingActions } from '@quillbooking/components';
import BookingQuestion from './booking-question';

const days = getNextTenDays();

const BookingDetails: React.FC = () => {
	// Destructure params at the top.
	const { id: bookingIdParam } = useParams<{
		id: string;
		period: string;
	}>();

	const [booking, setBooking] = useState<Booking | null>(null);
	const [open, setOpen] = useState<boolean>(false);
	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [refresh, setRefresh] = useState(false);
	const [selectedDate, setSelectedDate] = useState<number>(0);
	const [bookingId, setBookingId] = useState<string | number>(
		bookingIdParam || ''
	);

	const { callApi } = useApi();
	const { errorNotice } = useNotice();

	const handleStatusUpdated = () => {
		setRefresh((prev) => !prev);
	};

	const fetchBooking = async () => {
		callApi({
			path: `bookings/${bookingId}`,
			method: 'GET',
			onSuccess: (response) => {
				console.log('Booking details:', response);
				setBooking(response);
			},
			onError: (error) => {
				console.error(error);
			},
		});
	};

	const fetchUpcomingBookings = (
		day: string,
		month: number,
		year: number
	) => {
		callApi({
			path: addQueryArgs('bookings', {
				filter: {
					period: 'upcoming',
					// user: author.toLowerCase(),
					year,
					month,
					day,
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

	useEffect(() => {
		if (bookingId) {
			fetchBooking();
		}
	}, [bookingId]);

	useEffect(() => {
		fetchUpcomingBookings(
			days[selectedDate].dayOfMonth,
			days[selectedDate].month,
			days[selectedDate].year
		);
	}, [selectedDate, refresh]);

	// Format date/time information only once.
	const formattedDate = booking?.start_time
		? new Date(booking.start_time).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
			})
		: '';
	const formattedStartTime = booking?.start_time
		? new Date(booking.start_time).toLocaleTimeString(undefined, {
				hour: 'numeric',
				minute: 'numeric',
				hour12: true,
			})
		: '';
	const formattedEndTime = booking?.end_time
		? new Date(booking.end_time).toLocaleTimeString(undefined, {
				hour: 'numeric',
				minute: 'numeric',
				hour12: true,
			})
		: '';

	return (
		<>
			<Flex
				justify="space-between"
				className="border-b border-[#E5E5E5] p-4 pb-7"
			>
				<div>
					<Flex gap={10} align="center">
						<div className="text-color-primary-text cursor-pointer">
							<CancelIcon width={30} height={30} />
						</div>
						<p className="text-2xl text-[#09090B] font-medium">
							{__('Booking Details', 'quillbooking')}
						</p>
					</Flex>
				</div>
				{booking && (
					<BookingActions
						booking={booking}
						type="button"
						onStatusUpdated={handleStatusUpdated}
					/>
				)}
			</Flex>
			<Flex gap={40} align="start" className="p-16 pt-8">
				{booking && (
					<Flex vertical gap={20} className="flex-1">
						<MeetingInformation booking={booking} />
						<BookingQuestion booking={booking} />
						<InviteeInformation
							booking={booking}
							handleStatusUpdated={handleStatusUpdated}
						/>
					</Flex>
				)}

				<div className="flex flex-col flex-2 gap-4">
					<div className="bg-color-primary p-8 rounded-2xl text-white">
						<UpcomingCalendarIcon width={60} height={60} />
						<p className="text-lg font-normal my-1">
							{__('Event Date/Time', 'quillbooking')}
						</p>
						<p className="text-2xl font-medium">
							{formattedDate} - {formattedStartTime} -{' '}
							{formattedEndTime}
						</p>
					</div>
					{booking && <MeetingActivities booking={booking} />}
					<BookingList
						bookings={Object.values(bookings)[0] || []}
						setSelectedDate={setSelectedDate}
						days={days}
						selectedDate={selectedDate}
						setBookingId={setBookingId}
					/>
				</div>
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

function getNextTenDays() {
	const days: {
		weekday: string;
		dayOfMonth: string;
		month: number;
		year: number;
	}[] = [];
	for (let i = 0; i < 10; i++) {
		const date = new Date();
		date.setDate(date.getDate() + i);
		days.push({
			weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
			dayOfMonth: date.getDate().toString().padStart(2, '0'),
			month: date.getMonth() + 1,
			year: date.getFullYear(),
		});
	}
	return days;
}
