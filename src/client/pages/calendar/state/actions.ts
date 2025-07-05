/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/types';
import { SET_CALENDAR } from './constants';
import type { CalendarActionTypes } from './types';

export default (dispatch: React.Dispatch<CalendarActionTypes>) => {
	return {
		setCalendar: (calendar: Calendar) => {
			dispatch({
				type: SET_CALENDAR,
				payload: calendar,
			});
		}
	};
};
