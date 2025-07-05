/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/types';
import { SET_CALENDAR } from './constants';

export type setCalendar = {
	type: typeof SET_CALENDAR;
	payload: Calendar;
};

export type CalendarActionTypes = setCalendar;