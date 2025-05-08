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
import {UpgradeIcon, ToggleIcon} from "@quillbooking/components";

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
				className="custom-menu"
				onClick={onClick}
				selectedKeys={[selectedKey]}
				mode="inline"
				items={[
					{
						key: "toggle-button",
						label:(
							<span onClick={() => navigate(-1)} className='cursor-pointer'>
								<ToggleIcon/>
							</span>
						),
						style: { width:"32px", height: "32px", paddingLeft:"5px", paddingRight:"5px", border:"1px solid #F1F1F2", position:"absolute", right:"-20px", backgroundColor:"white" },
						className: "navbar-toggle-button"
					},
					{
						key: "group",
						type: "group",
						children: items.map((item, index) => ({
							...item,
							key: item?.key ?? index,
							type: 'item',
							style: { paddingLeft: "15px", marginBottom:"24px" }, 
						})),
						className: "group"
					},
					{
						key: "spacer",
						label: "", 
						style: { height: "140px", pointerEvents: "none" },
					},
					{
						key: "button-item",
						className: "button-item pl-0",
						label: (
							<a className='navbar-upgrade-button' href='/'>
								<div className='mr-[15px]'>
								<UpgradeIcon />
								</div>
								<span>{__('Upgrade Plan', 'quillbooking')}</span>
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
