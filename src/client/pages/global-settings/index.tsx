/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Flex } from 'antd';

/**
 * Internal dependencies
 */
import { useNavigate, useCurrentUser, useNotice } from '@quillbooking/hooks';
import {
	GeneralSettingsTab,
	TeamTab,
	PaymentsTab,
	LicenseTab,
	AdvancedModulesTab,
} from './tabs';
import {
	AdvancedModulesIcon,
	Header,
	LicenseIcon,
	SettingsIcon,
	SettingsPaymentIcon,
	SettingsTeamIcon,
	TabButtons,
} from '@quillbooking/components';

/**
 * GlobalSettings component
 * Parent component for all settings tabs
 */
const GlobalSettings: React.FC = () => {
	const navigate = useNavigate();
	const { isAdmin } = useCurrentUser();
	const { errorNotice } = useNotice();
	const [activeTab, setActiveTab] = useState<string>('general');

	useEffect(() => {
		if (!isAdmin()) {
			errorNotice(
				__(
					'You do not have permission to access this page',
					'quillbooking'
				)
			);
			navigate('calendars');
			return;
		}
	}, []);

	if (!isAdmin()) {
		return null;
	}

	const handleTabChange = (key: string) => {
		setActiveTab(key);
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'general':
				return <GeneralSettingsTab />;
			case 'team':
				return <TeamTab />;
			case 'licenses':
				return <LicenseTab />;
			case 'advanced':
				return <AdvancedModulesTab />;
			case 'payments':
				return <PaymentsTab />;
			default:
				return <GeneralSettingsTab />;
		}
	};

	const items = [
		{
			key: 'general',
			label: __('General', 'quillbooking'),
			icon: <SettingsIcon width={20} height={20} />,
		},
		{
			key: 'team',
			label: __('Team', 'quillbooking'),
			icon: <SettingsTeamIcon />,
		},
		{
			key: 'licenses',
			label: __('License', 'quillbooking'),
			icon: <LicenseIcon />,
		},
		{
			key: 'advanced',
			label: __('Recommended Plugins', 'quillbooking'),
			icon: <AdvancedModulesIcon />,
		},
		{
			key: 'payments',
			label: __('Payments', 'quillbooking'),
			icon: <SettingsPaymentIcon />,
		},
	];

	return (
		<div className="quillbooking-global-settings">
			<Header
				header={__('Settings', 'quillbooking')}
				subHeader={__('Global Settings', 'quillbooking')}
			/>
			<Flex vertical gap={20} className="settings-container">
				<Card className="mt-5">
					<Flex gap={15} align="center" justify="flex-start">
						{items.map(({ key, label, icon }) => (
							<Button
								key={key}
								type="text"
								onClick={() => handleTabChange(key)}
								className={`${activeTab === key ? 'bg-color-tertiary' : ''}`}
							>
								<TabButtons
									label={label}
									icon={icon}
									isActive={activeTab === key}
								/>
							</Button>
						))}
					</Flex>
				</Card>
				<Flex>{renderTabContent()}</Flex>
			</Flex>
		</div>
	);
};

export default GlobalSettings;
