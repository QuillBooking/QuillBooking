import { __ } from '@wordpress/i18n';
import { isToday, isTomorrow } from 'date-fns';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

import type { Booking, DateOverrides, Location } from '../types';

export const getCurrentTimeInTimezone = (timezone: string, timeFormat: string = '12'): string => {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: timeFormat === '12',
		timeZone: timezone,
	};
	return new Date().toLocaleString('en-US', options);
};

export const getCurrentTimezone = (): string => {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format time string based on timeFormat preference
 * @param time - Time string in HH:mm format
 * @param timeFormat - '12' for 12-hour format, '24' for 24-hour format
 * @returns Formatted time string
 */
export const formatTime = (time: string, timeFormat: string = '12'): string => {
	if (!time) return '';

	// Handle time parsing - support both HH:mm and H:mm formats
	const [h, m] = time.split(':').map(Number);

	if (timeFormat === '24') {
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
	}

	// 12-hour format
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hour12 = h % 12 === 0 ? 12 : h % 12;
	return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
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

export const groupBookingsByDate = (bookings: Booking[], timeFormat = "12") => {
	return bookings.reduce<Record<string, Booking[]>>((groups, booking) => {
		const currentTimezone = getCurrentTimezone();
		const { date, time: startTime } = convertTimezone(
			booking.start_time,
			currentTimezone
		);
		const { time: endTime } = convertTimezone(
			booking.end_time,
			currentTimezone
		);

		// Choose format based on timeFormat value
		const timeFormatString = timeFormat === '24' ? 'HH:mm' : 'hh:mm a';

		const formattedStartTime = format(
			new Date(`1970-01-01T${startTime}:00`),
			timeFormatString
		);
		const formattedEndTime = format(
			new Date(`1970-01-01T${endTime}:00`),
			timeFormatString
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
		if (!key || key.trim() === '') {
			return false;
		}

		// Check if the value is a non-empty array
		if (!Array.isArray(value) || value.length === 0) {
			return false;
		}

		return value.every((entry) => {
			// Ensure each entry is a valid object
			if (typeof entry !== 'object' || entry === null) {
				return false;
			}

			// Ensure all fields are non-empty
			return Object.values(entry).every(
				(fieldValue) =>
					fieldValue !== undefined &&
					fieldValue !== null &&
					!(
						typeof fieldValue === 'string' &&
						fieldValue.trim() === ''
					)
			);
		});
	});
}

export function get_location(
	event_locations: Location[],
	location_type: string,
	location_data?: string
) {
	// Handle attendee-specific cases first
	if (location_type === 'attendee_address' && location_data) {
		return {
			label: 'Attendee Address',
			value: location_data,
			type: location_type,
		};
	}

	if (location_type === 'attendee_phone' && location_data) {
		return {
			label: 'Attendee Phone',
			value: location_data,
			type: location_type,
		};
	}

	// Find the matching location
	const location = event_locations.find((loc) => {
		// If location has an ID, it matches
		if (loc.id == location_type) return true;

		// Otherwise, match by type
		return loc.type === location_type;
	});

	if (!location) {
		return null; // No matching location found
	}

	// Handle ID-based locations
	if (location.id) {
		return {
			label: location.fields.location || '',
			value: location.fields.description || '',
			type: location.type,
			id: location.id,
		};
	}

	// Handle type-based locations
	const locationMap = {
		person_address: () => ({
			label: 'Person Address',
			value: location.fields.location || '',
			type: location.type,
		}),
		person_phone: () => ({
			label: 'Person Phone',
			value: location.fields.phone || '',
			type: location.type,
		}),
		online: () => ({
			label: 'Online',
			value: location.fields.meeting_url || '',
			type: location.type,
		}),
		zoom: () => ({
			label: 'Zoom',
			type: location.type,
		}),
		'ms-teams': () => ({
			label: 'Microsoft Teams',
			type: location.type,
		}),
		'google-meet': () => ({
			label: 'Google Meet',
			type: location.type,
		}),
	};

	const locationBuilder = locationMap[location_type];
	return locationBuilder ? locationBuilder() : null;
}

export const getCurrencySymbol = (currencyCode: string) => {
	const symbols: { [key: string]: string } = {
		USD: '$',
		EUR: '€',
		GBP: '£',
		JPY: '¥',
		AUD: 'A$',
		CAD: 'C$',
		CHF: 'CHF',
		CNY: '¥',
		INR: '₹',
		BRL: 'R$',
		// Add more currencies as needed
	};
	return symbols[currencyCode] || currencyCode;
};

export const formatPrice = (
	price: number | string,
	currency: string = 'USD'
) => {
	// If price is 0 or falsy (undefined, null, etc.), return 'Free'
	if (price === 0 || !price) {
		return __('Free', 'quillbooking');
	}

	const symbol = getCurrencySymbol(currency);

	// Handle different price formats for different currencies
	if (typeof price === 'number') {
		// For JPY and other zero-decimal currencies, don't show decimals
		if (
			[
				'JPY',
				'BIF',
				'CLP',
				'DJF',
				'GNF',
				'KMF',
				'KRW',
				'MGA',
				'PYG',
				'RWF',
				'VND',
				'VUV',
				'XAF',
				'XOF',
				'XPF',
			].includes(currency)
		) {
			return `${symbol}${Math.round(price)}`;
		}

		// Standard format with 2 decimal places
		return `${symbol}${price.toFixed(2)}`;
	}

	// If price is already a string (e.g., "Free")
	return typeof price === 'string' && price.toLowerCase() === 'free'
		? __('Free', 'quillbooking')
		: `${symbol}${price}`;
};
