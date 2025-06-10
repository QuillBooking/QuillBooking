/**
 * External Dependencies.
 */
import type { FunctionKeys } from 'utility-types';
import type { Event } from '@quillbooking/client';

/**
 * Internal Dependencies.
 */
import { SET_EVENT, CLEAR_EVENT, SET_EVENT_LOADING, SET_EVENT_ERROR } from './constants';

export type EventState = {
    current: Event | null;
    loading: boolean;
    error: string | null;
};

type setEvent = {
    type: typeof SET_EVENT;
    payload: Event;
};

type clearEvent = {
    type: typeof CLEAR_EVENT;
};

type setEventLoading = {
    type: typeof SET_EVENT_LOADING;
    loading: boolean;
};

type setEventError = {
    type: typeof SET_EVENT_ERROR;
    error: string | null;
};

export type EventActionTypes =
    | setEvent
    | clearEvent
    | setEventLoading
    | setEventError
    | ReturnType<() => { type: 'NOOP' }>;

/**
 * Maps a "raw" selector object to the selectors available when registered on the @wordpress/data store.
 */
export type SelectFromMap<S extends Record<string, unknown>> = {
    [selector in FunctionKeys<S>]: S[selector] extends (...args: any[]) => any
    ? (...args: TailParameters<S[selector]>) => ReturnType<S[selector]>
    : never;
};

/**
 * Maps a "raw" actionCreators object to the actions available when registered on the @wordpress/data store.
 */
export type DispatchFromMap<A extends Record<string, (...args: any[]) => any>> =
    {
        [actionCreator in keyof A]: (
            ...args: Parameters<A[actionCreator]>
        ) => A[actionCreator] extends (...args: any[]) => Generator
            ? Promise<GeneratorReturnType<A[actionCreator]>>
            : void;
    };

/**
 * Parameters type of a function, excluding the first parameter.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type TailParameters<F extends Function> = F extends (
    head: any,
    ...tail: infer T
) => any
    ? T
    : never;

/**
 * Obtain the type finally returned by the generator when it's done iterating.
 */
export type GeneratorReturnType<T extends (...args: any[]) => Generator> =
    T extends (...args: any) => Generator<any, infer R, any> ? R : never;
