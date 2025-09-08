/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import ConfigAPI, { Integration } from '@quillbooking/config';
import ConnectionCard from './connection-card';
import { NoticeBanner, SelectionCard } from '@quillbooking/components';
import type { NoticeMessage } from '@quillbooking/types';
import IntegrationsShimmerLoader from '../../shimmer-loader';
import { useTabs } from '@quillbooking/hooks';

const ConferencingCalendars: React.FC = () => {
	const [integrations, setIntegrations] = useState(() => {
		const availableIntegrations = Object.entries(
			ConfigAPI.getIntegrations() || {}
		)
			.filter(
				([key]) =>
					key === 'google' ||
					key === 'outlook' ||
					key === 'apple' ||
					key === 'zoom'
			)
			.map(([key, integration]) => ({
				id: key,
				...(integration as Integration),
			}));

		return availableIntegrations;
	});
	const [isLoading, setIsLoading] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Get default tab from integrations
	const defaultTab = integrations.length > 0 ? integrations[0].id : 'google';
	const validTabs = integrations.map((integration) => integration.id);

	const { activeTab, handleTabChange } = useTabs({
		defaultTab,
		validTabs,
		urlParam: 'subtab',
		updateUrl: true,
		preventUrlLoops: true,
	});

	// Update activeTab when integrations change and no tab is selected
	useEffect(() => {
		if (integrations.length > 0 && !activeTab) {
			handleTabChange(integrations[0].id);
		}
	}, [integrations, activeTab, handleTabChange]);

	if (isLoading) {
		return <IntegrationsShimmerLoader />;
	}

	// Handle case when no integrations are available
	if (integrations.length === 0) {
		return (
			<div className="quillbooking-conferencing-calendars w-full">
				<div className="text-center py-8">
					<p className="text-gray-600">
						{__(
							'No integrations available. Please contact your administrator.',
							'quillbooking'
						)}
					</p>
				</div>
			</div>
		);
	}

	return (
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
				isLoading={isLoading}
			/>
			{activeTab && (
				<ConnectionCard
					slug={activeTab}
					integration={integrations.find(
						(int) => int.id === activeTab
					)}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
};

export default ConferencingCalendars;
