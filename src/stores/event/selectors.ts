/**
 * Internal Dependencies
 */
import type { Event } from '@quillbooking/client';
import { State } from './reducer';

/**
 * Get current event.
 *
 * @param {State} state State.
 *
 * @return {Event | null} Current event.
 */
export const getCurrentEvent = (state: State): Event | null => {
    return state.current;
};

/**
 * Get event loading state.
 *
 * @param {State} state State.
 *
 * @return {boolean} Loading state.
 */
export const isEventLoading = (state: State): boolean => {
    return state.loading;
};

/**
 * Get event error.
 *
 * @param {State} state State.
 *
 * @return {string | null} Error message.
 */
export const getEventError = (state: State): string | null => {
    return state.error;
};

/**
 * Check if an event is currently selected.
 *
 * @param {State} state State.
 *
 * @return {boolean} Whether an event is selected.
 */
export const hasCurrentEvent = (state: State): boolean => {
    return state.current !== null;
};

/**
 * Get event ID if available.
 *
 * @param {State} state State.
 *
 * @return {string | null} Event ID.
 */
export const getCurrentEventId = (state: State): string | null => {
    return state.current?.id || null;
};

