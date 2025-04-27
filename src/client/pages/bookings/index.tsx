/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { PlusOutlined } from '@ant-design/icons';

/**
 * External dependencies
 */
import { Button, Flex } from 'antd';

/**
 * Internal dependencies
 */
import {
	Booking,
	BookingsTabsTypes,
	Event,
	GeneralOptions,
} from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import BookingsHeader from './header';
import BookingsTabs from './tabs';
import SearchFilter from './search-filter';
import { groupBookingsByDate } from '@quillbooking/utils';
import BookingList from './booking-list';
import AddBookingModal from './add-booking-modal';
import MonthSelector from './month-selector';
import { UpcomingCalendarIcon } from '@quillbooking/components';

/**
 * Main Bookings Component.
 */
const Bookings: React.FC = () => {
	const [open, setOpen] = useState<boolean>(false);
	const [period, setPeriod] = useState<BookingsTabsTypes>('all');
	const [author, setAuthor] = useState<string>('own');
	const [event, setEvent] = useState<string | number>('all');
	const [eventType, setEventType] = useState<string>('all');
	const [pendingBookingCount, setPendingBookingCount] = useState<number>(0);
	const [cancelledBookingCount, setCancelledBookingCount] =
		useState<number>(0);
	const [noShowCount, setNoShowCount] = useState<number>(0);

	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [eventsOptions, setEventsOptions] = useState<GeneralOptions[]>([
		{ value: 'all', label: __('All Events', 'quillbooking') },
	]);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const currentMonth = new Date().getMonth() + 1;
	const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
	const [updateStatus, setUpdateStatus] = useState<boolean>(false);

	const { errorNotice } = useNotice();
	const { callApi } = useApi();

	const fetchEvents = () => {
		callApi({
			path: 'events',
			method: 'GET',
			onSuccess: (res) => {
				const events = res.data.map((event: Event) => ({
					value: event.id,
					label: event.name,
				}));
				setEventsOptions((prevOptions) => [...prevOptions, ...events]);
			},
			onError: () => {
				errorNotice(__('Error fetching events', 'quillbooking'));
			},
		});
	};

	const fetchBookings = (search?: string) => {
		callApi({
			path: addQueryArgs('bookings', {
				filter: {
					period: period,
					user: author.toLowerCase(),
					event:
						typeof event === 'string' ? event.toLowerCase() : event,
					event_type: eventType.toLowerCase(),
					search: search?.toLowerCase(),
					year: year,
					month: selectedMonth,
				},
			}),
			method: 'GET',
			onSuccess: (res) => {
				const bookings = groupBookingsByDate(res.bookings.data);
				setBookings(bookings);
				setPendingBookingCount(res.pending_count);
				setCancelledBookingCount(res.cancelled_count);
				setNoShowCount(res.noshow_count);
			},
			onError: () => {
				errorNotice(__('Error fetching bookings', 'quillbooking'));
			},
		});
	};

	const handleSearch = (val: string) => {
		fetchBookings(val);
	};

	useEffect(() => {
		fetchEvents();
		fetchBookings();
	}, []);

	useEffect(() => {
		fetchBookings();
	}, [period, author, event, eventType, updateStatus, year, selectedMonth]);

	return (
		<div className="h-fit">
			<BookingsHeader handleOpen={setOpen} />

			<Flex
				justify="space-between"
				align="middle"
				className="border border-solid borderColor-[#DEDEDE] rounded-xl p-4 my-6"
			>
				<BookingsTabs
					setPeriod={setPeriod}
					period={period}
					pendingCount={pendingBookingCount}
					cancelled={cancelledBookingCount}
					noShowCount={noShowCount}
				/>

				<div className="border-l-2 border-solid borderColor-[#DEDEDE]"></div>

				<SearchFilter
					event={event}
					eventType={eventType}
					author={author}
					events={eventsOptions}
					setAuthor={setAuthor}
					setEvent={setEvent}
					setEventType={setEventType}
					handleSearch={handleSearch}
				/>
			</Flex>

			<MonthSelector
				year={year}
				setYear={setYear}
				selectedMonth={selectedMonth}
				setSelectedMonth={setSelectedMonth}
			/>

			{Object.keys(bookings).length > 0 ? (
				<BookingList
					bookings={bookings}
					period={period}
					onStatusUpdated={() => setUpdateStatus((prev) => !prev)}
				/>
			) : (
				<div className="flex flex-col gap-4 justify-center items-center mt-4 h-full border border-solid borderColor-[#DEDEDE] rounded-xl p-4 my-6 py-6 bg-[#FDFDFD]">
					<div className="w-36 h-36 flex justify-center items-center rounded-full bg-[#F4F5FA] border border-solid borderColor-[#E1E2E9]">
						<UpcomingCalendarIcon width={60} height={60} />
					</div>

					<p className="text-xl font-medium my-1 text-color-primary-text">
						{__('No Bookings Yet?', 'quillbooking')}
					</p>

					<p>
						{__(
							'You can also Book Events Manually.',
							'quillbooking'
						)}
					</p>

					<Button
						type="primary"
						className="bg-color-primary text-white"
						size="large"
						onClick={() => {
							setOpen(true);
						}}
					>
						<PlusOutlined />
						{__('Add Booking Manually', 'quillbooking')}
					</Button>
				</div>
			)}

			{open && (
				<AddBookingModal
					open={open}
					onClose={() => setOpen(false)}
					onSaved={() => {
						setOpen(false);
						setUpdateStatus((prev) => !prev);
					}}
				/>
			)}
		</div>
	);
};

export default Bookings;
