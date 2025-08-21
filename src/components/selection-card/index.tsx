/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import { NoticeComponent } from '@quillbooking/components';
import type { Integration } from '@quillbooking/config';

// Define additional properties that might be on integrations in this context
type IntegrationWithId = Integration & {
	id?: string;
	title?: string;
};

export interface SelectionCardProps {
	integrations: IntegrationWithId[];
	activeTab: string | null;
	setActiveTab: (tab: string) => void;
	isLoading?: boolean;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
	integrations,
	activeTab,
	setActiveTab,
	isLoading = false,
}) => {
	const [isNoticeVisible, setNoticeVisible] = useState(true);

	// Listen for URL parameter changes
	useEffect(() => {
		const handleURLChange = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const subtabParam = urlParams.get('subtab');

			if (subtabParam && subtabParam !== activeTab) {
				// Verify that the subtab exists in our integrations
				const subtabExists = integrations.some(
					(integration) =>
						getIntegrationId(integration) === subtabParam
				);

				if (subtabExists) {
					setActiveTab(subtabParam);
				}
			}
		};

		// Listen for URL changes
		window.addEventListener('popstate', handleURLChange);

		// Listen for custom tab change events
		window.addEventListener('quillbooking-tab-changed', handleURLChange);

		return () => {
			window.removeEventListener('popstate', handleURLChange);
			window.removeEventListener(
				'quillbooking-tab-changed',
				handleURLChange
			);
		};
	}, [activeTab, integrations, setActiveTab]);

	// Helper to safely get ID using a fallback approach
	const getIntegrationId = (integration: IntegrationWithId): string => {
		return (
			integration.id ||
			integration.name?.toLowerCase().replace(/\s+/g, '-') ||
			''
		);
	};

	return (
		<Card className="rounded-lg mb-6 w-full">
			<Flex vertical gap={15}>
				<NoticeComponent
					isNoticeVisible={isNoticeVisible}
					setNoticeVisible={setNoticeVisible}
				/>
				{isLoading ? (
					<Skeleton active paragraph={{ rows: 2 }} />
				) : (
					integrations.map((integration) => {
						const id = getIntegrationId(integration);
						const isActive = activeTab === id;

						return (
							<Card
								key={id}
								className={`w-full cursor-pointer ${isActive ? 'bg-color-secondary border-color-primary' : ''}`}
								onClick={() => {
									if (activeTab !== id) {
										setActiveTab(id);
									}
								}}
							>
								<Flex gap={18} align="center">
									<img
										src={integration.icon}
										alt={`${id}.png`}
										className="size-12"
									/>
									<Flex vertical gap={2}>
										<div
											className={`text-base font-semibold ${isActive ? 'text-color-primary' : 'text-[#3F4254]'}`}
										>
											{integration.name ||
												__(
													id.charAt(0).toUpperCase() +
														id.slice(1),
													'quillbooking'
												)}
										</div>
										<div
											className={`text-xs ${isActive ? 'text-color-primary' : 'text-[#9197A4]'}`}
										>
											{integration.description ||
												__(
													'Connect your calendar for scheduling.',
													'quillbooking'
												)}
										</div>
									</Flex>
								</Flex>
							</Card>
						);
					})
				)}
			</Flex>
		</Card>
	);
};

export default SelectionCard;
