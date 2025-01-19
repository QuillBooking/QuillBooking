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
import type { Event } from '@quillbooking/client';
import { SET_EVENT } from './constants';
import type { EventActionTypes } from './types';

/**
 * Event Reducer
 */
const event: Reducer<Event, EventActionTypes> = (state: Event = {} as Event, action: EventActionTypes) => {
	switch (action.type) {
		case SET_EVENT: {
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
	event,
});

export type State = ReturnType<typeof rootReducer>;
export default rootReducer;