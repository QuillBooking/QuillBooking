import { Card } from 'antd';
import {
	CardHeader,
	EmailNotificationIcon,
	NoticeComponent,
	NotificationRow,
} from '@quillbooking/components';
import { __ } from '@wordpress/i18n';
import { NotificationType } from 'client/types';

interface EmailTabsProps {
	isNoticeVisible: boolean;
	setNoticeVisible: (visible: boolean) => void;
	notificationSettings: Record<string, NotificationType>;
	setEditingKey: (key: string | null) => void;
	editingKey: string | null;
}
const EmailTabs: React.FC<EmailTabsProps> = ({
	isNoticeVisible,
	setNoticeVisible,
	notificationSettings,
	setEditingKey,
	editingKey,
}) => {
  console.log('adfasdfasdfasdfasdfasdfasdf', editingKey);
	return (
		<Card>
			<CardHeader
				title={__('Email Notification', 'quillbooking')}
				description={__(
					'Customize the email notifications sent to attendees and organizers',
					'quillbooking'
				)}
				icon={<EmailNotificationIcon />}
			/>
			<div className="mt-4">
				<NoticeComponent
					isNoticeVisible={isNoticeVisible}
					setNoticeVisible={setNoticeVisible}
				/>

				{notificationSettings &&
					Object.entries(notificationSettings).map(
						([key, notification], index) => {
							if (index >= 8) return null;
							return (
								<NotificationRow
									description={__(
										'This SMS will be sent to the attendee if phone number is provided during booking.',
										'quillbooking'
									)}
									noticationKey={key}
									changedKey={editingKey}
									setEditingKey={setEditingKey}
									notification={
										notification as NotificationType
									}
								/>
							);
						}
					)}
			</div>
		</Card>
	);
};

export default EmailTabs;
