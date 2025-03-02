/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { PlusOutlined } from '@ant-design/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Button, Flex, Input, Modal, Popover, Typography } from 'antd';
import { filter } from 'lodash';


/**
 * Internal dependencies
 */
import { FieldWrapper, TimezoneSelect } from '@quillbooking/components';
import {
	Availability,
	Booking,
	BookingsTabsTypes,
	Event,
	GeneralOptions,
} from 'client/types';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import BookingsHeader from './header';
import BookingsTabs from './tabs';
import SearchFilter from './search-filter/indext';
import { groupBookingsByDate } from '@quillbooking/utils';
import BookingList from './booking-list';

/**
 * Main Bookings Component.
 */
const Bookings: React.FC = () => {
	const [period, setPeriod] = useState<BookingsTabsTypes>('all');
	const [author, setAuthor] = useState<string>('own');
	const [event, setEvent] = useState<string | number>('all');
	const [eventType, setEventType] = useState<string>('all');
	const [pendingBookingCount, setPendingBookingCount] = useState<number>(0);

	const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
	const [eventsOptions, setEventsOptions] = useState<GeneralOptions[]>([
		{ value: 'all', label: 'All Events' },
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
				const bookings = groupBookingsByDate(res.data);
				const pendingCount = filter(res.data, {
					status: 'pending',
				}).length;
				setPendingBookingCount(pendingCount);
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

	// Refetch bookings whenever any filter value changes.
	useEffect(() => {
		fetchBookings();
	}, [period, author, event, eventType]);

	return (
		<>
			<BookingsHeader />

			<Flex justify="space-between" align="middle">
				<BookingsTabs
					setPeriod={setPeriod}
					pendingCount={pendingBookingCount}
				/>
				<SearchFilter
					author={author}
					events={eventsOptions}
					setAuthor={setAuthor}
					setEvent={setEvent}
					setEventType={setEventType}
					handleSearch={handleSearch}
				/>
			</Flex>

			<BookingList bookings={bookings} period={period}/>
		</>
	);
};

export default Bookings;
