/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card } from 'antd';
import { useParams } from 'react-router-dom';

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

const IntegrationCards: React.FC = () => {
	const { id } = useParams<{
		id: string;
	}>();
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const integrations = Object.entries(ConfigAPI.getIntegrations())
		.filter(([key]) => key !== 'twilio')
		.map(([key, integration]) => ({
			id: key,
			...integration,
		}));
	const { loading } = useApi();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	useEffect(() => {
		if (integrations.length > 0 && !activeTab) {
			setActiveTab(integrations[0].id);
		}
	}, [integrations, activeTab]);

	// Find the active integration
	const activeIntegration = activeTab 
		? integrations.find(int => int.id === activeTab) 
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
						setActiveTab={setActiveTab}
						isLoading={loading}
					/>
					{activeTab && activeIntegration && id && (
						<IntegrationDetailsPage
							integration={activeIntegration}
							calendarId={id}
							slug={activeTab}
						/>
					)}
				</div>
			</Card>
		</div>
	);
};

export default IntegrationCards;
