/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import './style.scss';
import { useApi } from '@quillbooking/hooks';
import ConfigAPI from '@quillbooking/config';
import IntegrationDetailsPage from './integration';
import {
	AdvancedSettingsIcon,
	CardHeader,
	NoticeBanner,
} from '@quillbooking/components';
import { NoticeMessage } from '@quillbooking/client';
import SelectionCard from '../../../integrations/tabs/conferencing-calendars/selection-card';

const IntegrationCards: React.FC<{
	hasSelectedCalendar: boolean;
	hasAccounts: boolean;
	setHasSelectedCalendar: (hasSelectedCalendar: boolean) => void;
	setHasAccounts: (hasAccounts: boolean) => void;
}> = ({
	hasSelectedCalendar,
	hasAccounts,
	setHasSelectedCalendar,
	setHasAccounts,
}) => {
	const { id } = useParams<{
		id: string;
	}>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const integrations = Object.entries(ConfigAPI.getIntegrations())
		.filter(([key]) => key !== 'twilio')
		.map(([key, integration]) => ({
			id: key,
			...integration,
		}));
	const { loading } = useApi();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Handle URL parameters for tab and subtab
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get('tab');
		const subtabParam = urlParams.get('subtab');

		// If we're in the integrations tab and have a subtab, set it as active
		if (tabParam === 'integrations' && subtabParam) {
			setActiveTab(subtabParam);
		} else if (integrations.length > 0 && !activeTab) {
			// Otherwise set first integration as default
			setActiveTab(integrations[0].id);
		}
		if (activeTab == 'zoom') {
			setHasSelectedCalendar(true);
		}
	}, [integrations, activeTab]);

	// Handle tab change
	const handleTabChange = (newTab: string) => {
		// If we have accounts but no calendar selected, prevent tab change
		if (hasAccounts && !hasSelectedCalendar) {
			window.alert(
				__(
					'Please select a remote calendar before changing tabs.',
					'quillbooking'
				)
			);
			return;
		}

		setActiveTab(newTab);
		// Update only the subtab parameter while preserving other URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set('subtab', newTab);
		// Keep the current URL path and only update the search params
		const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
		window.history.pushState({}, '', newUrl);
	};

	// Find the active integration
	const activeIntegration = activeTab
		? integrations.find((int) => int.id === activeTab)
		: null;

	return (
		<div className="quillbooking-integrations">
			<Card>
				<CardHeader
					title={__(
						'Remote Calendar & Conferencing Sync Settings.',
						'quillbooking'
					)}
					description={__(
						'Set the Zoom account to create meeting when a event is booked and calendars to check for conflicts to prevent double bookings and add events to your remote calendar.',
						'quillbooking'
					)}
					icon={<AdvancedSettingsIcon />}
					border={false}
				/>
				<div className="quillbooking-conferencing-calendars grid grid-cols-2 gap-5 w-full">
					{notice && (
						<div className="col-span-2">
							<NoticeBanner
								notice={notice}
								closeNotice={() => setNotice(null)}
							/>
						</div>
					)}
					<SelectionCard
						integrations={integrations}
						activeTab={activeTab}
						setActiveTab={handleTabChange}
						isLoading={loading}
					/>
					{activeTab && activeIntegration && id && (
						<IntegrationDetailsPage
							integration={activeIntegration}
							setNotice={setNotice}
							calendarId={id}
							slug={activeTab}
							onCalendarSelect={setHasSelectedCalendar}
							hasAccounts={setHasAccounts}
						/>
					)}
				</div>
			</Card>
		</div>
	);
};

export default IntegrationCards;
