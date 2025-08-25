/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Radio, Flex, Input, Modal, Button } from 'antd';
const { TextArea } = Input;

/**
 * External dependencies
 */
import { NotificationType } from '@quillbooking/types';
import { Header, MergeTagModal, UrlIcon } from '@quillbooking/components';

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
	const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);
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

	// Update template.message in notifications
	const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		updateNotification({
			template: {
				...notification.template,
				message: e.target.value,
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

	const handleMentionClick = (mention: string) => {
		const newMessage = (notification.template?.message || '') + mention;
		updateNotification({
			template: {
				...notification.template,
				message: newMessage,
			},
		});
		setMergeTagModal(false);
	};

	// Check if notification exists before rendering
	if (!notification) {
		return <Card>No notification data found</Card>;
	}

	return (
		<Card style={{ marginBottom: 16 }}>
			<Flex vertical gap={10} className="w-full">
				<Flex vertical gap={8} className="w-full">
					<Flex justify="space-between" align="center">
						<span className="text-[#09090B] text-[16px] font-semibold w-[540px]">
							{__('SMS Body', 'quillbooking')}
							<span className="text-red-500">*</span>
						</span>
						<Button
							className="bg-[#EEEEEE] p-2 rounded-lg border-none shadow-none"
							onClick={() => setMergeTagModal(true)}
						>
							<UrlIcon />
						</Button>
					</Flex>
					<div className="relative">
						<TextArea
							rows={6}
							value={notification.template?.message || ''}
							onChange={handleMessageChange}
							className="w-full rounded-lg pr-10" // Add padding for the icon
						/>
					</div>
				</Flex>

				<Modal
					open={mergeTagModal}
					onCancel={() => setMergeTagModal(false)}
					footer={null}
					width={1000}
					getContainer={false}
				>
					<Flex gap={10} className="items-center border-b pb-4 mb-4">
						<div className="bg-[#EDEDED] rounded-lg p-3 mt-2">
							<UrlIcon />
						</div>
						<Header
							header={__('SMS Merge tags', 'quillbooking')}
							subHeader={__(
								'Choose your Merge tags type and Select one of them related to your input.',
								'quillbooking'
							)}
						/>
					</Flex>
					<MergeTagModal onMentionClick={handleMentionClick} />
				</Modal>

				<Flex vertical gap={10}>
					<span className="text-[#09090B] text-[16px] font-semibold">
						{__('Sender', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>

					<Radio.Group
						value={notification.template?.type || ''}
						className="text-[#3F4254] font-semibold flex gap-8"
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
