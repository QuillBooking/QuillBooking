/**
 * External Dependencies.
 */
import type { FunctionKeys } from 'utility-types';

/**
 * Internal Dependencies.
 */
import { ADD_NOTICE, DELETE_NOTICE, SET_BREADCRUMBS } from './core/constants';

export type CorePureState = {
	notices: Notices;
	breadcrumbs: Record<string, string>;
};

export type Notices = {
	[noteId: string]: Notice;
};

export type Notice = {
	type: string;
	duration?: number;
	message: string;
	placement?: string;
};

type addNote = {
	type: typeof ADD_NOTICE;
	notice: Notice;
};

type deleteNote = {
	type: typeof DELETE_NOTICE;
	id: string;
};

type setBreadcrumbs = {
	type: typeof SET_BREADCRUMBS;
	breadcrumbs: Record<string, string>;
};

export type CoreActionTypes =
	| addNote
	| deleteNote
	| setBreadcrumbs
	| ReturnType<() => { type: 'NOOP' }>;

/**
 * Maps a "raw" selector object to the selectors available when registered on the @wordpress/data store.
 *
 * @template S Selector map, usually from `import * as selectors from './my-store/selectors';`
 */

export type SelectFromMap<S extends Record<string, unknown>> = {
	[selector in FunctionKeys<S>]: S[selector] extends (...args: any[]) => any
	? (...args: TailParameters<S[selector]>) => ReturnType<S[selector]>
	: never;
};

/**
 * Maps a "raw" actionCreators object to the actions available when registered on the @wordpress/data store.
 *
 * @template A Selector map, usually from `import * as actions from './my-store/actions';`
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
 *
 * This is useful for typing some @wordpres/data functions that make a leading
 * `state` argument implicit.
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
