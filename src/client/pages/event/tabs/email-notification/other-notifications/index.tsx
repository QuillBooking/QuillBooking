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
	/**
	 * Get description for each notification type
	 *
	 * @param {string} key - Notification key
	 * @returns {string} Description
	 */
	const getNotificationDescription = (key: string): string => {
		switch (key) {
			case 'host_approval':
				return __(
					'Notifies you of pending booking requests that require your approval. Includes attendee details and requested time slot.',
					'quillbooking'
				);
			case 'host_rejection':
				return __(
					'Sent to attendees when their booking request is declined. Allows you to include a personalized reason for the rejection.',
					'quillbooking'
				);
			case 'host_approved_attendee':
				return __(
					'Confirms to attendees that their booking request has been approved. Includes all booking details and calendar links.',
					'quillbooking'
				);
			case 'attendee_submitted':
				return __(
					'Acknowledges receipt of booking requests to attendees. Explains the approval process and expected response time.',
					'quillbooking'
				);
			default:
				return __(
					'This notification is sent when specific booking events occur. Customize the message to provide relevant information.',
					'quillbooking'
				);
		}
	};

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
								description={getNotificationDescription(key)}
								notification={_notification as NotificationType}
							/>
						);
					}
				)}
		</Card>
	);
};

export default OtherNotifications;
