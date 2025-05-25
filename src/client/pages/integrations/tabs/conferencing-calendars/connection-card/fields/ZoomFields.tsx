import { __ } from '@wordpress/i18n';
import {
	Flex,
	Form,
	Input,
	Divider,
	Typography,
	Skeleton,
	Button,
	message,
} from 'antd';
import { useEffect, useState } from 'react';
import { useApi, useNotice } from '@quillbooking/hooks';
import { useNavigate, useLocation } from 'react-router-dom';

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

const ZoomFields = ({
	fields,
	form,
	calendar,
}: {
	fields: any;
	form: any;
	calendar?: any;
}) => {
	const { callApi } = useApi();
	const { errorNotice, successNotice } = useNotice();
	const navigate = useNavigate();
	const location = useLocation();
	const [loadingAccount, setLoadingAccount] = useState(false);
	const [accountData, setAccountData] = useState<ZoomAccount | null>(null);
	const [saving, setSaving] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false);

	// Fetch Zoom account data on component mount
	useEffect(() => {
		fetchZoomAccount();
	}, []);

	// When account data is available, set form values
	useEffect(() => {
		if (accountData?.app_credentials) {
			form.setFieldsValue({
				account_id: accountData.app_credentials.account_id || '',
				client_id: accountData.app_credentials.client_id || '',
				client_secret: accountData.app_credentials.client_secret || '',
			});
		}
		console.log(accountData);
	}, [accountData, form]);

	const fetchZoomAccount = () => {
		setLoadingAccount(true);
		callApi({
			path: `integrations/zoom`,
			method: 'GET',
			onSuccess(response) {
				// check is array
				if (
					Array.isArray(response.settings) &&
					response.settings.length <= 0
				) {
					setAccountData(null);
				} else {
					setAccountData(response.settings);
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
		if (!accountData) {
			errorNotice(__('No account to disconnect', 'quillbooking'));
			return;
		}

		setSaving(true);
		callApi({
			path: `integrations/zoom`,
			method: 'DELETE',
			data: {
				settings: {
					id: accountData.id || '',
				},
			},
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

	const handleNavigateToIntegration = async () => {
		if (!calendar?.id) {
			message.error({
				content: __(
					'No calendar selected. Please select a calendar first.',
					'quillbooking'
				),
				key: 'navigate',
			});
			return;
		}

		try {
			setIsNavigating(true);

			// Show loading message
			message.loading({
				content: __(
					'Preparing to navigate to integration...',
					'quillbooking'
				),
				key: 'navigate',
				duration: 0,
			});

			// Small delay to show loading state and ensure smooth transition
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Navigate to the full path
			const path = `calendars/${calendar.id}`;
			navigate(
				`/wordpress/wp-admin/admin.php?page=quillbooking&path=${encodeURIComponent(path)}&tab=integrations&subtab=zoom`
			);

			// Show success message briefly
			message.success({
				content: __(
					'Navigating to integration settings...',
					'quillbooking'
				),
				key: 'navigate',
				duration: 1,
			});
		} catch (error) {
			console.error('Navigation error:', error);
			message.error({
				content: __(
					'Failed to navigate to integration settings. Please try again.',
					'quillbooking'
				),
				key: 'navigate',
				duration: 3,
			});
		} finally {
			setIsNavigating(false);
		}
	};

	// Custom save handler for Zoom integration
	const handleSaveZoomSettings = (values: any) => {
		setSaving(true);
		callApi({
			path: `integrations/zoom`,
			method: 'POST',
			data: {
				settings: {
					id: '',
					app_credentials: {
						account_id: values.account_id,
						client_id: values.client_id,
						client_secret: values.client_secret,
					},
					config: {},
				},
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
	}, [form]);

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

				{calendar?.id && (
					<Button
						type="link"
						onClick={handleNavigateToIntegration}
						loading={isNavigating}
						className="flex items-center gap-2 hover:text-blue-600 transition-colors mt-4"
						disabled={!calendar?.id}
					>
						{__('Manage accounts', 'quillbooking')}
					</Button>
				)}
			</Flex>
		</div>
	);
};

export default ZoomFields;
