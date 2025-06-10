/**
 * Internal Dependencies.
 */
import { ADD_NOTICE, DELETE_NOTICE, SET_BREADCRUMBS } from './constants';
import { CoreActionTypes, Notice } from '../types';

/**
 * Add Notice Action.
 * @param {Notice} notice Notice.
 * @returns {CoreActionTypes} Add Notice Action.
 */
export const createNotice = (notice: Notice): CoreActionTypes => ({
	type: ADD_NOTICE,
	notice,
});

/**
 * Delete Notice Action.
 * @param {string} id Notice ID.
 * @returns {CoreActionTypes} Delete Notice Action.
 */
export const deleteNotice = (id: string): CoreActionTypes => ({
	type: DELETE_NOTICE,
	id,
});

/**
 * Set Breadcrumbs Action.
 * @param {Record<string, string>} breadcrumbs Breadcrumbs.
 * @returns {CoreActionTypes} Set Breadcrumbs Action.
 */
export const setBreadcrumbs = (breadcrumbs: Record<string, string>): CoreActionTypes => ({
	type: SET_BREADCRUMBS,
	breadcrumbs,
});