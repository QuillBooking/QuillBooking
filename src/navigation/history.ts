/**
 * External dependencies
 */
import { BrowserHistory, createBrowserHistory, Location } from 'history';
import { parse } from 'qs';

/**
 * Extension of history.BrowserHistory but also adds { pathname: string } to the location object.
 */
export interface QuillBookingBrowserHistory extends BrowserHistory {
	location: Location & {
		pathname: string;
	};
}

let _history: QuillBookingBrowserHistory;

/**
 * Create a custom history object that supports dynamic path construction
 * based on query parameters.
 *
 * @return {QuillBookingBrowserHistory} React-router history object with dynamic pathname construction.
 */
function getHistory(): QuillBookingBrowserHistory {
	if (!_history) {
		const browserHistory = createBrowserHistory();
		_history = {
			get action() {
				return browserHistory.action;
			},
			get location() {
				const { location } = browserHistory;
				const query = parse(location.search.substring(1));
				let pathname = '/';

				// Dynamically construct the pathname based on query parameters
				if (query && typeof query.path === 'string') {
					pathname = query.path ? `/${query.path}` : '';
				}

				return {
					...location,
					pathname,
				};
			},
			createHref: browserHistory.createHref,
			push: browserHistory.push,
			replace: browserHistory.replace,
			go: browserHistory.go,
			back: browserHistory.back,
			forward: browserHistory.forward,
			block: browserHistory.block,
			listen(listener) {
				return browserHistory.listen(() => {
					listener({
						action: this.action,
						location: this.location,
					});
				});
			},
		};
	}
	return _history;
}

export { getHistory };
