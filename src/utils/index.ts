import { isToday, isTomorrow } from 'date-fns';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

import { Booking, DateOverrides } from '@quillbooking/client';

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
	toTimezone: string,
	fromTimezone: string = 'UTC'
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
		const currentTimezone = getCurrentTimezone();
		// Convert booking.start_time into a Date object in the current timezone.
		const { date, time: startTime } = convertTimezone(
			booking.start_time,
			currentTimezone
		);
		const { time: endTime } = convertTimezone(
			booking.end_time,
			currentTimezone
		);

		// Format startTime and endTime to 12-hour format with AM/PM
		const formattedStartTime = format(
			new Date(`1970-01-01T${startTime}:00`),
			'hh:mm a'
		);
		const formattedEndTime = format(
			new Date(`1970-01-01T${endTime}:00`),
			'hh:mm a'
		);

		const bookingWithTimeSpan = {
			...booking,
			time_span: `${formattedStartTime.toLowerCase()} - ${formattedEndTime.toLowerCase()}`,
		};

		// Determine the inner key:
		// If the booking date is today or tomorrow, use "today-" or "tomorrow-" prefix.
		// Otherwise, use the three-letter day abbreviation and the day number (e.g., "tue-20").
		let dayKey: string;
		if (isToday(date)) {
			dayKey = `today-${format(date, 'd')}`;
		} else if (isTomorrow(date)) {
			dayKey = `tomorrow-${format(date, 'd')}`;
		} else {
			dayKey = `${format(date, 'eee').toLowerCase()}-${format(date, 'd')}`;
		}

		if (!groups[dayKey]) {
			groups[dayKey] = [];
		}

		groups[dayKey].push(bookingWithTimeSpan);
		return groups;
	}, {});
};

export const fetchAjax = async (url: string, options: RequestInit = {}) => {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	return response.json();
};

export const getFields = (formData: Record<string, any>) => {
	const groupedFields = {};

	Object.entries(formData).forEach(([key, value]) => {
		if (key.startsWith('fields-')) {
			groupedFields[key.replace('fields-', '')] = value;
		}
	});

	return groupedFields;
};


export function isValidDateOverrides(dateOverrides: DateOverrides) {
	return Object.entries(dateOverrides).every(([key, value]) => {
		// Check if the key is empty
		if (!key || key.trim() === "") {
			return false;
		}

		// Check if the value is a non-empty array
		if (!Array.isArray(value) || value.length === 0) {
			return false;
		}

		return value.every(entry => {
			// Ensure each entry is a valid object
			if (typeof entry !== "object" || entry === null) {
				return false;
			}

			// Ensure all fields are non-empty
			return Object.values(entry).every(fieldValue =>
				fieldValue !== undefined &&
				fieldValue !== null &&
				!(typeof fieldValue === "string" && fieldValue.trim() === "")
			);
		});
	});
}
