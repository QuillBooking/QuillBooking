import { __ } from '@wordpress/i18n';
import { Flex, Form, Input, Divider, Typography, Skeleton, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useApi, useNotice } from '@quillbooking/hooks';
import { addQueryArgs } from '@wordpress/url';

const { Text } = Typography;

interface ZoomAccount {
	account_id?: string;
	client_id?: string;
	client_secret?: string;
	id?: string;
	app_credentials?: {
		account_id?: string;
		client_id?: string;
		client_secret?: string;
	};
}

interface Calendar {
	id: string;
	name: string;
}

const ZoomFields = ({ fields, form }: { fields: any; form: any }) => {
	const { callApi } = useApi();
	const { errorNotice, successNotice } = useNotice();
	const [loadingAccount, setLoadingAccount] = useState(false);
	const [calendar, setCalendar] = useState<Calendar | null>(null);
	const [accountData, setAccountData] = useState<ZoomAccount | null>(null);
	const [saving, setSaving] = useState(false);

	// Fetch calendars on component mount
	useEffect(() => {
		fetchCalendars();
	}, []);

	// When calendar changes, fetch Zoom account data
	useEffect(() => {
		if (calendar?.id) {
			fetchZoomAccount();
		}
	}, [calendar]);

	// When account data is available, set form values
	useEffect(() => {
		if (accountData?.app_credentials) {
			form.setFieldsValue({
				account_id: accountData.app_credentials.account_id || '',
				client_id: accountData.app_credentials.client_id || '',
				client_secret: accountData.app_credentials.client_secret || '',
			});
		}
	}, [accountData, form]);

	const fetchCalendars = () => {
		setLoadingAccount(true);
		callApi({
			path: addQueryArgs(`calendars`, {
				user: 'own',
			}),
			onSuccess: (response) => {
				if (response.data && response.data.length > 0) {
					const currentCalendar = response.data[0];
					setCalendar(currentCalendar);
				} else {
					setLoadingAccount(false);
					errorNotice(
						__('No calendars found for this user', 'quillbooking')
					);
				}
			},
			onError: (error) => {
				setLoadingAccount(false);
				errorNotice(
					error.message ||
						__('Failed to fetch calendars', 'quillbooking')
				);
			},
		});
	};

	const fetchZoomAccount = () => {
		if (!calendar) return;

		setLoadingAccount(true);
		callApi({
			path: `integrations/zoom/${calendar.id}/accounts`,
			method: 'GET',
			onSuccess(response) {
				const firstKey = Object.keys(response)[0];
				const account = response[firstKey];
				if (account) {
					setAccountData(account);
				}
				setLoadingAccount(false);
			},
			onError(error) {
				setLoadingAccount(false);
				errorNotice(
					error?.message ||
						__('Failed to fetch Zoom account', 'quillbooking')
				);
			},
		});
	};

	const handleDisconnect = () => {
		if (!accountData?.id) {
			errorNotice(__('No account to disconnect', 'quillbooking'));
			return;
		}

		setSaving(true);
		callApi({
			path: `integrations/zoom/accounts/${accountData.id}`,
			method: 'DELETE',
			onSuccess() {
				successNotice(
					__('Zoom account disconnected successfully', 'quillbooking')
				);
				form.resetFields();
				setAccountData(null);
				setSaving(false);
			},
			onError(error) {
				errorNotice(
					error.message ||
						__('Failed to disconnect Zoom account', 'quillbooking')
				);
				setSaving(false);
			},
		});
	};

	// Custom save handler for Zoom integration
	const handleSaveZoomSettings = (values: any) => {
		if (!calendar) {
			errorNotice(__('No calendar selected', 'quillbooking'));
			return;
		}

		setSaving(true);
		callApi({
			path: `integrations/zoom/${calendar.id}/accounts`,
			method: 'POST',
			data: {
				app_credentials: {
					account_id: values.account_id,
					client_id: values.client_id,
					client_secret: values.client_secret,
				},
				config: {},
			},
			onSuccess() {
				successNotice(
					__('Zoom credentials saved successfully', 'quillbooking')
				);
				setSaving(false);
				fetchZoomAccount();
			},
			onError(error) {
				setSaving(false);
				errorNotice(
					error?.message ||
						__('Failed to save Zoom credentials', 'quillbooking')
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
					handleSaveZoomSettings(values);
				})
				.catch((info) => {
					console.log('Validate Failed:', info);
				});
		};

		// Restore original onFinish on unmount
		return () => {
			parentForm.submit = originalOnFinish;
		};
	}, [form, calendar]);

	if (loadingAccount) {
		return <Skeleton active paragraph={{ rows: 4 }} />;
	}

	return (
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

				{Object.entries(fields).map(([key, field]: [string, any]) => (
					<Form.Item
						name={key}
						key={key}
						label={
							<label
								htmlFor={`zoom-${key}`}
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
							<Text type="secondary" className="text-xs">
								{field.help_text ||
									`You Can Find Your ${field.label.replace('*', '')} In Your Zoom App Settings.`}
							</Text>
						}
					>
						{field.type === 'password' ||
						key === 'client_secret' ? (
							<Flex gap={10}>
								<Form.Item
									name={key}
									noStyle
									rules={[
										{
											required: field.required,
											message: __(
												'This field is required',
												'quillbooking'
											),
										},
									]}
								>
									<Input.Password
										id={`zoom-${key}`}
										placeholder={field.placeholder}
										className="rounded-lg h-[48px]"
									/>
								</Form.Item>

								{accountData && (
									<Button
										danger
										className="h-[48px]"
										onClick={handleDisconnect}
										loading={saving}
									>
										{__('Disconnect', 'quillbooking')}
									</Button>
								)}
							</Flex>
						) : (
							<Input
								id={`zoom-${key}`}
								type={field.type}
								placeholder={field.placeholder}
								className="rounded-lg h-[48px]"
							/>
						)}
					</Form.Item>
				))}

				<Divider />
				<div className="text-[#71717A] italic">
					{__(
						'The above app secret key will be encrypted and stored securely.',
						'quillbooking'
					)}
				</div>

				{accountData && (
					<div className="text-[#9197A4] mt-2">
						{__(
							'Your Zoom API integration is up and running.',
							'quillbooking'
						)}
					</div>
				)}
			</Flex>
		</div>
	);
};

export default ZoomFields;
