/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import SelectionCard from './selection-card';
import ConnectionCard from './connection-card';
import { NoticeBanner } from '@quillbooking/components';
import type { NoticeMessage } from '@quillbooking/client';
import IntegrationsShimmerLoader from '../../shimmer-loader';

const ConferencingCalendars: React.FC = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const [integrations, setIntegrations] = useState(() =>
		Object.entries(ConfigAPI.getIntegrations())
			.filter(([key]) => key !== 'twilio')
			.map(([key, integration]) => ({
				id: key,
				...integration,
			}))
	);
	const [isLoading, setIsLoading] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Handle URL parameters for tab and subtab
	useEffect(() => {
		const handleURLChange = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const tabParam = urlParams.get('tab');
			const subtabParam = urlParams.get('subtab');

			// If we're in the conferencing-calendars tab and have a subtab, set it as active
			if (tabParam === 'conferencing-calendars' && subtabParam) {
				setActiveTab(subtabParam);
			} else if (integrations.length > 0 && !activeTab) {
				// Otherwise set first integration as default
				setActiveTab(integrations[0].id);

				// Initialize URL parameters if they don't exist
				if (
					tabParam === 'conferencing-calendars' &&
					!subtabParam &&
					integrations[0]?.id
				) {
					const newUrlParams = new URLSearchParams(
						window.location.search
					);
					newUrlParams.set('subtab', integrations[0].id);
					const newUrl = `${window.location.pathname}?${newUrlParams.toString()}`;
					window.history.pushState({}, '', newUrl);
				}
			}
		};

		// Initial setup
		handleURLChange();

		// Add event listener for URL changes
		window.addEventListener('popstate', handleURLChange);

		// Clean up
		return () => {
			window.removeEventListener('popstate', handleURLChange);
		};
	}, [integrations, activeTab]);

	// Handle tab change
	const handleTabChange = (newTab: string) => {
		setActiveTab(newTab);

		// Update only the subtab parameter while preserving other URL parameters
		const urlParams = new URLSearchParams(window.location.search);

		// Make sure we have the tab parameter set properly first
		if (
			!urlParams.has('tab') ||
			urlParams.get('tab') !== 'conferencing-calendars'
		) {
			urlParams.set('tab', 'conferencing-calendars');
		}

		// Now set the subtab parameter
		urlParams.set('subtab', newTab);

		// Keep the current URL path and only update the search params
		const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

		// Use navigate to update URL or fallback to history API
		if (navigate) {
			navigate(newUrl, { replace: true });
		} else {
			window.history.pushState({}, '', newUrl);
		}

		// Dispatch a custom event to notify other components about the tab change
		window.dispatchEvent(
			new CustomEvent('quillbooking-tab-changed', {
				detail: { tab: 'conferencing-calendars', subtab: newTab },
			})
		);
	};

	if (isLoading) {
		return <IntegrationsShimmerLoader />;
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
