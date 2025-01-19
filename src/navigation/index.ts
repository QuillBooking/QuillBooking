export * from './api';
export {
	Routes,
	Route,
	matchPath,
	BrowserRouter,
	useParams,
	unstable_HistoryRouter as HistoryRouter,
	useNavigate,
	useMatch,
} from 'react-router-dom';
export { NavLink, setForceReload } from './nav-link';
export { getHistory } from './history';

export const getToLink = (routeTemplate: string, params: Record<string, string | number>) => {
	const pathname = document.location.pathname;
	const basename = pathname.substring(0, pathname.lastIndexOf('/'));
	let to = `${basename}/admin.php?page=quillbooking`;

	// Replace dynamic segments in the route template with the actual values from `params`.
	const route = routeTemplate.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
		const value = params[key];
		if (!value) {
			throw new Error(`Missing parameter '${key}' for route '${routeTemplate}'`);
		}
		return encodeURIComponent(String(value));
	});

	to += `&path=${route}`;
	console.log(to);

	return to;
};
