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
import { Button, Flex, Card } from 'antd';

/**
 * Internal dependencies
 */
import {
	Booking,
	BookingsTabsTypes,
	Event,
	GeneralOptions,
	NoticeMessage,
} from '@quillbooking/types';
import { useApi, useCurrentUser } from '@quillbooking/hooks';
import BookingsHeader from './header';
import BookingsTabs from './tabs';
import SearchFilter from './search-filter';
import { groupBookingsByDate } from '@quillbooking/utils';
import BookingList from './booking-list';
import AddBookingModal from './add-booking-modal';
import MonthSelector from './month-selector';
import { NoticeBanner, UpcomingCalendarIcon } from '@quillbooking/components';

const BookingsShimmer = () => {
	return (
		<div className="space-y-4">
			{[1, 2, 3].map((date) => (
				<Card key={date} className="rounded-xl">
					<div className="animate-pulse">
						<div className="h-6 w-48 bg-gray-200 rounded mb-4" />
						<div className="space-y-4">
							{[1, 2].map((booking) => (
								<div
									key={booking}
									className="border rounded-lg p-4"
								>
									<Flex
										justify="space-between"
										align="center"
									>
										<Flex gap={4} vertical>
											<div className="h-5 w-64 bg-gray-200 rounded" />
											<div className="h-4 w-48 bg-gray-200 rounded" />
											<div className="h-4 w-32 bg-gray-200 rounded mt-2" />
										</Flex>
										<Flex gap={3}>
											<div className="w-8 h-8 bg-gray-200 rounded" />
											<div className="w-8 h-8 bg-gray-200 rounded" />
										</Flex>
									</Flex>
								</div>
							))}
						</div>
					</div>
				</Card>
			))}
		</div>
	);
};

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
	const [loading, setLoading] = useState<boolean>(true);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [eventsOptions, setEventsOptions] = useState<GeneralOptions[]>([
		{ value: 'all', label: __('All Events', 'quillbooking') },
	]);
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);
	const currentMonth = new Date().getMonth() + 1;
	const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
	const [updateStatus, setUpdateStatus] = useState<boolean>(false);
	const canManageAllBookings = useCurrentUser().hasCapability(
		'quillbooking_manage_all_bookings'
	);
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
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __('Error fetching events', 'quillbooking'),
				});
			},
		});
	};

	const fetchBookings = (search?: string) => {
		setLoading(true);
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
				const bookings = groupBookingsByDate(
					res.bookings.data,
					res.time_format
				);
				setBookings(bookings);
				setPendingBookingCount(res.pending_count);
				setCancelledBookingCount(res.cancelled_count);
				setNoShowCount(res.noshow_count);
				setLoading(false);
			},
			onError: () => {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __('Error fetching bookings', 'quillbooking'),
				});
				setLoading(false);
			},
		});
	};

	const handleSearch = (val: string) => {
		fetchBookings(val);
	};

	const handleNotice = (newNotice: NoticeMessage) => {
		setNotice(newNotice);
		// Auto-hide notice after 3 seconds
		setTimeout(() => {
			setNotice(null);
		}, 3000);
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
					canManageAllBookings={canManageAllBookings}
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

			{notice && (
				<div className="mt-4">
					<NoticeBanner
						notice={notice}
						closeNotice={() => setNotice(null)}
					/>
				</div>
			)}

			{loading ? (
				<BookingsShimmer />
			) : Object.keys(bookings).length > 0 ? (
				<BookingList
					bookings={bookings}
					period={period}
					onStatusUpdated={() => setUpdateStatus((prev) => !prev)}
					onNotice={handleNotice}
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
						handleNotice({
							type: 'success',
							title: __('Success', 'quillbooking'),
							message: __(
								'Booking added successfully',
								'quillbooking'
							),
						});
					}}
				/>
			)}
		</div>
	);
};

export default Bookings;
