import { ProTab, WebhookListIcon } from '@quillbooking/components';
import { forwardRef } from 'react';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

interface EventWebhookProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

interface EventWebhookHandle {
	saveSettings: () => Promise<void>;
}

const WebhookFeedsTab = forwardRef<EventWebhookHandle, EventWebhookProps>(
	({ disabled, setDisabled }, ref) => {
		return applyFilters(
			'quillbooking.event.webhook_feeds_tab',
			<ProTab
				title={__('Webhooks Feeds List', 'quillbooking')}
				description={__(
					'View, delete and edit Webhooks Feeds List',
					'quillbooking'
				)}
				icon={<WebhookListIcon />}
			/>,
			{
				disabled,
				setDisabled,
				ref,
			}
		) as React.ReactNode;
	}
);

export default WebhookFeedsTab;
