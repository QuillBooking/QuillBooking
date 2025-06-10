// hooks/useEvent.ts
import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_KEY as EVENT_STORE_KEY } from '../../stores/event';

/**
 * Custom hook for event operations
 */
const useEvent = () => {
    const { currentEvent, loading, error, hasEvent } = useSelect((select) => ({
        currentEvent: select(EVENT_STORE_KEY).getCurrentEvent(),
        loading: select(EVENT_STORE_KEY).isEventLoading(),
        error: select(EVENT_STORE_KEY).getEventError(),
        hasEvent: select(EVENT_STORE_KEY).hasCurrentEvent(),
    }), []);

    const { setEvent, clearEvent, fetchEvent, setEventLoading, setEventError } = useDispatch(EVENT_STORE_KEY);

    return {
        // State
        currentEvent,
        loading,
        error,
        hasEvent,
        // Actions
        setEvent,
        clearEvent,
        fetchEvent,
        setEventLoading,
        setEventError,
    };
};

export default useEvent;