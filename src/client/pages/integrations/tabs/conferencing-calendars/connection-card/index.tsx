/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Button, Flex, Form, Skeleton, Typography, Spin } from 'antd';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { useApi, useNotice, useNavigate, useTabs } from '@quillbooking/hooks';
import ZoomFields from './fields/ZoomFields';
import GoogleFields from './fields/GoogleFields';
import OutlookFields from './fields/OutlookFields';
import AppleFields from './fields/AppleFields';
import { addQueryArgs } from '@wordpress/url';
import { applyFilters } from '@wordpress/hooks';

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

const ConnectionCard: React.FC<ConnectionCardProps> = ({
	slug,
	integration,
	isLoading = false,
}) => {
	if (!slug || !integration) return null;

	const [form] = Form.useForm();
	const navigate = useNavigate();
	const { callApi, loading } = useApi();
	const { successNotice, errorNotice } = useNotice();
	const [saving, setSaving] = useState(false);
	const [calendar, setCalendar] = useState<any>(null);
	const [isProVersion, setIsProVersion] = useState<boolean>(false);
	const [hasConnectedZoomAccounts, setHasConnectedZoomAccounts] =
		useState<boolean>(false);

	// Use useTabs hook for tab management
	const { activeTab } = useTabs({
		defaultTab: slug || '',
		urlParam: 'subtab',
		updateUrl: false, // Parent component handles URL updates
	});

	// Reset form when integration changes
	useEffect(() => {
		if (slug) {
			form.resetFields();
		}
	}, [slug, form]);

	useEffect(() => {
		fetchCalendars();
		setIsProVersion(
			Boolean(applyFilters('quillbooking.integration', false))
		);
	}, []);

	// Set form values for non-Zoom integrations (Zoom handles its own form values)
	useEffect(() => {
		const currentTab = activeTab || slug;
		if (currentTab === 'zoom') {
			return;
		}

		if (integration?.settings?.app) {
			const appSettings = integration.settings.app as Record<string, any>;
			form.setFieldsValue({
				...appSettings,
				cache_time:
					appSettings.cache_time ?? CACHE_TIME_OPTIONS[1].value,
			});
		} else {
			// If no settings exist yet, initialize with default cache_time
			form.setFieldsValue({
				cache_time: CACHE_TIME_OPTIONS[1].value,
			});
		}
	}, [integration, form, activeTab, slug, CACHE_TIME_OPTIONS]);

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
					errorNotice(
						__('No calendars found for this user', 'quillbooking')
					);
				}
			},
			onError: (error) => {
				errorNotice(
					error.message ||
						__('Failed to fetch calendars', 'quillbooking')
				);
			},
		});
	};

	const handleSaveSettings = () => {
		const currentTab = activeTab || slug;
		const formValues = form.getFieldsValue();
		const processedValues = applyFilters(
			'quillbooking.before_save_settings',
			formValues,
			form,
			currentTab,
			CACHE_TIME_OPTIONS
		);

		setSaving(true);
		callApi({
			path: `integrations/${currentTab}`,
			method: 'POST',
			data: { settings: { app: processedValues } },
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

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	const renderFields = () => {
		const currentTab = activeTab || slug;
		switch (currentTab) {
			case 'zoom':
				return (
					<ZoomFields
						fields={integration.fields}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
						onAccountsChange={setHasConnectedZoomAccounts}
					/>
				);
			case 'google':
				return (
					<GoogleFields
						CACHE_TIME_OPTIONS={CACHE_TIME_OPTIONS}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
					/>
				);
			case 'outlook':
				return (
					<OutlookFields
						CACHE_TIME_OPTIONS={CACHE_TIME_OPTIONS}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
					/>
				);
			case 'apple':
				return (
					<AppleFields
						CACHE_TIME_OPTIONS={CACHE_TIME_OPTIONS}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
					/>
				);
			default:
				return null;
		}
	};

	const getSubmitButtonText = () => {
		const currentTab = activeTab || slug;
		switch (currentTab) {
			case 'zoom':
				// Hide button when there are connected Zoom accounts
				return hasConnectedZoomAccounts
					? null
					: 'Save & Validate Credentials';

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
						{isProVersion && (
							<Form
								form={form}
								layout="vertical"
								onFinish={handleSaveSettings}
								className={`${activeTab || slug}-form`}
								name={`${activeTab || slug}-connection-form`}
								preserve={false}
							>
								{renderFields()}
								{getSubmitButtonText() && (
									<Form.Item className="mt-6 flex justify-end">
										<Button
											type="primary"
											htmlType="submit"
											loading={saving || loading}
											className={`${activeTab || slug}-submit-btn bg-color-primary hover:bg-color-primary-dark flex items-center h-10`}
											icon={
												saving || loading ? (
													<Spin
														size="small"
														className="mr-2"
														style={{
															color: 'white',
														}}
													/>
												) : null
											}
										>
											{saving || loading
												? 'Processing...'
												: getSubmitButtonText()}
										</Button>
									</Form.Item>
								)}
							</Form>
						)}

						{!isProVersion && renderFields()}
					</div>
				</>
			)}
		</Card>
	);
};

export default ConnectionCard;
