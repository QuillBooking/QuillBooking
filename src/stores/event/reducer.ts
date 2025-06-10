/**
 * External dependencies
 */
import type { Reducer } from 'redux';

/**
 * Internal Dependencies.
 */
import { SET_EVENT, CLEAR_EVENT, SET_EVENT_LOADING, SET_EVENT_ERROR } from './constants';
import { EventState, EventActionTypes } from './types';

// Initial State
const initialState: EventState = {
    current: null,
    loading: false,
    error: null,
};

/**
 * Reducer returning the event data object.
 *
 * @param {EventState} state Current state.
 * @param {EventActionTypes} action Dispatched action.
 *
 * @return {EventState} Updated state.
 */
const reducer: Reducer<EventState, EventActionTypes> = (
    state = initialState,
    action
) => {
    switch (action.type) {
        case SET_EVENT: {
            return {
                ...state,
                current: action.payload,
                error: null,
            };
        }
        case CLEAR_EVENT: {
            return {
                ...state,
                current: null,
                error: null,
            };
        }
        case SET_EVENT_LOADING: {
            return {
                ...state,
                loading: action.loading,
            };
        }
        case SET_EVENT_ERROR: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        default:
            return state;
    }
};

export type State = ReturnType<typeof reducer>;
export default reducer;
