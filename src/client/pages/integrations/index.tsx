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
import {
	Header,
	SettingsPaymentIcon,
	SmsNotiIcon,
	TabButtons,
	UpcomingCalendarIcon,
	AutomationIcon,
} from '@quillbooking/components';
import {
	ConferencingCalendars,
	Payments,
	SMSIntegration,
	Automation,
} from './tabs';
import { useCurrentUser, useNavigate, useNotice } from '@quillbooking/hooks';

/**
 * Integration component
 * Parent component for all integrations tabs
 */

const Integrations: React.FC = () => {
	const { isAdmin } = useCurrentUser();
	const canManageAllCalendars = useCurrentUser().hasCapability(
		'quillbooking_manage_all_calendars'
	);
	const [activeTab, setActiveTab] = useState<string>(
		'conferencing-calendars'
	);
	const navigate = useNavigate();
	const { errorNotice } = useNotice();

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
		// Get the tab from URL search params on component mount
		const searchParams = new URLSearchParams(window.location.search);

		const tab = searchParams.get('tab');
		if (
			tab &&
			[
				'conferencing-calendars',
				'sms-integration',
				'payments',
				'automation',
			].includes(tab)
		) {
			setActiveTab(tab);
		}
	}, []);

	const handleTabChange = (key: string) => {
		setActiveTab(key);
		// Update URL search params when tab changes
		const searchParams = new URLSearchParams(window.location.search);
		// remove if have subtab
		if (searchParams.has('subtab')) {
			searchParams.delete('subtab');
		}
		searchParams.set('tab', key);
		const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
		window.history.pushState({}, '', newUrl);
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'conferencing-calendars':
				return <ConferencingCalendars />;
			case 'sms-integration':
				return <SMSIntegration />;
			case 'payments':
				return <Payments />;
			case 'automation':
				return <Automation />;
			default:
				return <ConferencingCalendars />;
		}
	};

	const items = [
		{
			key: 'conferencing-calendars',
			label: __('Conferencing and Calendars', 'quillbooking'),
			icon: <UpcomingCalendarIcon width={20} height={20} />,
		},
	];

	if (canManageAllCalendars) {
		items.push(
			{
				key: 'sms-integration',
				label: __('SMS Integration', 'quillbooking'),
				icon: <SmsNotiIcon width={20} height={20} />,
			},
			{
				key: 'payments',
				label: __('Payments', 'quillbooking'),
				icon: <SettingsPaymentIcon width={20} height={20} />,
			},
			{
				key: 'automation',
				label: __('Automation', 'quillbooking'),
				icon: <AutomationIcon width={20} height={20} />,
			}
		);
	}

	return (
		<div className="quillbooking-integrations-page">
			<Header
				header={__('Integrations', 'quillbooking')}
				subHeader={__(
					'Connect Quill Booking to your tools and apps to enhance your scheduling automations.',
					'quillbooking'
				)}
			/>
			<Flex vertical gap={20} className="integrations-container">
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

export default Integrations;
