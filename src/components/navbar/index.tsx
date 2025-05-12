/** 
 * QuillCRM dependencies 
 */
import { getAdminPages, useNavigate, getToLink } from '@quillbooking/navigation';

/** 
 * WordPress dependencies 
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/** 
 * External dependencies 
 */
import { MenuProps, Menu } from 'antd';
import { LuArrowRightToLine } from "react-icons/lu";


/** 
 * Internal dependencies 
 */
import './style.scss';
import { UpgradeIcon, ToggleIcon } from "@quillbooking/components";
import { useLocation } from 'react-router';

const NavBar: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);
	const pages = getAdminPages();
	const getCurrentPath = () => {
		const params = new URLSearchParams(location.search);
		return params.get('path') || '';
	};
	const [selectedKey, setSelectedKey] = useState(() => {
		const currentPath = getCurrentPath();
		const match = Object.keys(pages).find(key => pages[key].path === currentPath);
		return match || 'dashboard';
	});

	useEffect(() => {
		const currentPath = getCurrentPath();
		const match = Object.keys(pages).find(key => pages[key].path === currentPath);
		if (match) {
			setSelectedKey(match);
		}
	}, [location.search]);


	// Load collapsed state from localStorage on mount
	useEffect(() => {
		const savedCollapsed = localStorage.getItem('quillbooking-navbar-collapsed');
		if (savedCollapsed !== null) {
			setCollapsed(savedCollapsed === 'true');
		}
	}, []);

	// Save collapsed state to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('quillbooking-navbar-collapsed', collapsed.toString());
	}, [collapsed]);

	type MenuItem = Required<MenuProps>['items'][number];
	const items: MenuItem[] = [];

	for (const key in pages) {
		const item = pages[key];
		if (item.hidden) {
			continue;
		}
		items.push({
			key: key,
			label: item.label,
		});
	}

	const onClick = (e) => {
		if (e.key === "toggle-button") return;

		const page = pages[e.key];
		const path = getToLink(page.path);
		setSelectedKey(e.key);
		navigate(path);
	};

	// Toggle the collapsed state
	const toggleCollapsed = () => {
		setCollapsed(!collapsed);
	};

	return (
		<div className={`quillbooking-navbar ${collapsed ? 'collapsed' : ''}`}>
			<Menu
				className="custom-menu"
				onClick={onClick}
				selectedKeys={[selectedKey]}
				mode="inline"
				//inlineCollapsed={collapsed}
				items={[
					{
						key: "toggle-button",
						label: (
							<span onClick={toggleCollapsed}>
								{collapsed ? (
									<LuArrowRightToLine size={18} className='text-[#A1A5B7]' />
								) : (<ToggleIcon />)}
							</span>
						),
						style: {
							cursor:'pointer',
							width: !collapsed ? "32px" : '30px',
							height: "32px",
							paddingLeft: "5px",
							paddingRight: "5px",
							paddingTop: !collapsed ? '' : '5px',
							paddingBottom: !collapsed ? '' : '5px',
							border: "1px solid #F1F1F2",
							position: "absolute",
							top: !collapsed ? '' : '5px',
							right: !collapsed ? "-20px" : '',
							left: !collapsed ? '' : '64px',
							backgroundColor: "white"
						},
						className: "navbar-toggle-button"
					},
					{
						key: "group",
						type: "group",
						children: items.map((item, index) => ({
							...item,
							key: item?.key ?? index,
							type: 'item',
							style: {
								paddingLeft: "15px",
								marginBottom: "24px"
							},
						})),
						className: "group"
					},
					{
						key: "spacer",
						label: "",
						style: {
							height: "140px",
							pointerEvents: "none"
						},
					},
					{
						key: "button-item",
						className: "button-item pl-0",
						label: (
							<a className='navbar-upgrade-button' href='/'>
								<div className={collapsed ? '' : 'mr-[15px]'}>
									<UpgradeIcon />
								</div>
								{!collapsed && <span>{__('Upgrade Plan', 'quillbooking')}</span>}
							</a>
						),
						style: { paddingLeft: "0px" },
					}
				]}
			/>
		</div>
	);
};

export default NavBar;