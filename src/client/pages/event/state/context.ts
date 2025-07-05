/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import type { Event } from '@quillbooking/types';

export const EventContext = createContext<{
	state: Event | null;
	actions: {
		setEvent: (event: Event) => void;
	};
}>({
	state: {} as Event | null,
	actions: {
		setEvent: () => { },
	},
});

const useEventContext = () => useContext(EventContext);
const { Provider } = EventContext;

export { useEventContext, Provider };