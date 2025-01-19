/**
 * Internal dependencies
 */
import type { Event } from '@quillbooking/client';
import { SET_EVENT } from './constants';

export type setEvent = {
	type: typeof SET_EVENT;
	payload: Event;
};

export type EventActionTypes = setEvent;