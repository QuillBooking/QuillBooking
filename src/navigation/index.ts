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

export const getToLink = (routeTemplate: string) => {
	const pathname = document.location.pathname;
	const basename = pathname.substring(0, pathname.lastIndexOf('/'));
	let to = `${basename}/admin.php?page=quillbooking`;

	// Replace dynamic segments in the route template with the actual values from `params`.
	const route = routeTemplate.replace(/:([^/]+)/g, (_, key) => {
		const value = key;
		return value;
	});

	to += `&path=${route}`;

	return to;
};
