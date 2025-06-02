import { ProTab, WebhookListIcon } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const WebhookFeedsTab: React.FC = () => {
	return applyFilters(
		'quillbooking.event.webhook_feeds_tab',
		<ProTab
			title={__('Webhooks Feeds List', 'quillbooking')}
			description={__(
				'View, delete and edit Webhooks Feeds List',
				'quillbooking'
			)}
			icon={<WebhookListIcon />}
		/>
	) as React.ReactNode;
};

export default WebhookFeedsTab;
