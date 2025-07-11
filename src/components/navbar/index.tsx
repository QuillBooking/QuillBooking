/**
 * QuillCRM dependencies
 */
import {
	getAdminPages,
	useNavigate,
	getToLink,
} from '@quillbooking/navigation';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { MenuProps, Menu, Button } from 'antd';
import { LuArrowRightToLine } from 'react-icons/lu';

/**
 * Internal dependencies
 */
import './style.scss';
import { UpgradeIcon, ToggleIcon } from '@quillbooking/components';
import { useLocation } from 'react-router';
import { ACTIVE_PRO_URL } from '@quillbooking/constants';
import ConfigApi from '@quillbooking/config';
const NavBar: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);
	const pages = getAdminPages();
	const license = ConfigApi.getLicense();
	const getCurrentPath = () => {
		const params = new URLSearchParams(location.search);
		return params.get('path') || '';
	};
	const [selectedKey, setSelectedKey] = useState(() => {
		const currentPath = getCurrentPath();
		const match = Object.keys(pages).find(
			(key) => pages[key].path === currentPath
		);
		return match || 'dashboard';
	});

	useEffect(() => {
		const currentPath = getCurrentPath();
		const match = Object.keys(pages).find(
			(key) => pages[key].path === currentPath
		);
		if (match) {
			setSelectedKey(match);
		}
	}, [location.search]);

	// Load collapsed state from localStorage on mount
	useEffect(() => {
		const savedCollapsed = localStorage.getItem(
			'quillbooking-navbar-collapsed'
		);
		if (savedCollapsed !== null) {
			setCollapsed(savedCollapsed === 'true');
		}
	}, []);

	// Save collapsed state to localStorage when it changes
	useEffect(() => {
		localStorage.setItem(
			'quillbooking-navbar-collapsed',
			collapsed.toString()
		);
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
		const page = pages[e.key];
		const path = getToLink(page.path);
		setSelectedKey(e.key);
		navigate(path);
	};

	// Toggle the collapsed state
	const toggleCollapsed = () => {
		setCollapsed(!collapsed);
	};

	let menuItems = [
		{
			key: 'group',
			type: 'group',
			children: items.map((item, index) => ({
				...item,
				key: item?.key ?? index,
				type: 'item',
				style: {
					paddingLeft: '15px',
					marginBottom: '24px',
				},
			})),
			className: 'group',
		},
		{
			key: 'spacer',
			label: '',
			style: {
				height: '140px',
				pointerEvents: 'none',
			},
		},

	]

	if (!license) {
		menuItems.push({
			key: 'button-item',
			className: 'button-item pl-0',
			label: (
				<a
					className="navbar-upgrade-button"
					href={ACTIVE_PRO_URL}
				>
					<div className={collapsed ? '' : 'mr-[15px]'}>
						<UpgradeIcon />
					</div>
					{!collapsed && (
						<span>
							{__('Upgrade Plan', 'quillbooking')}
						</span>
					)}
				</a>
			),
			style: { paddingLeft: '0px' },
		});
	}

	return (
		<div className={`quillbooking-navbar ${collapsed ? 'collapsed' : ''}`}>
			{/* Custom Toggle Button outside of Menu component */}
			<Button
				onClick={toggleCollapsed}
				className="navbar-toggle-button"
				style={{
					cursor: 'pointer',
					width: !collapsed ? '32px' : '30px',
					height: '32px',
					padding: '5px',
					border: '1px solid #F1F1F2',
					position: 'absolute',
					top: '10px',
					right: '-15px',
					backgroundColor: 'white',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10,
				}}
			>
				{collapsed ? (
					<LuArrowRightToLine size={18} className="text-[#A1A5B7]" />
				) : (
					<ToggleIcon />
				)}
			</Button>

			<Menu
				className="custom-menu"
				onClick={onClick}
				selectedKeys={[selectedKey]}
				mode="inline"
				//inlineCollapsed={collapsed}
				items={menuItems}
			/>
		</div>
	);
};

export default NavBar;
