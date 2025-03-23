/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Flex } from 'antd';

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
import SearchFilter from './search-filter/indext';
import { groupBookingsByDate } from '@quillbooking/utils';
import BookingList from './booking-list';
import AddBookingModal from './add-booking-modal';

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

	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [eventsOptions, setEventsOptions] = useState<GeneralOptions[]>([
		{ value: 'all', label: __('All Events', 'quillbooking') },
	]);

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
				},
			}),
			method: 'GET',
			onSuccess: (res) => {
				const bookings = groupBookingsByDate(res.bookings.data);
				setPendingBookingCount(res.pending_count);
				setCancelledBookingCount(res.cancelled_count);
				setBookings(bookings);
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
	}, [period, author, event, eventType]);

	return (
		<>
			<BookingsHeader handleOpen={setOpen} />

			<Flex
				justify="space-between"
				align="middle"
				className="border-2 border-solid borderColor-[#DEDEDE] rounded-xl p-4 my-6"
			>
				<BookingsTabs
					setPeriod={setPeriod}
					period={period}
					pendingCount={pendingBookingCount}
					cancelled={cancelledBookingCount}
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

			<BookingList bookings={bookings} period={period} />

			{open && (
				<AddBookingModal
					open={open}
					onClose={() => setOpen(false)}
					onSaved={() => {
						setOpen(false);
						fetchBookings();
					}}
				/>
			)}
		</>
	);
};

export default Bookings;
