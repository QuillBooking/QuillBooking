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
	EmailNotificationIcon,
	NotificationRow,
} from '@quillbooking/components';
import { NotificationType } from 'client/types';

interface OtherNotificationsProps {
	notificationSettings: Record<string, NotificationType>;
	setEditingKey: (key: string | null) => void;
	editingKey: string | null;
}

const OtherNotifications: React.FC<OtherNotificationsProps> = ({
	notificationSettings,
	setEditingKey,
	editingKey,
}) => {
	return (
		<Card>
			<CardHeader
				title={__('Other Notification', 'quillbooking')}
				description={__(
					'Optimize your email notifications for confirmations and declines',
					'quillbooking'
				)}
				icon={<EmailNotificationIcon />}
			/>
			{notificationSettings &&
				Object.entries(notificationSettings).map(
					([key, _notification], index) => {
						if (index < 8) return null;

						return (
							<NotificationRow
								changedKey={editingKey}
								setEditingKey={setEditingKey}
								noticationKey={key}
								description={__(
									'This SMS will be sent to the attendee if phone number is provided during booking.',
									'quillbooking'
								)}
								notification={_notification as NotificationType}
							/>
						);
					}
				)}
		</Card>
	);
};

export default OtherNotifications;
