import { ProTab, SmsNotificationIcon } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const SmsNotificationTab: React.FC = () => {
	return applyFilters(
		'quillbooking.event.sms_notification_tab',
		<ProTab
			title={__('SMS Notification', 'quillbooking')}
			description={__(
				'Customize the SMS notifications sent to attendees and organizers',
				'quillbooking'
			)}
			icon={<SmsNotificationIcon />}
		/>
	) as React.ReactNode;
};

export default SmsNotificationTab;
