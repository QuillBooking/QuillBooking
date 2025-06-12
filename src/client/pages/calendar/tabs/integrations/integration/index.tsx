/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { applyFilters } from '@wordpress/hooks';

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

import {
	PlusSquareOutlined,
	DeleteOutlined,
	ArrowLeftOutlined,
} from '@ant-design/icons';
import { isEmpty, map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { useApi } from '@quillbooking/hooks';
import { NoticeMessage } from '../../../../..';
import { ProGlobalIntegrations } from '@quillbooking/components';

const { Text } = Typography;

const getIntegrationRequirements = (
	integrationSlug: string,
	integrationName: string
) => {
	switch (integrationSlug) {
		case 'google':
			return {
				[__('Requirements', 'quillbooking')]: [
					__('Quill Booking Pro Account.', 'quillbooking'),
					__('A Google account.', 'quillbooking'),
					__(
						'Give Quill Booking Full Access to manage Calendar and Conferencing.',
						'quillbooking'
					),
				],
			};
		case 'outlook':
			return {
				[__('Requirements', 'quillbooking')]: [
					__('Quill Booking Pro Account.', 'quillbooking'),
					__('Microsoft account.', 'quillbooking'),
					__(
						'Give Quill Booking Full Access to manage Calendar and Conferencing.',
						'quillbooking'
					),
				],
			};
		case 'apple':
			return {
				[__('Requirements', 'quillbooking')]: [
					__('Quill Booking Pro Account.', 'quillbooking'),
					__('Apple account.', 'quillbooking'),
					__(
						'Give Quill Booking Full Access to manage Calendar.',
						'quillbooking'
					),
				],
			};
		case 'zoom':
			return {
				[__('Features that save you time:', 'quillbooking')]: [
					__(
						'Automatically create Zoom meetings at the time an event is scheduled',
						'quillbooking'
					),
					__(
						'Instantly share unique conferencing details upon confirmation.',
						'quillbooking'
					),
				],
				[__('Requirements', 'quillbooking')]: [
					__('Quill Booking Pro Account.', 'quillbooking'),
					__('A Zoom account.', 'quillbooking'),
					__(
						'Give Quill Booking Full Access to manage Zoom meetings.',
						'quillbooking'
					),
				],
			};
		default:
			return {
				[__('Requirements', 'quillbooking')]: [
					__('Quill Booking Pro Account.', 'quillbooking'),
					__(`A ${integrationName} account.`, 'quillbooking'),
					__(
						`Give Quill Booking Full Access to manage ${integrationName}.`,
						'quillbooking'
					),
				],
			};
	}
};

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
	config: {
		calendars?: string[];
		email?: string;
		default_calendar?: {
			calendar_id: string;
			account_id: string;
		} | null;
		settings?: {
			enable_notifications?: boolean;
			guests_can_see_others?: boolean;
			enable_teams?: boolean;
			[key: string]: any;
		};
		[key: string]: any;
	};
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
	const { callApi: toggleCalendarApi } = useApi();
	const { callApi: updateSettingsApi } = useApi();
	const { callApi: deleteApi } = useApi();
	const [visible, setVisible] = useState(false);
	const [integrationSlug, setIntegrationSlug] = useState(
		integration?.id || slug
	);
	const [selectedCalendar, setSelectedCalendar] = useState<string>('');
	const [isProVersion, setIsProVersion] = useState<boolean>(false);

	useEffect(() => {
		if (isProVersion) {
			fetchAccounts();
		}
	}, [integrationSlug, calendarId, isProVersion]);

	useEffect(() => {
		setIntegrationSlug(integration?.id || slug);
	}, [integration?.id, slug]);

	useEffect(() => {
		setIsProVersion(
			Boolean(applyFilters('quillbooking.integration', false))
		);
	}, []);

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
		if (integrationSlug == 'zoom') {
			onCalendarSelect(true);
		} else {
			onCalendarSelect(Boolean(selectedCalendar));
		}
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
					const formValues = { ...accounts[0].app_credentials };

					// Add integration-specific settings to form values
					if (accounts[0].config?.settings) {
						// For Google Calendar
						if (integrationSlug === 'google') {
							formValues.enable_notifications =
								accounts[0].config.settings
									.enable_notifications || false;
							formValues.guests_can_see_others =
								accounts[0].config.settings
									.guests_can_see_others || false;
						}

						// For Outlook
						if (integrationSlug === 'outlook') {
							formValues.enable_teams =
								accounts[0].config.settings.enable_teams ||
								false;
						}
					}

					form.setFieldsValue(formValues);
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

	const handleCheckTeamsCapabilities = async (
		account: any,
		type: string,
		e: any
	) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

		try {
			callApi({
				path: `integrations/${integrationSlug}/${calendarId}/accounts/${account.id}/check-teams`,
				method: 'GET',
				onSuccess(response: any) {
					if (response.success) {
						// User has Teams capability, proceed with enabling Teams
						handleSettingsChange(
							account.id,
							type,
							e.target.checked
						);
					} else {
						// User doesn't have Teams capability
						setNotice({
							type: 'error',
							title: __('Error', 'quillbooking'),
							message:
								response.message ||
								__(
									'Failed to verify Teams capabilities',
									'quillbooking'
								),
						});
					}
				},
				onError(error: any) {
					console.error('Error checking Teams capabilities:', error);
					setNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message: __(
							'Failed to verify Teams capabilities. Please try again later.',
							'quillbooking'
						),
					});
				},
			});
		} catch (error) {
			console.error('Error checking Teams capabilities:', error);
			setNotice({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __(
					'Failed to verify Teams capabilities. Please try again later.',
					'quillbooking'
				),
			});
		}
	};

	const handleDeleteAccount = async (accountId: string) => {
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

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
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

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
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

		form.validateFields()
			.then((values) => {
				// Extract integration-specific settings from form values
				const appCredentials = { ...values };
				const settings = {};

				// Handle Google Calendar specific settings
				if (integrationSlug === 'google') {
					// Remove these settings from credentials and move to config.settings
					if ('enable_notifications' in appCredentials) {
						settings['enable_notifications'] =
							appCredentials.enable_notifications;
						delete appCredentials.enable_notifications;
					}
					if ('guests_can_see_others' in appCredentials) {
						settings['guests_can_see_others'] =
							appCredentials.guests_can_see_others;
						delete appCredentials.guests_can_see_others;
					}
				}

				// Handle Outlook specific settings
				if (integrationSlug === 'outlook') {
					if ('enable_teams' in appCredentials) {
						settings['enable_teams'] = appCredentials.enable_teams;
						delete appCredentials.enable_teams;
					}
				}

				callApi({
					path: `integrations/${integrationSlug}/${calendarId}/accounts`,
					method: 'POST',
					data: {
						app_credentials: appCredentials,
						config: {
							settings:
								Object.keys(settings).length > 0
									? settings
									: undefined,
						},
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
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

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
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

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
		if (!isProVersion) {
			setNotice({
				type: 'error',
				title: __('Pro Version Required', 'quillbooking'),
				message: __(
					'This feature requires the Pro version of Quill Booking.',
					'quillbooking'
				),
			});
			return;
		}

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

							{/* Additional integration-specific settings for existing accounts */}
							{integrationSlug === 'google' && (
								<Flex
									vertical
									gap={10}
									className="w-full border-b pb-4 mb-4"
								>
									<Text
										type="secondary"
										className="text-[#9197A4] font-semibold"
									>
										{__(
											'Google Calendar Settings',
											'quillbooking'
										)}
									</Text>
									<Flex vertical gap={8}>
										<Checkbox
											checked={
												account.config?.settings
													?.enable_notifications ===
												true
											}
											onChange={(e) =>
												handleSettingsChange(
													account.id,
													'enable_notifications',
													e.target.checked
												)
											}
											className="custom-checkbox text-color-primary-text font-semibold"
										>
											{__(
												'Enable Google Calendar Notifications',
												'quillbooking'
											)}
										</Checkbox>
										<Checkbox
											checked={
												account.config?.settings
													?.guests_can_see_others ===
												true
											}
											onChange={(e) =>
												handleSettingsChange(
													account.id,
													'guests_can_see_others',
													e.target.checked
												)
											}
											className="custom-checkbox text-color-primary-text font-semibold"
										>
											{__(
												'Guests can see other guests of the slot',
												'quillbooking'
											)}
										</Checkbox>
									</Flex>
								</Flex>
							)}

							{integrationSlug === 'outlook' && (
								<Flex
									vertical
									gap={10}
									className="w-full border-b pb-4 mb-4"
								>
									<Text
										type="secondary"
										className="text-[#9197A4] font-semibold"
									>
										{__(
											'Microsoft Settings',
											'quillbooking'
										)}
									</Text>
									<Flex vertical gap={8}>
										<Checkbox
											checked={
												account.config?.settings
													?.enable_teams === true
											}
											onChange={(e) =>
												handleCheckTeamsCapabilities(
													account,
													'enable_teams',
													e
												)
											}
											className="custom-checkbox text-color-primary-text font-semibold"
										>
											{__(
												'Enable Microsoft Teams (Requires work/school account)',
												'quillbooking'
											)}
										</Checkbox>
									</Flex>
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
				isProVersion ? (
					<>
						<div className="zoom-fields">
							<Flex vertical gap={10} className="w-full">
								<div className="text-[#71717A] italic">
									{__('Please read the', 'quillbooking')}
									<span className="cursor-pointer font-semibold underline mx-1">
										{__(
											'documentation here',
											'quillbooking'
										)}
									</span>
									{__(
										'for step by step guide to know how you can get credentials from Zoom Account',
										'quillbooking'
									)}
								</div>
								<Form form={form} layout="vertical">
									{map(
										integration.fields,
										(field, fieldKey) => (
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
														required:
															field.required,
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

														{accounts.length >
															0 && (
															<Button
																danger
																className="h-[48px]"
																onClick={() =>
																	handleDeleteAccount(
																		accounts[0]
																			.id
																	)
																}
																loading={
																	loading
																}
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
														placeholder={
															field.placeholder
														}
														className="rounded-lg h-[48px]"
													/>
												)}
											</Form.Item>
										)
									)}

									{/* Additional integration-specific settings */}
									{integrationSlug === 'google' && (
										<>
											<Divider
												orientation="left"
												className="mt-4"
											>
												{__(
													'Additional Google Calendar Settings',
													'quillbooking'
												)}
											</Divider>
											<Form.Item
												name="enable_notifications"
												valuePropName="checked"
												className="mb-2"
											>
												<Checkbox className="custom-checkbox text-color-primary-text font-semibold">
													{__(
														'Enable Google Calendar Notifications',
														'quillbooking'
													)}
												</Checkbox>
											</Form.Item>
											<Form.Item
												name="guests_can_see_others"
												valuePropName="checked"
											>
												<Checkbox className="custom-checkbox text-color-primary-text font-semibold">
													{__(
														'Guests can see other guests of the slot',
														'quillbooking'
													)}
												</Checkbox>
											</Form.Item>
										</>
									)}

									{integrationSlug === 'outlook' && (
										<>
											<Divider
												orientation="left"
												className="mt-4"
											>
												{__(
													'Additional Microsoft Settings',
													'quillbooking'
												)}
											</Divider>
											<Form.Item
												name="enable_teams"
												valuePropName="checked"
											>
												<Checkbox className="custom-checkbox text-color-primary-text font-semibold">
													{__(
														'Enable Microsoft Teams (Requires work/school account)',
														'quillbooking'
													)}
												</Checkbox>
											</Form.Item>
										</>
									)}
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
					<ProGlobalIntegrations
						list={getIntegrationRequirements(
							integrationSlug,
							integration.name
						)}
					/>
				)
			) : (
				<>
					{visible ? (
						<Flex vertical gap={10} className="w-full">
							{/* add back button */}
							<Flex justify="space-between" align="center">
								<Button
									type="link"
									onClick={() => setVisible(false)}
									className="text-[#3F4254] font-semibold mb-2"
									icon={<ArrowLeftOutlined />}
								>
									{__('Back', 'quillbooking')}
								</Button>
							</Flex>
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
											.then(() => {
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
