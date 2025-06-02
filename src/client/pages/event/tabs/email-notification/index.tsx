import { EmailNotificationIcon, ProTab } from '@quillbooking/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const EmailNotification: React.FC = () => {
	return applyFilters(
		'quillbooking.event.email_notification_tab',
		<ProTab
			title={__('Email Notification', 'quillbooking')}
			description={__(
				'Customize the Email notifications sent to attendees and organizers',
				'quillbooking'
			)}
			icon={<EmailNotificationIcon />}
		/>
	) as React.ReactNode;
};

export default EmailNotification;
