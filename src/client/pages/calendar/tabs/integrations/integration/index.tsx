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
	Checkbox,
	Divider,
	Select,
	Spin,
	Form,
	Input,
} from 'antd';

import { PlusSquareOutlined, DeleteOutlined } from '@ant-design/icons';
import { filter, isEmpty, map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { useApi } from '@quillbooking/hooks';
import { NoticeMessage } from '../../../../..';

const { Text } = Typography;

interface Props {
	integration: Integration & { id?: string };
	calendarId: string;
	slug: string;
	setNotice: (notice: NoticeMessage) => void;
	onCalendarSelect: (selected: boolean) => void;
	hasAccounts: (hasAccounts: boolean) => void;
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
	setNotice,
	onCalendarSelect,
	hasAccounts,
}) => {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [form] = Form.useForm();
	const { callApi, loading } = useApi();
	const { callApi: connectApi, loading: connectLoading } = useApi();
	const { callApi: toggleCalendarApi, loading: toggleCalendarLoading } =
		useApi();
	const { callApi: updateSettingsApi, loading: updateSettingsLoading } =
		useApi();
	const { callApi: deleteApi } = useApi();
	const [visible, setVisible] = useState(false);
	const [integrationSlug, setIntegrationSlug] = useState(
		integration?.id || slug
	);
	const [selectedCalendar, setSelectedCalendar] = useState<string>('');

	useEffect(() => {
		fetchAccounts();
	}, [integrationSlug, calendarId]);

	useEffect(() => {
		setIntegrationSlug(integration?.id || slug);
	}, [integration?.id, slug]);

	// Update selected calendar when accounts change
	useEffect(() => {
		hasAccounts(accounts.length > 0);
		if (!accounts.length) {
			setSelectedCalendar('');
			return;
		}

		// Find the first account with a default calendar
		for (const account of accounts) {
			if (account.config?.default_calendar?.calendar_id) {
				setSelectedCalendar(
					account.config.default_calendar.calendar_id
				);
				break;
			}
		}
	}, [accounts]);

	useEffect(() => {
		onCalendarSelect(Boolean(selectedCalendar));
	}, [selectedCalendar]);

	const fetchAccounts = () => {
		callApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts`,
			method: 'GET',
			onSuccess(response) {
				const accounts = map(response, (account, id) => ({
					...account,
					id,
				})) as Account[];

				setAccounts(accounts);
				setSelectedCalendar('');

				// Set form values from first account's app_credentials if available
				if (accounts.length > 0 && accounts[0].app_credentials) {
					form.setFieldsValue(accounts[0].app_credentials);
				}
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: error.message,
				});
			},
		});
	};

	const handleDeleteAccount = async (accountId: string) => {
		try {
			await deleteApi({
				path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
				method: 'DELETE',
				onSuccess() {
					setNotice({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: __('Account deleted', 'quillbooking'),
					});
					setAccounts((prev) =>
						prev.filter((account) => account.id !== accountId)
					);
					// Clear form fields after successful deletion
					form.resetFields();
					// Reset selected calendar
					setSelectedCalendar('');
				},
				onError(error) {
					console.log('Delete error:', error);
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message:
							error?.message ||
							__('Failed to delete account', 'quillbooking'),
					});
				},
			});
		} catch (err) {
			console.error('Error in delete account:', err);
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __(
					'An unexpected error occurred while deleting the account',
					'quillbooking'
				),
			});
		}
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
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: error.message,
				});
			},
		});
	};

	const handleConnectBasic = () => {
		form.validateFields()
			.then((values) => {
				callApi({
					path: `integrations/${integrationSlug}/${calendarId}/accounts`,
					method: 'POST',
					data: {
						app_credentials: values,
						config: {},
					},
					onSuccess() {
						fetchAccounts();
						setNotice({
							type: 'success',
							title: __('Success', 'quillbooking'),
							message: __('Account connected', 'quillbooking'),
						});
					},
					onError(error) {
						setNotice({
							type: 'error',
							title: __('Error', 'quillbooking'),
							message: error.message,
						});
					},
				});
			})
			.catch((info) => {
				console.log('Validate Failed:', info);
			});
	};

	const handleCalendarSelection = (
		accountId: string,
		calId: string,
		checked: boolean
	) => {
		const newAccounts = accounts.map((account) => {
			if (account.id === accountId) {
				// Initialize calendars array if it doesn't exist
				const currentCalendars = Array.isArray(
					account.config?.calendars
				)
					? account.config.calendars
					: [];

				return {
					...account,
					config: {
						...account.config,
						calendars: checked
							? [...currentCalendars, calId]
							: currentCalendars.filter((id) => id !== calId),
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
							?.config?.calendars || [],
				},
			},
			onSuccess() {
				setAccounts(newAccounts);
				setNotice({
					type: 'success',
					title: __('Success', 'quillbooking'),
					message: __('Calendar selection updated', 'quillbooking'),
				});
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: error.message,
				});
			},
		});
	};

	const canAddAccount = () => integration.has_accounts && visible == false;

	const handleRemoteCalendarChange = (value: string) => {
		// Find which account this calendar belongs to
		let foundAccount: Account | undefined = undefined;
		let foundCalendar: any = null;

		for (const account of accounts) {
			if (!account.calendars) continue;

			const calendar = account.calendars.find((cal) => cal.id === value);
			if (calendar) {
				foundAccount = account;
				foundCalendar = calendar;
				break;
			}
		}

		if (!foundAccount || !foundCalendar) return;

		// Update local state first for immediate feedback
		setSelectedCalendar(value);
		onCalendarSelect(true);

		// Update all accounts - only one will have the default calendar
		const updatedAccounts = accounts.map((account) => {
			if (account.id === foundAccount?.id) {
				// This account will have the default calendar
				return {
					...account,
					config: {
						...account.config,
						default_calendar: {
							calendar_id: value,
							account_id: account.id,
						},
					},
				};
			} else {
				// All other accounts will have null default calendar
				return {
					...account,
					config: {
						...account.config,
						default_calendar: null,
					},
				};
			}
		});

		setAccounts(updatedAccounts);

		// Update all accounts via API
		Promise.all(
			accounts.map((account) =>
				toggleCalendarApi({
					path: `integrations/${integrationSlug}/${calendarId}/accounts/${account.id}`,
					method: 'PUT',
					data: {
						config: {
							...account.config,
							default_calendar:
								account.id === foundAccount?.id
									? {
											calendar_id: value,
											account_id: account.id,
										}
									: null,
						},
					},
				})
			)
		)
			.then(() => {
				setNotice({
					type: 'success',
					title: __('Success', 'quillbooking'),
					message: __(
						'Default calendar updated successfully',
						'quillbooking'
					),
				});
			})
			.catch((error) => {
				// Revert local state on error
				setSelectedCalendar('');
				setAccounts(accounts); // Revert to original accounts
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message:
						error.message ||
						__('Failed to update default calendar', 'quillbooking'),
				});
			});
	};

	// Get all available calendars across all accounts
	const getAllCalendars = () => {
		const options: { value: string; label: string; can_edit: boolean }[] =
			[];
		const seenCalendars = new Set<string>();

		for (const account of accounts) {
			if (!account.calendars || !account.calendars.length) continue;

			for (const calendar of account.calendars) {
				// Skip if we've already seen this calendar
				if (seenCalendars.has(calendar.id)) continue;
				seenCalendars.add(calendar.id);

				options.push({
					value: calendar.id,
					label: `${calendar.name} (${account.name})${!calendar.can_edit ? ' (Read Only)' : ''}`,
					can_edit: calendar.can_edit,
				});
			}
		}
		return options;
	};

	const handleSettingsChange = (
		accountId: string,
		setting: string,
		checked: boolean
	) => {
		const newAccounts = accounts.map((account) => {
			if (account.id === accountId) {
				return {
					...account,
					config: {
						...account.config,
						settings: {
							...account.config?.settings,
							[setting]: checked,
						},
					},
				};
			}
			return account;
		});

		updateSettingsApi({
			path: `integrations/${integrationSlug}/${calendarId}/accounts/${accountId}`,
			method: 'PUT',
			data: {
				config: {
					...newAccounts.find((account) => account.id === accountId)
						?.config,
					settings: {
						...newAccounts.find(
							(account) => account.id === accountId
						)?.config?.settings,
						[setting]: checked,
					},
				},
			},
			onSuccess() {
				setAccounts(newAccounts);
				setNotice({
					type: 'success',
					title: __('Success', 'quillbooking'),
					message: __(
						'Settings updated successfully',
						'quillbooking'
					),
				});
			},
			onError(error) {
				setNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message:
						error.message ||
						__('Failed to update settings', 'quillbooking'),
				});
			},
		});
	};

	const renderAccountList = () => (
		<Flex vertical gap={20} className="w-full">
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
										onConfirm={() => {
											handleDeleteAccount(account.id);
										}}
										okText={__('Yes', 'quillbooking')}
										cancelText={__('No', 'quillbooking')}
										okButtonProps={{ danger: true }}
										placement="topRight"
										zIndex={9999}
										getPopupContainer={(trigger) =>
											trigger.parentElement ||
											document.body
										}
										overlayStyle={{ zIndex: 9999 }}
									>
										<Button
											danger
											icon={<DeleteOutlined />}
											title={__(
												'Delete Account',
												'quillbooking'
											)}
										/>
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
															) &&
															Array.isArray(
																account.config
																	.calendars
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
										{field.type === 'password' ||
										fieldKey === 'client_secret' ? (
											<Flex gap={10}>
												<Form.Item
													name={fieldKey}
													noStyle
													rules={[
														{
															required:
																field.required,
															message: __(
																'This field is required',
																'quillbooking'
															),
														},
													]}
												>
													<Input.Password
														id={`${integrationSlug}-${fieldKey}`}
														placeholder={
															field.placeholder
														}
														className="rounded-lg h-[48px]"
													/>
												</Form.Item>

												{accounts.length > 0 && (
													<Button
														danger
														className="h-[48px]"
														onClick={() =>
															handleDeleteAccount(
																accounts[0].id
															)
														}
														loading={loading}
													>
														{__(
															'Disconnect',
															'quillbooking'
														)}
													</Button>
												)}
											</Flex>
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
								onClick={() => {
									handleConnectBasic();
									setVisible(false);
								}}
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
										{field.type === 'password' ||
										fieldKey === 'client_secret' ? (
											<Flex gap={10}>
												<Form.Item
													name={fieldKey}
													noStyle
													rules={[
														{
															required:
																field.required,
															message: __(
																'This field is required',
																'quillbooking'
															),
														},
													]}
												>
													<Input.Password
														id={`${integrationSlug}-${fieldKey}`}
														placeholder={
															field.placeholder
														}
														className="rounded-lg h-[48px]"
													/>
												</Form.Item>

												{accounts.length > 0 && (
													<Button
														danger
														className="h-[48px]"
														onClick={() =>
															handleDeleteAccount(
																accounts[0].id
															)
														}
														loading={loading}
													>
														{__(
															'Disconnect',
															'quillbooking'
														)}
													</Button>
												)}
											</Flex>
										) : (
											<Input
												id={`${integrationSlug}-${fieldKey}`}
												type={
													field.type === 'swtich' ||
													field.type === 'checkbox'
														? 'text'
														: field.type
												}
												placeholder={field.placeholder}
												className="rounded-lg h-[48px]"
											/>
										)}
									</Form.Item>
								))}
							</Form>
							<div className="flex justify-end">
								<Button
									type="primary"
									onClick={() => {
										form.validateFields()
											.then((values) => {
												handleConnectBasic();
												setVisible(false);
											})
											.catch((info) => {
												console.log(
													'Validate Failed:',
													info
												);
											});
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
						<Flex vertical gap={20} className="w-full">
							<Flex vertical>
								<div className="text-[#3F4254] font-semibold text-[16px]">
									{__('Remote Calendar', 'quillbooking')}
									<span className="text-[#E53E3E]">
										{__('*', 'quillbooking')}
									</span>
								</div>
								<Select
									placeholder={__(
										'Select a Remote Calendar',
										'quillbooking'
									)}
									className="w-full rounded-lg mb-2"
									style={{ height: '48px' }}
									value={selectedCalendar || undefined}
									onChange={handleRemoteCalendarChange}
									options={getAllCalendars().map(
										(calendar) => ({
											value: calendar.value,
											label: calendar.label,
											disabled: !calendar.can_edit,
										})
									)}
									disabled={loading || !accounts.length}
									loading={loading}
									showSearch
									optionFilterProp="label"
									showArrow={true}
									dropdownMatchSelectWidth={true}
									dropdownStyle={{ zIndex: 9999 }}
									getPopupContainer={(trigger) =>
										trigger.parentElement || document.body
									}
								/>
								<div className="text-[#71717A] italic">
									{__(
										'Select remote calendar in where to add new events to when you`re booked.',
										'quillbooking'
									)}
								</div>
							</Flex>
							{renderAccountList()}
						</Flex>
					)}
				</>
			)}
		</Card>
	);
};

export default IntegrationDetailsPage;
