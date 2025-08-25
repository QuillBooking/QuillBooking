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
	NoticeComponent,
	NotificationRow,
} from '@quillbooking/components';
import { NotificationType } from '@quillbooking/types';

interface EmailTabsProps {
	isNoticeVisible: boolean;
	setNoticeVisible: (visible: boolean) => void;
	notificationSettings: Record<string, NotificationType>;
	editingKey: string | null;
	onSelect: (key: string) => void; // Only accepts string, not null
}
const EmailTabs: React.FC<EmailTabsProps> = ({
	isNoticeVisible,
	setNoticeVisible,
	notificationSettings,
	editingKey,
	onSelect,
}) => {
	/**
	 * Get description for each notification type
	 *
	 * @param {string} key - Notification key
	 * @returns {string} Description
	 */
	const getNotificationDescription = (key: string): string => {
		switch (key) {
			case 'attendee_confirmation':
				return __(
					'Automatically sent to attendees when their booking is confirmed. Includes booking details, location, and cancellation options.',
					'quillbooking'
				);
			case 'organizer_notification':
				return __(
					'Notifies you immediately when a new booking is made. Contains attendee information and booking details.',
					'quillbooking'
				);
			case 'attendee_reminder':
				return __(
					'Reminds attendees about their upcoming appointment. Can be scheduled to send at specific times before the event.',
					'quillbooking'
				);
			case 'organizer_reminder':
				return __(
					'Sends you a reminder about upcoming appointments. Customizable timing to help you prepare for scheduled events.',
					'quillbooking'
				);
			case 'attendee_cancelled_organizer':
				return __(
					'Alerts you when an attendee cancels their booking. Includes cancellation reason and original booking details.',
					'quillbooking'
				);
			case 'organizer_cancelled_attendee':
				return __(
					'Informs attendees when you cancel their booking. Helps maintain good communication and professionalism.',
					'quillbooking'
				);
			case 'attendee_rescheduled_organizer':
				return __(
					'Notifies you when an attendee reschedules. Shows both original and new booking times for easy reference.',
					'quillbooking'
				);
			case 'organizer_rescheduled_attendee':
				return __(
					'Confirms to attendees when you reschedule their appointment. Includes updated time and location details.',
					'quillbooking'
				);
			default:
				return __(
					'This email will be sent to the attendee if email is provided during booking.',
					'quillbooking'
				);
		}
	};

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
									description={getNotificationDescription(
										key
									)}
									noticationKey={key}
									changedKey={editingKey}
									setEditingKey={(key: string | null) => {
										key &&
											editingKey !== key &&
											onSelect(key);
									}}
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
