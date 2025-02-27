import { isToday, isTomorrow } from 'date-fns';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

import { Booking } from '../client';

export const getCurrentTimeInTimezone = (timezone: string): string => {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: timezone,
	};
	return new Date().toLocaleString('en-US', options);
};

export const getCurrentTimezone = (): string => {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const convertTimezone = (
	timestamp: string,
	fromTimezone: string,
	toTimezone: string
): { date: string; time: string } => {
	// First, interpret the timestamp in the source timezone and get its UTC equivalent.
	const dateInUTC = fromZonedTime(timestamp, fromTimezone);
	// Then, convert that UTC time to the target timezone.
	const targetDate = toZonedTime(dateInUTC, toTimezone);

	return {
		date: format(targetDate, 'yyyy-MM-dd', {
			timeZone: toTimezone,
		}),
		time: format(targetDate, 'HH:mm', {
			timeZone: toTimezone,
		}),
	};
};



export const groupBookingsByDate = (bookings: Booking[]) => {
	return bookings.reduce<Record<string, Booking[]>>((groups, booking) => {
		// Convert booking.start_time into a Date object in the current timezone.
		const {date, time: startTime} = convertTimezone(
			booking.start_time,
			booking.timezone,
			getCurrentTimezone()
		);

		const {time: endTime} = convertTimezone(
			booking.end_time,
			booking.timezone,
			getCurrentTimezone()
		);

		booking.time_span = `${startTime} - ${endTime}`;

		let groupKey: string;

		if (isToday(date)) {
			groupKey = 'Today';
		} else if (isTomorrow(date)) {
			groupKey = 'Tomorrow';
		} else {
			groupKey = format(date, 'MMM dd, yyyy');
		}

		// Initialize the group if it doesn't exist
		if (!groups[groupKey]) {
			groups[groupKey] = [];
		}
		groups[groupKey].push(booking);
		return groups;
	}, {});
};
