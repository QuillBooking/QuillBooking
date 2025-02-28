/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { PlusOutlined } from '@ant-design/icons';

/**
 * External dependencies
 */
import { Button, Flex, Input, Modal, Popover, Typography } from 'antd';

/**
 * Internal dependencies
 */
import { FieldWrapper, TimezoneSelect } from '@quillbooking/components';
import { Availability, Booking, Event, GeneralOptions } from 'client/types';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import BookingsHeader from './header';
import BookingsTabs from './tabs';
import SearchFilter from './search-filter/indext';
import { groupBookingsByDate } from '@quillbooking/utils';
import BookingList from './booking-list';

/**
 * Main Bookings Component.
 */
// const { Title, Text } = Typography;

const Bookings: React.FC = () => {
	// Parent component (bookings, dropdwon)
	// dropdown components with search (will fetch values)
	// state for selected booking satus component
	// list to display data
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
				setEventsOptions((prevOptions) => [
					...prevOptions,
					...events,
				]);
			},
			onError: () => {
				errorNotice(__('Error fetching events', 'quillbooking'));
			},
		});
	};

	const fetchBookings = () => {
		callApi({
			path: 'bookings',
			method: 'GET',
			onSuccess: (res) => {
				const bookings = groupBookingsByDate(res.data);
				setBookings(bookings);
			},
			onError: () => {
				errorNotice(__('Error fetching bookings', 'quillbooking'));
			},
		})
	}

	useEffect(() => {
		fetchEvents();
		fetchBookings();
	}, []);

	return (
		<>
			<BookingsHeader />

			<Flex justify="space-between" align="middle">
				<BookingsTabs />
				<SearchFilter events={eventsOptions} />
			</Flex>

			<BookingList bookings={bookings as any} />
		</>
	);
};

export default Bookings;
