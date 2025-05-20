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
import { Dialog } from '@mui/material';

/**
 * Internal dependencies
 */
import { useParams } from '@quillbooking/navigation';
import { useApi } from '@quillbooking/hooks';
import { useNavigate } from '@quillbooking/navigation';
import type { Booking, NoticeMessage } from '@quillbooking/client';
import { convertTimezone, getCurrentTimezone, groupBookingsByDate } from '@quillbooking/utils';
import AddBookingModal from '../bookings/add-booking-modal';
import BookingList from './booking-list';
import MeetingInformation from './meeting-information';
import InviteeInformation from './invitee-information';
import MeetingActivities from './booking-activities';
import { CancelIcon, UpcomingCalendarIcon, NoticeBanner } from '@quillbooking/components';
import { BookingActions } from '@quillbooking/components';
import BookingQuestion from './booking-question';
import PaymentHistory from './payment-history';

interface DayInfo {
	weekday: string;
	dayOfMonth: string;
	month: number;
	year: number;
}

function getNextTenDays(): DayInfo[] {
	const days: DayInfo[] = [];
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

const days = getNextTenDays();

const ShimmerLoader = () => (
	<div className="p-16 pt-8 animate-pulse">
	  {/* Header */}
	  <div className="flex justify-between border-b border-[#E5E5E5] pb-7 mb-10">
		<div className="h-8 w-48 bg-gray-200 rounded-md" />
		<div className="h-8 w-32 bg-gray-200 rounded-md" />
	  </div>
  
	  {/* Main Flex Row */}
	  <div className="flex gap-8">
		{/* Left Column: 4 Cards (2/3 width) */}
		<div className="w-2/3 flex flex-col gap-6">
		  {Array.from({ length: 4 }).map((_, index) => (
			<div
			  key={index}
			  className="bg-white shadow border border-gray-200 rounded-xl p-6"
			>
			  <div className="h-5 w-1/3 bg-gray-200 rounded" />
			  <div className="mt-4 h-4 w-2/3 bg-gray-200 rounded" />
			  <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded" />
			</div>
		  ))}
		</div>
  
		{/* Right Column: 3 Cards (1/3 width) */}
		<div className="w-1/3 flex flex-col gap-6">
		  {Array.from({ length: 3 }).map((_, index) => (
			<div
			  key={index}
			  className="bg-white shadow border border-gray-200 rounded-xl p-6"
			>
			  <div className="h-5 w-1/2 bg-gray-200 rounded" />
			  <div className="mt-4 h-4 w-3/4 bg-gray-200 rounded" />
			  <div className="mt-2 h-4 w-full bg-gray-200 rounded" />
			</div>
		  ))}
		</div>
	  </div>
	</div>
  );
  

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
	const [isLoading, setIsLoading] = useState(true);

	const { callApi } = useApi();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(true);
	const [isDeleted, setIsDeleted] = useState(false);

	const handleStatusUpdated = (action?: string) => {
		console.log('Action received:', action); // Add logging to debug
		
		switch (action) {
			case 'delete':
				handleClose();
				break;
			case 'rebook':
				if (!open) { // Only open if not already open
					setOpen(true);
				}
				break;
			default:
				// For other actions like mark_as_completed, just refresh the data
				fetchBooking();
				setRefresh((prev) => !prev);
		}
	};

	const handleNotice = (noticeMsg: NoticeMessage) => {
		setNotice(noticeMsg);
		// Auto-hide notice after 3 seconds
		setTimeout(() => setNotice(null), 3000);
	};

	const handleClose = () => {
		setIsDialogOpen(false);
		window.history.back();
	};

	const fetchBooking = async () => {
		if (isDeleted) return; // Don't fetch if booking is deleted
		setIsLoading(true);
		
		callApi({
			path: `bookings/${bookingId}`,
			method: 'GET',
			onSuccess: (response) => {
				console.log('Booking details:', response);
				setBooking(response);
				setIsLoading(false);
			},
			onError: (error) => {
				console.error(error);
				if (!isDeleted) {
					handleNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message: error.message || __('Error fetching booking details', 'quillbooking')
					});
				}
				setIsLoading(false);
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
				handleNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __('Error fetching bookings', 'quillbooking')
				});
			},
		});
	};

	useEffect(() => {
		if (bookingId && !isDeleted) {
			fetchBooking();
		}
	}, [bookingId, refresh]);

	useEffect(() => {
		fetchUpcomingBookings(
			days[selectedDate].dayOfMonth,
			days[selectedDate].month,
			days[selectedDate].year
		);
	}, [selectedDate, refresh]);

	// Format date/time information only once.
	const { date, time } = booking?.start_time
		? convertTimezone(booking.start_time, getCurrentTimezone())
		: { date: '', time: '' };

	const endTime = booking && booking.start_time && booking.slot_time
		? (() => {
			const [hours, minutes] = time.split(':').map(Number);
			const totalMinutes = hours * 60 + minutes + Number(booking.slot_time);
			const endHours = Math.floor(totalMinutes / 60);
			const endMinutes = totalMinutes % 60;
			return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
		})()
		: '';

	return (
		<Dialog
			open={isDialogOpen}
			onClose={handleClose}
			fullScreen
			className='z-[160000]'
		>
			{isLoading ? (
				<ShimmerLoader />
			) : (
				<>
					<Flex
						justify="space-between"
						className="border-b border-[#E5E5E5] p-4 pb-7 w-full"
					>
						<div>
							<Flex gap={10} align="center">
								<div 
									className="text-color-primary-text cursor-pointer"
									onClick={handleClose}
								>
									<CancelIcon width={30} height={30} />
								</div>
								<p className="text-2xl text-[#09090B] font-medium">
									{__('Booking Details', 'quillbooking')}
								</p>
							</Flex>
						</div>
						{booking && (
							<div className="flex justify-end">
								<BookingActions
									booking={booking}
									type="button"
									onStatusUpdated={handleStatusUpdated}
									onNotice={handleNotice}
								/>
							</div>
						)}
					</Flex>
					{notice && (
					<div className='mt-4 mx-16'>
						<NoticeBanner
							notice={notice}
							closeNotice={() => setNotice(null)}
						/>
						</div>
					)}
					<Flex gap={40} align="start" className="p-16 pt-8">
						{booking && (
							<Flex vertical gap={20} className="flex-1">
								<MeetingInformation booking={booking} />
								<BookingQuestion booking={booking} />
								<PaymentHistory booking={booking} />
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
									{date} - {time} - {endTime}
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
							onSaved={() => {
								setOpen(false);
								handleClose();
							}}
							booking={booking || undefined}
						/>
					)}
				</>
			)}
		</Dialog>
	);
};

export default BookingDetails;
