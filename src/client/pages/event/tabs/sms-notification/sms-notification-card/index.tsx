/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Radio, Flex } from 'antd';

/**
 * External dependencies
 */
import { NotificationType } from '@quillbooking/client';
import { Editor } from '@quillbooking/components';

type SmsNotificationCardProps = {
	notifications: Record<string, NotificationType>;
	notificationKey: string;
	setNotifications: (notifications: Record<string, NotificationType>) => void;
	setDisabled: (disabled: boolean) => void;
};

const SmsNotificationCard: React.FC<SmsNotificationCardProps> = ({
	notifications,
	notificationKey,
	setNotifications,
	setDisabled,
}) => {
	const notification = notifications[notificationKey];

	// General function to update the notification
	const updateNotification = (changes: Partial<NotificationType>) => {
		const updatedSettings = {
			...notifications,
			[notificationKey]: {
				...notifications[notificationKey],
				...changes,
			},
		};
		setNotifications(updatedSettings);
		if (JSON.stringify(updatedSettings) !== JSON.stringify(notifications)) {
			setDisabled(false); // enable save button
		}
	};

	console.log(notification);

	// Update template.message in notifications
	const handleMessageChange = (newMessage: string) => {
		updateNotification({
			template: {
				...notification.template,
				message: newMessage,
			},
		});
	};

	const handleSenderChange = (sender: string) => {
		updateNotification({
			template: {
				...notification.template,
				type: sender,
			},
		});
	};

	// Check if notification exists before rendering
	if (!notification) {
		return <Card>No notification data found</Card>;
	}

	return (
		<Card style={{ marginBottom: 16 }}>
			<Flex vertical gap={10} className="w-full">
				<Flex vertical gap={8} className="w-full">
					<span className="text-[#09090B] text-[16px] font-semibold w-[540px]">
						{__('SMS Body', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>
					<Editor
						message={notification.template?.message || ''}
						onChange={handleMessageChange}
						type="sms"
					/>
				</Flex>
				<Flex vertical gap={10}>
					<span className="text-[#09090B] text-[16px] font-semibold">
						{__('Sender', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>

					<Radio.Group
						value={notification.template?.type || ''}
						className="text-[#3F4254] font-semibold"
						onChange={(e) => handleSenderChange(e.target.value)}
					>
						<Radio value="sms" className="custom-radio">
							{__('SMS', 'quillbooking')}
						</Radio>
						<Radio value="whatsapp" className="custom-radio">
							{__('WhatsApp', 'quillbooking')}
						</Radio>
					</Radio.Group>
				</Flex>
			</Flex>
		</Card>
	);
};

export default SmsNotificationCard;
