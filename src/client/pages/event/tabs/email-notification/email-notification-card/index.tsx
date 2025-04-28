/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import {
	Card,
	Switch,
	Button,
	Modal,
	Input,
	Form,
	InputNumber,
	Typography,
	Radio,
	Select,
	Flex,
} from 'antd';

/**
 * External dependencies
 */
import { NotificationType } from '@quillbooking/client';
import { useNotice, useApi } from '@quillbooking/hooks';
import {
	Header,
	LimitsAddIcon,
	LimitsTrashIcon,
	MergeTagModal,
	UrlIcon,
	Editor,
} from '@quillbooking/components';
import { ReactMultiEmail } from 'react-multi-email';
import 'react-multi-email/dist/style.css';
import { debounce, omit } from 'lodash';

type NotificationCardProps = {
	notifications: Record<string, NotificationType>;
	notificationKey: string;
	setNotifications: (notifications: Record<string, NotificationType>) => void;
};

const EmailNotificationCard: React.FC<NotificationCardProps> = ({
	notifications,
	notificationKey,
	setNotifications,
}) => {
	const [form] = Form.useForm();
	const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);
	const [focused, setFocused] = useState(false);
	const notification = notifications[notificationKey];

	// Initialize form with notification data when component mounts or notification changes
	useEffect(() => {
		if (notification) {
			// Initialize emails state if recipients exist
			// if (notification.recipients && Array.isArray(notification.recipients)) {
			//     setEmails(notification.recipients);
			// }

			// Prepare the form values with proper structure
			const formValues = {
				template: {
					subject: notification.template?.subject || '',
					message: notification.template?.message || '',
				},
				times: notification.times?.map((time) => ({
					value: time.value,
					unit: time.unit,
				})) || [{ value: 15, unit: 'minutes' }],
			};

			form.setFieldsValue(formValues);
		}
	}, []);

	const handleMentionClick = (mention: string) => {
		const currentValue = form.getFieldValue(['template', 'subject']) || '';
		form.setFieldsValue({
			template: {
				subject: currentValue + mention,
			},
		});
		setMergeTagModal(false);

		// Mark as needing to save
		const updatedValues = form.getFieldsValue();
		handleFormChange(updatedValues);
	};

	// Handle form field changes
	const handleFormChange = useMemo(
		() =>
			debounce((changedValues) => {
				console.log('changed values', changedValues);
				console.log('notifications', notifications[notificationKey]);

				const updatedSettings = {
					...notifications,
					[notificationKey]: {
						...notifications[notificationKey],
                        ...omit(changedValues, ['template']),
                        template: {
                            ...notifications[notificationKey].template,
                            ...changedValues?.template,
                        },
					},
				};
				setNotifications(updatedSettings);
				console.log('key ', notificationKey);
			}, 500),
		[notificationKey]
	);

	const renderModalContent = () => (
		<Form
			form={form}
			layout="vertical"
			className="w-full"
			initialValues={{
				template: {
					subject: notification?.template?.subject || '',
					message: notification?.template?.message || '',
				},
				times: notification?.times?.length
					? notification.times.map((time) => ({
							value: time.value,
							unit: time.unit,
						}))
					: [{ value: 15, unit: 'minutes' }],
			}}
			onValuesChange={handleFormChange}
			//onFieldsChange={onFieldsChange}
		>
			<Form.Item
				name={['template', 'subject']}
				label={
					<span className="text-[#09090B] text-[16px] font-semibold">
						{__('Subject', 'quillbooking')}
						<span className="text-red-500">*</span>
					</span>
				}
				rules={[
					{
						required: true,
						message: __('Subject is required', 'quillbooking'),
					},
				]}
				className="w-full mb-6"
			>
				<Input
					placeholder="New Booking: {{guest.full_name}} @ {{booking.start_date_time_for_host}}"
					className="h-[48px] rounded-lg"
					suffix={
						<span
							className="bg-[#EEEEEE] p-[0.7rem] rounded-r-lg"
							onClick={() => setMergeTagModal(true)}
						>
							<UrlIcon />
						</span>
					}
					style={{ padding: '0 0 0 10px' }}
				/>
			</Form.Item>
			<Modal
				open={mergeTagModal}
				onCancel={() => setMergeTagModal(false)}
				footer={null}
				width={700}
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
			<Form.Item
				name={['template', 'message']}
				rules={[
					{
						required: true,
						message: __('Message is required', 'quillbooking'),
					},
				]}
				className="w-full mb-5"
			>
				<span className="text-[#09090B] text-[16px] font-semibold">
					{__('Email Body', 'quillbooking')}
					<span className="text-red-500">*</span>
				</span>
				<div className="mt-2">
					<Editor
						message={notification?.template?.message || ''}
						onChange={(content) => {
							handleFormChange({
								template: { message: content },
                            
							});
						}}
						type='email'
					/>
				</div>
			</Form.Item>
			<Form.Item className="w-full mb-5">
				<span className="text-[#09090B] text-[16px] font-semibold">
					{__('Additional Recipients', 'quillbooking')}
					<span className="text-red-500">*</span>
				</span>
				<ReactMultiEmail
					placeholder={__(
						'Enter email addresses separated by commas',
						'quillbooking'
					)}
					emails={notification.recipients}
					onChange={(_emails: string[]) => {
						handleFormChange({ recipients: _emails });
					}}
					autoFocus={false}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					delimiter={','}
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
			</Form.Item>

			{notification.times && (
				<Form.Item
					label={
						<span className="text-[#09090B] text-[16px] font-semibold">
							{__('Timing', 'quillbooking')}
							<span className="text-red-500">*</span>
						</span>
					}
				>
					<Form.List name="times">
						{(fields, { add, remove }) => (
							<Flex vertical gap={10}>
								{fields.map(
									({ key, name, ...restField }, index) => (
										<Flex key={key} align="center" gap={10}>
											<Form.Item
												{...restField}
												name={[name, 'value']}
												rules={[
													{
														required: true,
														message: __(
															'Value is required',
															'quillbooking'
														),
													},
												]}
												style={{ marginBottom: 0 }}
											>
												<InputNumber className="h-[48px] rounded-lg pt-2 w-16" />
											</Form.Item>
											<Form.Item
												{...restField}
												name={[name, 'unit']}
												rules={[
													{
														required: true,
														message: __(
															'Unit is required',
															'quillbooking'
														),
													},
												]}
												style={{ marginBottom: 0 }}
											>
												<Select
													className="h-[48px] rounded-lg w-44"
													getPopupContainer={(
														trigger
													) => trigger.parentElement}
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
											</Form.Item>

											{/* Only show Remove button if it's NOT the first item */}
											{index > 0 && (
												<Button
													onClick={() => remove(name)}
													danger
													className="border-none shadow-none p-0"
												>
													<LimitsTrashIcon />
												</Button>
											)}

											{/* Only show Add button beside the first item */}
											{index === 0 && (
												<Button
													onClick={() =>
														add({
															value: 15,
															unit: 'minutes',
														})
													}
													className="border-none shadow-none p-0"
												>
													<LimitsAddIcon />
												</Button>
											)}
										</Flex>
									)
								)}
							</Flex>
						)}
					</Form.List>
				</Form.Item>
			)}
		</Form>
	);

	return (
		<Card style={{ marginBottom: 16 }}>
			<Flex gap={10} align="center">
				{renderModalContent()}
			</Flex>
		</Card>
	);
};

export default EmailNotificationCard;
