/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Button,
	Card,
	Flex,
	Form,
	Input,
	Skeleton,
	Spin,
	Typography,
} from 'antd';
/**
 * Internal dependencies
 */
import ConfigAPI from '@quillbooking/config';
import { useApi, useNotice, useCurrentUser } from '@quillbooking/hooks';
import { addQueryArgs } from '@wordpress/url';

const { Text } = Typography;

const SMSIntegration: React.FC = () => {
	const integration = Object.entries(ConfigAPI.getIntegrations()).filter(
		([key]) => key == 'twilio'
	)[0][1];
	const [form] = Form.useForm();
	const { callApi, loading } = useApi();
	const { successNotice, errorNotice } = useNotice();
	const [saving, setSaving] = useState(false);
	const [accountData, setAccountData] = useState<any>(null);
	const [loadingAccount, setLoadingAccount] = useState(true);
	const [calendar, setCalendar] = useState<any>(null);

	useEffect(() => {
		fetchCalendars();
	}, []);

	useEffect(() => {
		if (calendar?.id) {
			fetchTwilioAccount();
		}
	}, [calendar]);

	useEffect(() => {
		if (accountData) {
			form.setFieldsValue({
				sms_number: accountData.credentials?.sms_number || '',
				whatsapp_number: accountData.credentials?.whatsapp_number || '',
				account_sid: accountData.credentials?.account_sid || '',
				auth_token: accountData.credentials?.auth_token || '',
			});
		}
	}, [accountData]);

	const fetchCalendars = () => {
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

	const fetchTwilioAccount = () => {
		setLoadingAccount(true);
		callApi({
			path: `integrations/twilio/${calendar.id}/accounts`,
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
						__('Failed to fetch Twilio account', 'quillbooking')
				);
			},
		});
	};

	const handleSaveSettings = (values: any) => {
		setSaving(true);
		callApi({
			path: `integrations/twilio/${calendar.id}/accounts`,
			method: 'POST',
			data: {
				credentials: {
					sms_number: values.sms_number,
					whatsapp_number: values.whatsapp_number,
					account_sid: values.account_sid,
					auth_token: values.auth_token,
				},
				config: {},
			},
			onSuccess() {
				successNotice(
					__('Twilio account saved successfully', 'quillbooking')
				);
				fetchTwilioAccount();
				setSaving(false);
			},
			onError(error) {
				errorNotice(
					error.message ||
						__('Failed to save Twilio account', 'quillbooking')
				);
				setSaving(false);
			},
		});
	};

	const handleDisconnect = () => {
		setSaving(true);
		callApi({
			path: `integrations/twilio/accounts/${accountData?.id}`,
			method: 'DELETE',
			onSuccess() {
				successNotice(
					__(
						'Twilio account disconnected successfully',
						'quillbooking'
					)
				);
				form.resetFields();
				setAccountData(null);
				setSaving(false);
			},
			onError(error) {
				errorNotice(
					error.message ||
						__(
							'Failed to disconnect Twilio account',
							'quillbooking'
						)
				);
				setSaving(false);
			},
		});
	};

	return (
		<div className="quillbooking-sms-integration flex gap-5 w-full">
			<Card className="rounded-lg mb-6 w-full">
				<Flex vertical gap={15}>
					<Card className="w-full cursor-pointer bg-color-secondary border-color-primary">
						<Flex gap={18} align="center">
							<img
								src={integration.icon}
								alt="twilio.png"
								className="size-12"
							/>
							<Flex vertical gap={2}>
								<div className="text-base font-semibold text-color-primary capitalize">
									{__(
										'Twilio SMS Integration',
										'quillbooking'
									)}
								</div>
								<div className="text-xs text-color-primary">
									{__(
										'Configure Twilio API to send SMS/WhatsApp notifications on booking events.',
										'quillbooking'
									)}
								</div>
							</Flex>
						</Flex>
					</Card>
				</Flex>
			</Card>

			<Card className="rounded-lg mb-6 w-full">
				<Flex
					align="center"
					gap={16}
					className="p-0 text-color-primary-text border-b pb-5"
				>
					<img
						src={integration.icon}
						alt="twilio.png"
						className="size-12"
					/>
					<div>
						<Text className="text-[#09090B] font-bold text-2xl block">
							{integration.name}
						</Text>
						<Text type="secondary" className="text-sm">
							{integration.description}
						</Text>
					</div>
				</Flex>
				<div className="mt-5">
					<div className="text-[#71717A] italic mb-4">
						{__(
							'Please read the step-by-step documentation to setup Account SID and Auth Token and get the Sender Numbers for your app.',
							'quillbooking'
						)}
						<span className="cursor-pointer font-semibold underline ml-1">
							{__(
								'Go to the documentation article',
								'quillbooking'
							)}
						</span>
					</div>
					{loadingAccount ? (
						<Skeleton active paragraph={{ rows: 4 }} />
					) : (
						<Form
							form={form}
							layout="vertical"
							onFinish={handleSaveSettings}
							className="twilio-form"
							requiredMark={false}
						>
							<Form.Item
								name="sms_number"
								label={
									<div className="text-[#3F4254] font-semibold text-[16px]">
										{__('SMS Number', 'quillbooking')}
										<span className="text-[#E53E3E]">
											{__('*', 'quillbooking')}
										</span>
									</div>
								}
								rules={[
									{
										required: true,
										message: 'SMS number is required',
									},
								]}
							>
								<Input
									className="h-[48px] w-full rounded-lg"
									type="text"
									placeholder="enter your Twilio SMS Number"
								/>
							</Form.Item>
							<Form.Item
								name="whatsapp_number"
								label={
									<div className="text-[#3F4254] font-semibold text-[16px]">
										{__('WhatsApp Number', 'quillbooking')}
										<span className="text-[#E53E3E]">
											{__('*', 'quillbooking')}
										</span>
									</div>
								}
								rules={[
									{
										required: true,
										message: 'WhatsApp number is required',
									},
								]}
							>
								<Input
									className="h-[48px] w-full rounded-lg"
									type="text"
									placeholder="enter Twilio sender WhatsApp Number"
								/>
							</Form.Item>
							<Form.Item
								name="account_sid"
								label={
									<div className="text-[#3F4254] font-semibold text-[16px]">
										{__('Account SID', 'quillbooking')}
										<span className="text-[#E53E3E]">
											{__('*', 'quillbooking')}
										</span>
									</div>
								}
								rules={[
									{
										required: true,
										message: 'Account SID is required',
									},
								]}
							>
								<Input
									className="h-[48px] w-full rounded-lg"
									type="text"
									placeholder="enter your Twilio Account SID"
								/>
							</Form.Item>

							<Form.Item
								name="auth_token"
								label={
									<div className="text-[#3F4254] font-semibold text-[16px]">
										{__('Auth Token', 'quillbooking')}
										<span className="text-[#E53E3E]">
											{__('*', 'quillbooking')}
										</span>
									</div>
								}
								// بنحط label هنا لكن مش بنحط input جواه عشان نتحكم في التصميم
							>
								<Flex gap={10}>
									<Form.Item
										name="auth_token"
										noStyle
										rules={[
											{
												required: true,
												message:
													'Auth Token is required',
											},
										]}
									>
										<Input
											className="h-[48px] w-full rounded-lg"
											type="password"
											placeholder="*****************"
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

								{accountData && (
									<div className="text-[#9197A4] mt-2">
										{__(
											'Your Twilio API integration is up and running.',
											'quillbooking'
										)}
									</div>
								)}
							</Form.Item>
                            
							<div className="text-[#71717A] italic my-3">
								{__(
									'The above app secret key will be encrypted and stored securely.',
									'quillbooking'
								)}
							</div>

							<Form.Item className="mt-6 flex justify-end">
								<Button
									type="primary"
									htmlType="submit"
									loading={saving || loading}
									className={`twilio-submit-btn bg-color-primary hover:bg-color-primary-dark flex items-center h-10`}
									icon={
										saving || loading ? (
											<Spin
												size="small"
												className="mr-2"
												style={{ color: 'white' }}
											/>
										) : null
									}
								>
									{accountData
										? saving || loading
											? 'Processing...'
											: 'Update Settings'
										: saving || loading
											? 'Processing...'
											: 'Connect Twilio'}
								</Button>
							</Form.Item>
						</Form>
					)}
				</div>
			</Card>
		</div>
	);
};

export default SMSIntegration;
