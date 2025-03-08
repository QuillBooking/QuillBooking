import { isToday, isTomorrow } from 'date-fns';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

import dayjs, { Dayjs } from 'dayjs';
import { Booking, EventAvailability, WeeklyHours } from '../client';

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
		const currentTimezone = getCurrentTimezone();
		// Convert booking.start_time into a Date object in the current timezone.
		const { date, time: startTime } = convertTimezone(
			booking.start_time,
			booking.timezone,
			currentTimezone
		);

		const { time: endTime } = convertTimezone(
			booking.end_time,
			booking.timezone,
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

		let groupKey: string;

		if (isToday(date)) {
			groupKey = 'Today';
		} else if (isTomorrow(date)) {
			groupKey = 'Tomorrow';
		} else {
			groupKey = format(date, 'MMM dd, yyyy');
		}

		// Initialize the group if it doesn't exist
		groups[groupKey] = groups[groupKey] || [];

		groups[groupKey].push(bookingWithTimeSpan);
		return groups;
	}, {});
};

const DAYS = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
] as const;

type DayKey = (typeof DAYS)[number];
type TimeSlot = { start: string; end: string };

export const getOffDays = (weeklyHours: WeeklyHours): number[] => {
	return DAYS.reduce((acc: number[], day: DayKey, index: number) => {
		if (weeklyHours[day]?.off) {
			acc.push(index);
		}
		return acc;
	}, []);
};

export const getDisabledDates = (
	current: Dayjs,
	selectedAvailability: EventAvailability | null
) => {
	if (!selectedAvailability) return false;

	// Disable based on weekly off days.
	const offDays = getOffDays(selectedAvailability.availability.weekly_hours);

	const dateKey = current.format('YYYY-MM-DD');
	const override = selectedAvailability.availability.override?.[dateKey];

	return (
		offDays.includes(current.day()) ||
		override?.some((slot) => slot.start === slot.end) ||
		current.isBefore(dayjs(), 'day')
	);
};

export const getTimeSlots = (
	date: Dayjs,
	selectedAvailability: EventAvailability | null,
	duration: number,
	showAllTimes: boolean = false
): string[] => {
	if (duration <= 0) throw new Error('Duration must be positive');
	if (!selectedAvailability) return [];

	const dateKey = date.format('YYYY-MM-DD');
	const slots: string[] = [];

	if (showAllTimes) {
		return generateAllDaySlots(date, duration);
	}

	const override = selectedAvailability.availability.override?.[dateKey];
	const daySchedule = getDaySchedule(selectedAvailability, date.day());

	const addSlots = (start: string, end: string) => {
		let current = dayjs(`${dateKey} ${start}`, 'YYYY-MM-DD HH:mm');
		const endTime = dayjs(`${dateKey} ${end}`, 'YYYY-MM-DD HH:mm');

		while (current.isBefore(endTime)) {
			slots.push(current.format('HH:mm'));
			current = current.add(duration, 'minute');
		}
	};

	if (override?.length) {
		override.forEach(({ start, end }) => addSlots(start, end));
	} else if (daySchedule?.times?.length) {
		daySchedule.times.forEach(({ start, end }) => addSlots(start, end));
	}

	return slots;
};

const generateAllDaySlots = (date: Dayjs, duration: number): string[] => {
	const slots: string[] = [];
	const start = date.startOf('day');
	const end = date.endOf('day');
	let current = start;

	while (current.isBefore(end)) {
		slots.push(current.format('h:mm A'));
		current = current.add(duration, 'minute');

		// Prevent infinite loop with zero duration
		if (duration === 0) break;
	}
	return slots;
};

const getDaySchedule = (
	availability: EventAvailability,
	dayOfWeek: number
): { times: TimeSlot[] } | undefined => {
	return availability.availability.weekly_hours[DAYS[dayOfWeek]];
};
