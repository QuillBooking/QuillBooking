/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/types';

export const CalendarContext = createContext<{
	state: Calendar | null;
	actions: {
		setCalendar: (calendar: Calendar) => void;
	};
}>({
	state: {} as Calendar | null,
	actions: {
		setCalendar: () => { },
	},
});

const useCalendarContext = () => useContext(CalendarContext);
const { Provider } = CalendarContext;

export { useCalendarContext, Provider };