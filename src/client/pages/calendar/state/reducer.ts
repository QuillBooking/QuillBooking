/**
 * WordPress Dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * External dependencies
 */
import type { Reducer } from 'redux';

/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/types';
import { SET_CALENDAR } from './constants';
import type { CalendarActionTypes } from './types';

/**
 * Calendar Reducer
 */
const calendar: Reducer<Calendar, CalendarActionTypes> = (state: Calendar = {} as Calendar, action: CalendarActionTypes) => {
	switch (action.type) {
		case SET_CALENDAR: {
			return action.payload;
		}
		default: {
			return state;
		}
	}
}

/**
 * Root Reducer
 */
export const rootReducer = combineReducers({
	calendar,
});

export type State = ReturnType<typeof rootReducer>;
export default rootReducer;