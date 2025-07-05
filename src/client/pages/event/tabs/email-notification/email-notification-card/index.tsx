/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Button, Modal, Input, InputNumber, Select, Flex } from 'antd';
import { ReactMultiEmail } from 'react-multi-email';
import 'react-multi-email/dist/style.css';
/**
 * Interanl dependencies
 */
import { NotificationType } from '@quillbooking/types';
import {
	Header,
	LimitsAddIcon,
	LimitsTrashIcon,
	MergeTagModal,
	UrlIcon,
	Editor,
} from '@quillbooking/components';

type EmailNotificationCardProps = {
	notifications: Record<string, NotificationType>;
	notificationKey: string;
	setNotifications: (notifications: Record<string, NotificationType>) => void;
	setDisabled: (disabled: boolean) => void;
};

const EmailNotificationCard: React.FC<EmailNotificationCardProps> = ({
	notifications,
	notificationKey,
	setNotifications,
	setDisabled,
}) => {
	const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);
	const [focused, setFocused] = useState(false);

	// Get current notification directly from the parent state
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

	// Update template.subject in notifications
	const handleSubjectChange = (newSubject: string) => {
		updateNotification({
			template: {
				...notification.template,
				subject: newSubject,
			},
		});
	};

	// Update template.message in notifications
	const handleMessageChange = (newMessage: string) => {
		updateNotification({
			template: {
				...notification.template,
				message: newMessage,
			},
		});
	};

	// Update recipients in notifications
	const handleRecipientsChange = (newRecipients: string[]) => {
		updateNotification({ recipients: newRecipients });
	};

	// Handle adding a new time
	const handleAddTime = () => {
		const newTimes = [
			...(notification.times || []),
			{ value: 15, unit: 'minutes' },
		];
		updateNotification({ times: newTimes });
	};

	// Handle removing a time
	const handleRemoveTime = (index: number) => {
		const newTimes = [...(notification.times || [])];
		newTimes.splice(index, 1);
		updateNotification({ times: newTimes });
	};

	// Handle changing a time value
	const handleTimeValueChange = (index: number, value: number) => {
		const newTimes = [...(notification.times || [])];
		newTimes[index].value = value;
		updateNotification({ times: newTimes });
	};

	// Handle changing a time unit
	const handleTimeUnitChange = (index: number, unit: string) => {
		const newTimes = [...(notification.times || [])];
		newTimes[index].unit = unit;
		updateNotification({ times: newTimes });
	};

	const handleMentionClick = (mention: string) => {
		const newSubject = (notification.template?.subject || '') + mention;
		handleSubjectChange(newSubject);
		setMergeTagModal(false);
	};

	return (
		<Card style={{ marginBottom: 16 }}>
			<Flex vertical gap={10} className="w-full">
				<div className="w-full mb-6">
					<span className="text-[#09090B] text-[16px] font-semibold">
						{__('Subject', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>
					<Input
						value={notification.template?.subject || ''}
						onChange={(e) => handleSubjectChange(e.target.value)}
						placeholder="New Booking: {{guest.full_name}} @ {{booking.start_date_time_for_host}}"
						className="h-[48px] rounded-lg mt-2 pl-[10px] pr-0 py-0"
						suffix={
							<span
								className="bg-[#EEEEEE] p-[0.7rem] rounded-r-lg"
								onClick={() => setMergeTagModal(true)}
							>
								<UrlIcon />
							</span>
						}
					/>
				</div>

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
							header={__('Subject Merge tags', 'quillbooking')}
							subHeader={__(
								'Choose your Merge tags type and Select one of them related to your input.',
								'quillbooking'
							)}
						/>
					</Flex>
					<MergeTagModal onMentionClick={handleMentionClick} />
				</Modal>

				<div className="w-full mb-5">
					<span className="text-[#09090B] text-[16px] font-semibold">
						{__('Email Body', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>
					<div className="mt-2">
						<Editor
							message={notification.template?.message || ''}
							onChange={handleMessageChange}
							type="email"
						/>
					</div>
				</div>

				<div className="w-full mb-5">
					<span className="text-[#09090B] text-[16px] font-semibold">
						{__('Additional Recipients', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>
					<ReactMultiEmail
						placeholder={__(
							'Enter email addresses separated by commas',
							'quillbooking'
						)}
						emails={notification.recipients || []}
						onChange={handleRecipientsChange}
						autoFocus={false}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						getLabel={(email, index, removeEmail) => {
							return (
								<div data-tag key={index}>
									<div data-tag-item>{email}</div>
									<span
										data-tag-handle
										onClick={() => removeEmail(index)}
									>
										×
									</span>
								</div>
							);
						}}
						className="min-h-[48px] rounded-lg"
					/>
					<span className="text-[#818181]">
						{__(
							'Provided email address will set as CC to this email notification.',
							'quillbooking'
						)}
					</span>
				</div>

				{notification.times && (
					<div className="w-full mb-5">
						<span className="text-[#09090B] text-[16px] font-semibold">
							{__('Timing', 'quillbooking')}
							<span className="text-red-500">*</span>
						</span>
						<Flex vertical gap={10} className="mt-2">
							{(notification.times || []).map((time, index) => (
								<Flex key={index} align="center" gap={10}>
									<InputNumber
										value={time.value}
										onChange={(value) =>
											handleTimeValueChange(
												index,
												value as number
											)
										}
										className="h-[48px] rounded-lg pt-2 w-16"
									/>
									<Select
										value={time.unit}
										onChange={(unit) =>
											handleTimeUnitChange(index, unit)
										}
										className="h-[48px] rounded-lg w-44"
										getPopupContainer={(trigger) =>
											trigger.parentElement
										}
										options={[
											{
												value: 'minutes',
												label: (
													<span>
														{__(
															'Minutes Before',
															'quillbooking'
														)}
													</span>
												),
											},
											{
												value: 'hours',
												label: (
													<span>
														{__(
															'Hours Before',
															'quillbooking'
														)}
													</span>
												),
											},
											{
												value: 'days',
												label: (
													<span>
														{__(
															'Days Before',
															'quillbooking'
														)}
													</span>
												),
											},
										]}
									/>

									{/* Only show Remove button if it's NOT the first item */}
									{index > 0 && (
										<Button
											onClick={() =>
												handleRemoveTime(index)
											}
											danger
											className="border-none shadow-none p-0"
										>
											<LimitsTrashIcon />
										</Button>
									)}

									{/* Only show Add button beside the first item */}
									{index === 0 && (
										<Button
											onClick={handleAddTime}
											className="border-none shadow-none p-0"
										>
											<LimitsAddIcon />
										</Button>
									)}
								</Flex>
							))}
						</Flex>
					</div>
				)}
			</Flex>
		</Card>
	);
};

export default EmailNotificationCard;
