/**
 * QuillCRM dependencies
 */
import {
	getAdminPages,
	HistoryRouter,
	Route,
	getHistory,
	Routes,
	NavLink as Link,
} from '@quillbooking/navigation';

/**
 * WordPress Dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { size, map } from 'lodash';
import { notification, ConfigProvider, Breadcrumb } from 'antd';
import { useLocation } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { NavBar, SearchIcon, LogoIcon } from '@quillbooking/components';
import { Controller } from './controller';
import './style.scss';
import User from '../../components/icons/user.png';

const AntProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<ConfigProvider
			theme={{
				components: {
					Popover: {
						padding: 5,
					},
					Typography: {
						titleMarginTop: 0,
					},
					Table: {
						headerBg: '#fff',
					},
					Input: {
						borderRadius: 4,
					},
				},
			}}
		>
			{children}
		</ConfigProvider>
	);
};

const Notices: React.FC = () => {
	const { notices } = useSelect((select) => ({
		notices: select('quillbooking/core').getNotices(),
	}));
	const { deleteNotice } = useDispatch('quillbooking/core');
	const [api, contextHolder] = notification.useNotification();

	useEffect(() => {
		if (!size(notices)) {
			return;
		}

		map(notices, (notice, id) => {
			const { message, type, duration, placement } = notice;
			api[type]({
				message: message,
				duration: duration || 3,
				onClose: () => deleteNotice(id),
				placement: placement || 'bottomRight',
			});
		});
	}, [notices]);

	return contextHolder;
};

const Breadcrumbs: React.FC = () => {
	const location = useLocation();
	const { breadcrumbs: storeBreadcrumbs } = useSelect((select) => ({
		breadcrumbs: select('quillbooking/core').getBreadcrumbs(),
	}));

	const adminPages = map(getAdminPages(), (page) => {
		return { [page.path]: page.label };
	});
	const breadcrumbs = { ...storeBreadcrumbs, ...Object.assign({}, ...adminPages) };

	const pathnames = location.pathname.split('/').filter(Boolean);
	const breadcrumbItems = pathnames.map((_, index) => {
		const currentPath = `${pathnames.slice(0, index + 1).join('/')}`;
		const title = breadcrumbs[currentPath];
		if (!title) {
			return null;
		}
		return { title: <Link to={currentPath}>{title}</Link>, key: currentPath };
	});

	// Check if any title is ... return null
	if (breadcrumbItems.some((item) => item === null)) {
		return null;
	}

	// Remove null values
	const newBreadcrumbItems = breadcrumbItems.filter((item) => item !== null);

	return (
		<Breadcrumb
			className='quillbooking-breadcrumbs'
			items={[
				{
					title:
						<Link to="/">
							{__('Home', 'quillbooking')}
						</Link>,
					key: '/'
				},
				...newBreadcrumbItems,
			]}
		/>
	);
}

export const Layout = (props) => {
	return (
		<SlotFillProvider>
			<AntProvider>
				<div className='flex justify-between items-center border-b px-8 py-4'>
					<div className='flex items-center gap-4'>

						<LogoIcon />
					</div>
				</div>
				<div className="quillbooking-layout w-full">
					<div className='quillbooking-layout-navbar'>
						<NavBar />
					</div>
					<div className='w-full'>
						<Notices />
						{/* <Breadcrumbs /> */}
						<div className="quillbooking-layout__main">
							<Controller {...props} />
						</div>
					</div>
				</div>
			</AntProvider>
		</SlotFillProvider>
	);
};

const _PageLayout = () => {
	return (
		<>
			{/* @ts-ignore */}
			<HistoryRouter history={getHistory()}>
				<Routes>
					{Object.values(getAdminPages()).map((page) => {
						return (
							<Route
								key={page.path}
								path={page.path}
								element={<Layout page={page} />}
							/>
						);
					})}
				</Routes>
			</HistoryRouter>
		</>
	);
};

export default _PageLayout;