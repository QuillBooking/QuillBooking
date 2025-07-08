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
	/**
	 * Get description for each SMS notification type
	 *
	 * @param {string} key - Notification key
	 * @returns {string} Description
	 */
	const getNotificationDescription = (key: string): string => {
		switch (key) {
			case 'attendee_confirmation':
				return __(
					'Instant SMS confirmation to attendees with booking details. Brief message with essential information and link to full details.',
					'quillbooking'
				);
			case 'organizer_notification':
				return __(
					'Real-time SMS alert when new bookings are made. Quick notification with attendee name and appointment time.',
					'quillbooking'
				);
			case 'attendee_reminder':
				return __(
					'Timely SMS reminder to attendees before appointments. Configurable timing to reduce no-shows and improve attendance.',
					'quillbooking'
				);
			case 'organizer_reminder':
				return __(
					'SMS reminder for your upcoming appointments. Brief notification to help you prepare and stay on schedule.',
					'quillbooking'
				);
			case 'attendee_cancelled_organizer':
				return __(
					'Instant notification when attendees cancel bookings. Allows quick rescheduling of your newly available time slot.',
					'quillbooking'
				);
			case 'organizer_cancelled_attendee':
				return __(
					'Prompt notification to attendees when you cancel. Maintains professional communication and offers rebooking options.',
					'quillbooking'
				);
			case 'attendee_rescheduled_organizer':
				return __(
					'Immediate alert when attendees reschedule. Contains both original and new appointment times for easy reference.',
					'quillbooking'
				);
			case 'organizer_rescheduled_attendee':
				return __(
					'Quick update to attendees when you change appointment times. Confirms new details and requests acknowledgment.',
					'quillbooking'
				);
			default:
				return __(
					'SMS notification sent to attendees with phone numbers. Concise message with essential booking information.',
					'quillbooking'
				);
		}
	};

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
					Object.entries(notificationSettings).map(
						([key, notification]) => (
							<NotificationRow
								key={key}
								description={getNotificationDescription(key)}
								noticationKey={key}
								changedKey={editingKey}
								setEditingKey={(key: string | null) => {
									key && editingKey !== key && onSelect(key);
								}}
								notification={notification as NotificationType}
							/>
						)
					)}
			</div>
		</Card>
	);
};

export default SmsTabs;
