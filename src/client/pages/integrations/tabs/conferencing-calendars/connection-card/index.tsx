/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Card,
	Button,
	Flex,
	Form,
	Input,
	Select,
	Skeleton,
	Radio,
	Typography,
	Divider,
	Spin,
} from 'antd';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { useApi, useNotice, useCopyToClipboard } from '@quillbooking/hooks';
import { CloneIcon } from '@quillbooking/components';

const { Text } = Typography;

export interface ConnectionCardProps {
	slug: string | null;
	integration: Integration | undefined;
	isLoading?: boolean;
}

const CACHE_TIME_OPTIONS = [
	{ value: '1', label: '1 Minute' },
	{ value: '5', label: '5 Minutes' },
	{ value: '10', label: '10 Minutes' },
	{ value: '15', label: '15 Minutes' },
];

const ZoomFields = ({ fields }: { fields: any }) => (
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
						<div>
							<Text type="secondary" className="text-xs">
								{field.help_text ||
									`You Can Find Your ${field.label.replace('*', '')} In Your Zoom App Settings.`}
							</Text>
						</div>
					}
				>
					{field.type === 'password' ? (
						<Input.Password
							id={`zoom-${key}`}
							placeholder={field.placeholder}
							className="rounded-lg h-[48px]"
						/>
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
					' The above app secret key will be encrypted and stored securely.',
					'quillbooking'
				)}
			</div>
		</Flex>
	</div>
);

const GoogleFields = () => (
	<div className="google-fields">
		<Flex vertical gap={10} className="w-full">
			<div className="text-[#71717A] italic">
				{__(
					'Your Google Calendar API configuration is already done. You can connect your Google Calendar from your host settings.',
					'quillbooking'
				)}
				<span className="cursor-pointer font-semibold underline ml-1">
					{__('Read the documentation', 'quillbooking')}
				</span>
			</div>

			<Form.Item
				name="cache_time"
				label={
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Caching Time', 'quillbooking')}
						<span className="text-[#E53E3E]">
							{__('*', 'quillbooking')}
						</span>
					</div>
				}
			>
				<Select
					options={CACHE_TIME_OPTIONS}
					defaultValue="5"
					className="w-full h-[48px] rounded-lg mb-2"
				/>
				<div className="text-[#71717A] italic">
					{__(
						'Select how many minutes the Google Calendar / Meet events API call will be cached. Recommended 5/10 minutes. If you add lots of manual events in Google Calendar then you may lower this value',
						'quillbooking'
					)}
				</div>
			</Form.Item>
		</Flex>
	</div>
);


const OutlookFields = () => (
	<div className="outlook-fields">
		<Flex vertical gap={10} className="w-full">
			<div className="text-[#71717A] italic">
				{__(
					'Your outlook API configuration is already. You can connect your outlook calendar from your host settings.',
					'quillbooking'
				)}
				<span className="cursor-pointer font-semibold underline ml-1">
					{__('Read the documentation', 'quillbooking')}
				</span>
			</div>

			<Form.Item
				name="cache_time"
				label={
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Caching Time', 'quillbooking')}
						<span className="text-[#E53E3E]">
							{__('*', 'quillbooking')}
						</span>
					</div>
				}
			>
				<Select
					options={CACHE_TIME_OPTIONS}
					defaultValue="5"
					className="w-full h-[48px] rounded-lg mb-2"
				/>
				<div className="text-[#71717A] italic">
					{__(
						'Select how many minutes the Outlook Calendar / MS Teams events API call will be cached. Recommended 5/10 minutes. If you add lots of manual events in Outlook Calendar / MS Teams then you may lower this value',
						'quillbooking'
					)}
				</div>
			</Form.Item>
		</Flex>
	</div>
);

const AppleFields = () => (
	<div className="apple-fields">
		<Flex vertical gap={10} className="w-full">
			<div className="text-[#71717A] italic">
				{__(
					'Your Apple Calendar API configuration is already. You can connect your Apple Calendar from your host settings.',
					'quillbooking'
				)}
				<span className="cursor-pointer font-semibold underline ml-1">
					{__('Read the documentation', 'quillbooking')}
				</span>
			</div>

			<Form.Item
				name="cache_time"
				label={
					<div className="text-[#3F4254] font-semibold text-[16px]">
						{__('Caching Time', 'quillbooking')}
						<span className="text-[#E53E3E]">
							{__('*', 'quillbooking')}
						</span>
					</div>
				}
			>
				<Select
					options={CACHE_TIME_OPTIONS}
					defaultValue="5"
					className="w-full h-[48px] rounded-lg mb-2"
				/>
				<div className="text-[#71717A] italic">
					{__(
						'Select how many minutes the Apple Calendar events API call will be cached. Recommended 5/10 minutes. If you add lots of manual events in Apple Calendar then you may lower this value',
						'quillbooking'
					)}
				</div>
			</Form.Item>
		</Flex>
	</div>
);

const ConnectionCard: React.FC<ConnectionCardProps> = ({
	slug,
	integration,
	isLoading = false,
}) => {
	if (!slug || !integration) return null;

	const [form] = Form.useForm();
	const { callApi, loading } = useApi();
	const { successNotice, errorNotice } = useNotice();
	const [saving, setSaving] = useState(false);

	const [previousSlug, setPreviousSlug] = useState<string | null>(slug);

	useEffect(() => {
	
		if (slug !== previousSlug) {
			form.resetFields();
			setPreviousSlug(slug);
		}

	
		if (integration && integration.settings && integration.settings.app) {
			form.setFieldsValue(integration.settings.app);
		}
	}, [integration, form, slug, previousSlug]);

	const handleSaveSettings = (values: any) => {
		setSaving(true);
		callApi({
			path: `integrations/${slug}`,
			method: 'POST',
			data: { settings: { app: values } },
			onSuccess() {
				successNotice(
					__(
						'Integration settings saved successfully',
						'quillbooking'
					)
				);
				setSaving(false);
			},
			onError(error) {
				errorNotice(
					error.message ||
						__(
							'Failed to save integration settings',
							'quillbooking'
						)
				);
				setSaving(false);
			},
		});
	};

	const renderFields = () => {
		switch (slug) {
			case 'zoom':
				return <ZoomFields fields={integration.fields} />;
			case 'google':
				return <GoogleFields />;
			case 'outlook':
				return <OutlookFields />;
			case 'apple':
				return <AppleFields />;
			default:
				return null;
		}
	};

	const getSubmitButtonText = () => {
		switch (slug) {
			case 'zoom':
				return 'Save & Validate Credentials';
			case 'google':
			case 'outlook':
			case 'apple':
				return `Update ${integration.name} Caching Time`;
			default:
				return 'Save Settings';
		}
	};

	return (
		<Card className="rounded-lg mb-6 w-full">
			{isLoading ? (
				<Flex vertical gap={20}>
					<Skeleton.Avatar size={64} active />
					<Skeleton active paragraph={{ rows: 4 }} />
				</Flex>
			) : (
				<>
					<Flex
						align="center"
						gap={16}
						className="p-0 text-color-primary-text border-b pb-5"
					>
						<img
							src={integration.icon}
							alt={`${slug}.png`}
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
						<Form
							form={form}
							layout="vertical"
							onFinish={handleSaveSettings}
							className={`${slug}-form`}
						
							name={`${slug}-connection-form`}
				
							preserve={false}
						>
							{renderFields()}
							<Form.Item className="mt-6 flex justify-end">
								<Button
									type="primary"
									htmlType="submit"
									loading={saving || loading}
									className={`${slug}-submit-btn bg-color-primary hover:bg-color-primary-dark flex items-center h-10`}
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
									{saving || loading
										? 'Processing...'
										: getSubmitButtonText()}
								</Button>
							</Form.Item>
						</Form>
					</div>
				</>
			)}
		</Card>
	);
};

export default ConnectionCard;
