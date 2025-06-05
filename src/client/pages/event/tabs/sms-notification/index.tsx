import { ProTab, SmsNotificationIcon } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';

export interface SmsNotificationsTabHandle {
	saveSettings: () => Promise<void>;
}

interface SmsNotificationsTabProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

const SmsNotificationTab = forwardRef<
	SmsNotificationsTabHandle,
	SmsNotificationsTabProps
>(({ disabled, setDisabled }, ref) => {

	return applyFilters(
		'quillbooking.event.sms_notification_tab',
		<ProTab
			title={__('SMS Notification', 'quillbooking')}
			description={__(
				'Customize the SMS notifications sent to attendees and organizers',
				'quillbooking'
			)}
			icon={<SmsNotificationIcon />}
		/>,
		{
			disabled,
			setDisabled,
			ref,
		}
	) as React.ReactNode;
});

SmsNotificationTab.displayName = 'SmsNotificationTab';

export default SmsNotificationTab;