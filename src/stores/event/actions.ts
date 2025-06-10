/**
 * Internal Dependencies.
 */
import type { Event } from '@quillbooking/client';
import { SET_EVENT, CLEAR_EVENT, SET_EVENT_LOADING, SET_EVENT_ERROR } from './constants';
import { EventActionTypes } from './types';

/**
 * Set Event Action.
 * @param {Event} event Event.
 * @returns {EventActionTypes} Set Event Action.
 */
export const setEvent = (event: Event): EventActionTypes => ({
    type: SET_EVENT,
    payload: event,
});

/**
 * Clear Event Action.
 * @returns {EventActionTypes} Clear Event Action.
 */
export const clearEvent = (): EventActionTypes => ({
    type: CLEAR_EVENT,
});

/**
 * Set Event Loading Action.
 * @param {boolean} loading Loading state.
 * @returns {EventActionTypes} Set Event Loading Action.
 */
export const setEventLoading = (loading: boolean): EventActionTypes => ({
    type: SET_EVENT_LOADING,
    loading,
});

/**
 * Set Event Error Action.
 * @param {string | null} error Error message.
 * @returns {EventActionTypes} Set Event Error Action.
 */
export const setEventError = (error: string | null): EventActionTypes => ({
    type: SET_EVENT_ERROR,
    error,
});

/**
 * Async action to fetch and set event.
 * @param {string} eventId Event ID.
 */
export function* fetchEvent(eventId: string): Generator<any, void, any> {
    try {
        yield setEventLoading(true);
        yield setEventError(null);

        // Replace this with your actual API call
        const event = yield fetch(`/api/events/${eventId}`).then(res => res.json());

        yield setEvent(event);
    } catch (error) {
        yield setEventError(error instanceof Error ? error.message : 'Failed to fetch event');
    } finally {
        yield setEventLoading(false);
    }
}
