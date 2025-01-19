/**
 * Internal Dependencies
 */
import { State } from './reducer';
import { Notices } from './types';

/**
 * Get notices.
 *
 * @param {State} state State.
 *
 * @return {Notices} Notices.
 */
export const getNotices = (state: State): Notices => {
	return state.notices;
};

/**
 * Get breadcrumbs.
 *
 * @param {State} state State.
 *
 * @return {Record<string, string>} Breadcrumbs.
 */
export const getBreadcrumbs = (state: State): Record<string, string> => {
	return state.breadcrumbs;
};