/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card } from 'antd';
/**
 * Internal dependencies
 */
import {
	CardHeader,
	SmsNotificationIcon,
	NoticeComponent,
	NotificationRow,
} from '@quillbooking/components';
import { NotificationType } from 'client/types';

interface SmsTabsProps {
	isNoticeVisible: boolean;
	setNoticeVisible: (visible: boolean) => void;
	notificationSettings: Record<string, NotificationType>;
	editingKey: string | null;
	onSelect: (key: string) => void; // Only accepts string, not null
}

const SmsTabs: React.FC<SmsTabsProps> = ({
	isNoticeVisible,
	setNoticeVisible,
	notificationSettings,
	editingKey,
	onSelect,
}) => {
	return (
		<Card>
			<CardHeader
				title={__('Sms Notification', 'quillbooking')}
				description={__(
					'Customize the sms notifications sent to attendees and organizers',
					'quillbooking'
				)}
				icon={<SmsNotificationIcon />}
			/>
			<div className="mt-4">
				<NoticeComponent
					isNoticeVisible={isNoticeVisible}
					setNoticeVisible={setNoticeVisible}
				/>

				{notificationSettings &&
					Object.entries(notificationSettings).map(([key, notification]) => (
						<NotificationRow
							key={key}
							description={__(
								'This SMS will be sent to the attendee if phone number is provided during booking.',
								'quillbooking'
							)}
							noticationKey={key}
							changedKey={editingKey}
							setEditingKey={(key: string | null) => {
								key && editingKey !== key && onSelect(key)
							}}
							notification={notification as NotificationType}
						/>
					))}
			</div>
		</Card>
	);
};

export default SmsTabs;