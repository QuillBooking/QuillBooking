/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import { useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import ConnectionCard from './connection-card/index';
import { NoticeBanner, SelectionCard } from '@quillbooking/components';
import type { NoticeMessage } from '@quillbooking/types';
import IntegrationsShimmerLoader from '../../shimmer-loader';

const Automation: React.FC = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const [integrations, setIntegrations] = useState(() => {
		const availableIntegrations = Object.entries(
			ConfigAPI.getIntegrations() || {}
		)
			.filter(([key]) => key === 'zapier')
			.map(([key, integration]) => ({
				id: key,
				...integration,
			}));

		console.log(
			'Available Automation Integrations:',
			availableIntegrations
		);

		return availableIntegrations;
	});
	const [isLoading, setIsLoading] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Use a ref to track if we're currently updating the URL to prevent loops
	const isUpdatingUrl = useRef(false);
	// Use a ref to store the last active tab to prevent redundant updates
	const lastActiveTabRef = useRef<string | null>(null);

	// Handle URL parameters for tab and subtab
	useEffect(() => {
		const handleURLChange = () => {
			// If we're currently updating the URL, don't respond to the URL change
			if (isUpdatingUrl.current) {
				return;
			}

			const urlParams = new URLSearchParams(window.location.search);
			const tabParam = urlParams.get('tab');
			const subtabParam = urlParams.get('subtab');

			// If we're in the automation tab and have a subtab, set it as active
			// Only update activeTab if it's different from the current subtab to prevent infinite loops
			if (
				tabParam === 'automation' &&
				subtabParam &&
				activeTab !== subtabParam &&
				lastActiveTabRef.current !== subtabParam
			) {
				lastActiveTabRef.current = subtabParam;
				setActiveTab(subtabParam);
			} else if (integrations.length > 0 && !activeTab) {
				// Otherwise set first integration as default
				const defaultTab = integrations[0].id;
				lastActiveTabRef.current = defaultTab;
				setActiveTab(defaultTab);

				// Initialize URL parameters if they don't exist
				if (tabParam === 'automation' && !subtabParam && defaultTab) {
					try {
						isUpdatingUrl.current = true;
						const newUrlParams = new URLSearchParams(
							window.location.search
						);
						newUrlParams.set('subtab', defaultTab);
						const newUrl = `${window.location.pathname}?${newUrlParams.toString()}`;
						window.history.pushState({}, '', newUrl);
					} finally {
						// Always reset the flag when done
						setTimeout(() => {
							isUpdatingUrl.current = false;
						}, 0);
					}
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
		// Don't update if the tab is already active
		if (activeTab === newTab || lastActiveTabRef.current === newTab) {
			return;
		}

		// Update our refs and state
		lastActiveTabRef.current = newTab;
		setActiveTab(newTab);

		// Mark that we're updating the URL to prevent loops
		try {
			isUpdatingUrl.current = true;

			// Update only the subtab parameter while preserving other URL parameters
			const urlParams = new URLSearchParams(window.location.search);

			// Make sure we have the tab parameter set properly first
			if (
				!urlParams.has('tab') ||
				urlParams.get('tab') !== 'automation'
			) {
				urlParams.set('tab', 'automation');
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
			// Include a flag to indicate this event was triggered by this component
			window.dispatchEvent(
				new CustomEvent('quillbooking-tab-changed', {
					detail: {
						tab: 'automation',
						subtab: newTab,
						source: 'automation-component',
					},
				})
			);
		} finally {
			// Always reset the flag when done, using setTimeout to ensure it happens after event processing
			setTimeout(() => {
				isUpdatingUrl.current = false;
			}, 0);
		}
	};

	if (isLoading) {
		return <IntegrationsShimmerLoader />;
	}

	// Handle case when no integrations are available
	if (integrations.length === 0) {
		return (
			<div className="quillbooking-automation w-full">
				<div className="text-center py-8">
					<p className="text-gray-600">
						{__(
							'No automation integrations available. Please contact your administrator.',
							'quillbooking'
						)}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="quillbooking-automation grid grid-cols-2 gap-5 w-full">
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

export default Automation;
