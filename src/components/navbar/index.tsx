/**
 * QuillCRM dependencies
 */
import { getAdminPages, useNavigate, getToLink } from '@quillbooking/navigation';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import type { MenuProps } from 'antd';
import { Menu } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';

const NavBar: React.FC = () => {
	const navigate = useNavigate();
	const [selectedKey, setSelectedKey] = useState('home');
	const pages = getAdminPages();
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

	return (
		<div className="quillbooking-navbar">
			<Menu
				onClick={onClick}
				selectedKeys={[selectedKey]}
				mode="horizontal"
				items={items}
			/>
		</div>
	);
};

export default NavBar;
