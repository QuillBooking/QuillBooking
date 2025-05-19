/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	Button,
	Card,
	Typography,
	Flex,
	Popconfirm,
	Tooltip,
	Checkbox,
	Divider,
	Select,
	Spin,
	Form,
	Input,
} from 'antd';
import {
	PlusSquareOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import { filter, isEmpty, map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { TextField } from '@quillbooking/components';
import { useApi, useNotice } from '@quillbooking/hooks';

const { Text } = Typography;

interface Props {
	integration: Integration & { id?: string };
	calendarId: string;
	slug: string;
}

interface Account {
	id: string;
	name: string;
	config: any;
	calendars: any[];
	app_credentials: any;
}

const IntegrationDetailsPage: React.FC<Props> = ({
	integration,
	calendarId,
	slug,
}) => {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [form] = Form.useForm();
	const { callApi, loading } = useApi();
	const { callApi: connectApi, loading: connectLoading } = useApi();
	const { callApi: toggleCalendarApi, loading: toggleCalendarLoading } = useApi();
	const { callApi: deleteApi } = useApi();
	const { errorNotice, successNotice } = useNotice();
	const [saving, setSaving] = useState(false);
	const [visible, setVisible] = useState(false);
    const [integrationSlug, setIntegrationSlug] = useState(integration?.id || slug);


    

	useEffect(() => {
		fetchAccounts();
	}, [integrationSlug, calendarId]);

    useEffect(() => {
        setIntegrationSlug(integration?.id || slug);
    }, [integration?.id, slug]);

	const fetchAccounts = () => {
        console.log(integrationSlug);
		callApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts`,
			method: 'GET',
			onSuccess(response) {
				const accounts = map(response, (account, id) => ({
					...account,
					id,
				})) as Account[];

				setAccounts(accounts);

				// Set form values from first account's app_credentials if available
				if (accounts.length > 0 && accounts[0].app_credentials) {
					form.setFieldsValue(accounts[0].app_credentials);
				}
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	const handleDeleteAccount = async (accountId: string) => {
		await deleteApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
			method: 'DELETE',
			onSuccess() {
				successNotice(__('Account deleted', 'quillbooking'));
				setAccounts((prev) =>
					prev.filter((account) => account.id !== accountId)
				);
			},
			onError() {
				errorNotice(__('Failed to delete account', 'quillbooking'));
			},
		});
	};

	const handleConnectOAuth = () => {
		connectApi({
			path: addQueryArgs(`integrations/${integrationSlug}/auth`, {
				host_id: calendarId,
			}),
			method: 'GET',
			onSuccess(response) {
				window.location.href = response.auth_uri;
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	const handleConnectBasic = () => {
		form.validateFields()
			.then((values) => {
				connectApi({
					path: `integrations/${integrationSlug}/${calendarId}/accounts`,
					method: 'POST',
					data: {
						app_credentials: values,
						config: [],
					},
					onSuccess() {
						fetchAccounts();
						successNotice(__('Account connected', 'quillbooking'));
					},
					onError(error) {
						errorNotice(error.message);
					},
				});
			})
			.catch((info) => {
				console.log('Validate Failed:', info); 
			});
	};

	const validate = () => {
		const requiredFields = filter(
			Object.keys(integration.fields),
			(field) => integration.fields[field].required
		);

		for (const field of requiredFields) {
			if (!form.getFieldValue(field)) {
				errorNotice(
					sprintf(
						__('Please enter a value for %s.', 'quillbooking'),
						__(
							integration.fields[field].label || field,
							'quillbooking'
						)
					)
				);
				return false;
			}
		}

		return true;
	};

	const handleFieldChange = (fieldName: string, value: string) => {
		form.setFieldValue(fieldName, value);
	};

	const handleCalendarSelection = (
		accountId: string,
		calId: string,
		checked: boolean
	) => {
		const newAccounts = accounts.map((account) => {
			if (account.id === accountId) {
				return {
					...account,
					config: {
						...account.config,
						calendars: checked
							? [...account.config.calendars, calId]
							: filter(
									account.config.calendars,
									(id) => id !== calId
								),
					},
				};
			}

			return account;
		});

		toggleCalendarApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
			method: 'PUT',
			data: {
				config: {
					calendars:
						newAccounts.find((account) => account.id === accountId)
							?.config.calendars || [],
				},
			},
			onSuccess() {
				setAccounts(newAccounts);
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	// Custom save handler for integration settings
	const handleSaveSettings = (values: any) => {
		console.log('--------------------------------');
		console.log(`integrations/${integrationSlug}/${calendarId}/accounts`);
		console.log('--------------------------------');
		setSaving(true);
		callApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts`,
			method: 'POST',
			data: {
				app_credentials: values,
				config: [],
			},
			onSuccess() {
				successNotice(
					__(
						`${integration.name} credentials saved successfully`,
						'quillbooking'
					)
				);
				setSaving(false);
				fetchAccounts();
			},
			onError(error) {
				setSaving(false);
				errorNotice(
					error?.message ||
						__(
							`Failed to save ${integration.name} credentials`,
							'quillbooking'
						)
				);
			},
		});
	};

	// Override the form's onFinish to use our custom handler
	useEffect(() => {
		const parentForm = form;
		const originalOnFinish = parentForm.submit;

		// Override the form's submit method
		parentForm.submit = () => {
			parentForm
				.validateFields()
				.then((values) => {
					handleSaveSettings(values);
				})
				.catch((info) => {
					console.log('Validate Failed:', info);
				});
		};

		// Restore original onFinish on unmount
		return () => {
			parentForm.submit = originalOnFinish;
		};
	}, [form, calendarId]);

	const canAddAccount = () => integration.has_accounts && visible == false;

	const renderAccountList = () => (
		<Flex vertical gap={20} className="w-full">
			<Flex vertical>
				<div className="text-[#3F4254] font-semibold text-[16px]">
					{__('Remote Calendar', 'quillbooking')}
					<span className="text-[#E53E3E]">
						{__('*', 'quillbooking')}
					</span>
				</div>
				<Select
					placeholder={__('Select a Remote Calendar', 'quillbooking')}
					className="w-full h-[48px] rounded-lg mb-2"
				/>
				<div className="text-[#71717A] italic">
					{__(
						'Select remote calendar in where to add new events to when you`re booked.',
						'quillbooking'
					)}
				</div>
			</Flex>
			<Flex vertical gap={20}>
				{loading ? (
					<Spin spinning={true} />
				) : (
					accounts.map((account) => (
						<Card key={account.id}>
							<Flex
								align="center"
								gap={16}
								className="p-0 text-color-primary-text border-b pb-5 mb-5"
							>
								<img
									src={integration.icon}
									alt={integration.name}
									className="size-8"
								/>
								<Flex justify="space-between" align="center">
									<div>
										<Text className="text-[#09090B] font-bold text-2xl block">
											{account.name}
											<span className="text-[#0EA473] text-xs font-medium italic ml-3">
												{__(
													'Connected',
													'quillbooking'
												)}
											</span>
										</Text>
										<Text className="text-[#3F4254] italic font-medium">
											{account.config.email}
										</Text>
									</div>
									<Popconfirm
										title={__(
											'Are you sure you want to delete this account?',
											'quillbooking'
										)}
										onConfirm={() =>
											handleDeleteAccount(account.id)
										}
										okText={__('Yes', 'quillbooking')}
										cancelText={__('No', 'quillbooking')}
									>
										<Tooltip
											title={__(
												'Delete Account',
												'quillbooking'
											)}
										>
											<Button
												danger
												icon={<DeleteOutlined />}
											/>
										</Tooltip>
									</Popconfirm>
								</Flex>
							</Flex>
							{integration.is_calendar && (
								<Flex
									vertical
									gap={10}
									className="w-full border-b pb-4 mb-4"
								>
									<Text
										type="secondary"
										className="text-[#9197A4]"
									>
										{__(
											'Enable the calendars you want to check for conflicts to prevent double bookings.',
											'quillbooking'
										)}
									</Text>
									{!isEmpty(account.calendars) ? (
										<Flex vertical gap={8}>
											{account.calendars.map(
												(calendar) => (
													<Checkbox
														key={calendar.id}
														checked={
															!isEmpty(
																account.config
															)
																? account.config.calendars.includes(
																		calendar.id
																	)
																: false
														}
														onChange={(e) =>
															handleCalendarSelection(
																account.id,
																calendar.id,
																e.target.checked
															)
														}
														className="custom-checkbox text-color-primary-text font-semibold"
													>
														{calendar.name}
													</Checkbox>
												)
											)}
										</Flex>
									) : (
										<Text type="secondary">
											{__(
												'No calendars found.',
												'quillbooking'
											)}
										</Text>
									)}
								</Flex>
							)}
							<Flex vertical gap={10} className="w-full">
								<Text
									type="secondary"
									className="text-[#9197A4]"
								>
									{__('Additional Settings', 'quillbooking')}
								</Text>
								<Checkbox.Group>
									<Checkbox className="custom-check text-base font-semibold text-color-primary-text">
										{__(
											`Enable ${integration.name} Calendar Notification`,
											'quillbooking'
										)}
									</Checkbox>
									<Checkbox className="custom-check text-base font-semibold text-color-primary-text">
										{__(
											'Guests Can See other Guests of the Slot',
											'quillbooking'
										)}
									</Checkbox>
								</Checkbox.Group>
							</Flex>
						</Card>
					))
				)}
			</Flex>
		</Flex>
	);

	return (
		<Card className="integration-details-page h-fit">
			<Flex
				align="center"
				gap={16}
				className="p-0 text-color-primary-text border-b pb-5 mb-5"
			>
				<img
					src={integration.icon}
					alt={integration.name}
					className="size-12"
				/>
				<Flex justify="space-between" align="center">
					<div>
						<Text className="text-[#09090B] font-bold text-2xl block">
							{integration.name}
						</Text>
						<Text type="secondary" className="text-sm">
							{integration.description}
						</Text>
					</div>
					{canAddAccount() && (
						<Button
							onClick={() =>
								integration.auth_type === 'oauth'
									? handleConnectOAuth()
									: setVisible(true)
							}
							icon={<PlusSquareOutlined />}
							loading={connectLoading}
							className="border-none shadow-none text-color-primary text-base font-medium"
						>
							{__('Add New', 'quillbooking')}
						</Button>
					)}
				</Flex>
			</Flex>
			{!integration.has_accounts ? (
				<>
					<div className="zoom-fields">
						<Flex vertical gap={10} className="w-full">
							<div className="text-[#71717A] italic">
								{__('Please read the', 'quillbooking')}
								<span className="cursor-pointer font-semibold underline mx-1">
									{__('documentation here', 'quillbooking')}
								</span>
								{__(
									'for step by step guide to know how you can get credentials from Zoom Account',
									'quillbooking'
								)}
							</div>
							<Form form={form} layout="vertical">
								{map(integration.fields, (field, fieldKey) => (
									<Form.Item
										name={fieldKey}
										key={fieldKey}
										label={
											<label
												htmlFor={`${integrationSlug}-${fieldKey}`}
												className="text-[#3F4254] font-semibold text-[16px]"
											>
												{field.label}
											</label>
										}
										rules={[
											{
												required: field.required,
												message: __(
													'This field is required',
													'quillbooking'
												),
											},
										]}
										extra={
											<Text
												type="secondary"
												className="text-xs"
											>
												{field.description ||
													`You Can Find Your ${field.label.replace('*', '')} In Your ${integration.name} App Settings.`}
											</Text>
										}
									>
										{field.type === 'password' || fieldKey === 'client_secret' ? (
											<Input.Password
												id={`${integrationSlug}-${fieldKey}`}
												placeholder={field.placeholder}
												className="rounded-lg h-[48px]"
											/>
										) : (
											<Input
												id={`${integrationSlug}-${fieldKey}`}
												type={field.type}
												placeholder={field.placeholder}
												className="rounded-lg h-[48px]"
											/>
										)}
									</Form.Item>
								))}
							</Form>

							<Divider />

							<div className="text-[#71717A] italic">
								{__(
									'The above credentials will be encrypted and stored securely.',
									'quillbooking'
								)}
							</div>
						</Flex>
						<div className="flex justify-end">
							<Button
								type="primary"
								onClick={() => form.submit()}
								loading={connectLoading}
								style={{ marginTop: '10px' }}
							>
								{connectLoading
									? __(
											'Saving & Validating...',
											'quillbooking'
										)
									: __(
											'Save & Validate Credentials',
											'quillbooking'
										)}
							</Button>
						</div>
					</div>
				</>
			) : (
				<>
					{visible ? (
						<Flex vertical gap={10} className="w-full">
							<div className="text-[#71717A] italic">
								{__(
									'To connect to Apple Server, please enter your Apple Email and app specific password. Generate App Specific Password at',
									'quillbooking'
								)}
								<span className="cursor-pointer font-semibold underline mx-1">
									{__(
										'https://appleid.apple.com/account/manage',
										'quillbooking'
									)}
								</span>
								{__(
									'Your credentials will be stored as encrypted.',
									'quillbooking'
								)}
							</div>
							{map(integration.fields, (field, fieldKey) => (
								<TextField
									key={fieldKey}
									label={
										<div className="text-[#3F4254] font-semibold text-[16px]">
											{field.label}
										</div>
									}
									description={__(
										field.description || '',
										'quillbooking'
									)}
									type={field.type || 'text'}
									value={form.getFieldValue(fieldKey) || ''}
									onChange={(value) =>
										handleFieldChange(fieldKey, value)
									}
									required={field.required}
									placeholder={field.placeholder || ''}
								/>
							))}
							<div className="flex justify-end">
								<Button
									type="primary"
									onClick={() => {
										handleConnectBasic();
										setVisible(false);
									}}
									loading={connectLoading}
									style={{ marginTop: '10px' }}
								>
									{connectLoading
										? __('Connecting...', 'quillbooking')
										: __(
												'Connect with Apple Calendar',
												'quillbooking'
											)}
								</Button>
							</div>
						</Flex>
					) : (
						renderAccountList()
					)}
				</>
			)}
		</Card>
	);
};

export default IntegrationDetailsPage;
