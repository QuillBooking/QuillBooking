/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Button, Flex, Form, Skeleton, Typography, Spin } from 'antd';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
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
	const [previousSlug, setPreviousSlug] = useState<string | null>(slug);
	const [loadingAccount, setLoadingAccount] = useState(true);
	const [isProVersion, setIsProVersion] = useState<boolean>(false);

	// Use a ref to track the last processed slug to prevent redundant updates
	const lastProcessedSlugRef = useRef<string | null>(slug);

	// Reset form when integration changes
	useEffect(() => {
		if (slug !== previousSlug) {
			form.resetFields();
			setPreviousSlug(slug);
			lastProcessedSlugRef.current = slug;
		}
	}, [slug, previousSlug, form]);

	// Listen for tab changes from URL
	useEffect(() => {
		const handleTabChange = (event?: Event | CustomEvent<any>) => {
			// Check if this is a custom event with detail
			const customEvent = event as CustomEvent<any>;
			if (customEvent.detail) {
				// If this event was triggered by the parent component, ignore it to prevent loops
				if (
					customEvent.detail.source ===
					'conferencing-calendars-component'
				) {
					return;
				}
			}

			// Get the subtab from the URL
			const urlParams = new URLSearchParams(window.location.search);
			const subtabParam = urlParams.get('subtab');

			// Only update if the subtab is different from both current slug and previous slug
			// and hasn't been processed yet
			if (
				subtabParam &&
				subtabParam !== slug &&
				subtabParam !== previousSlug &&
				subtabParam !== lastProcessedSlugRef.current
			) {
				lastProcessedSlugRef.current = subtabParam;
				setPreviousSlug(subtabParam);
			}
		};

		// Add event listener for URL changes
		window.addEventListener('popstate', handleTabChange);
		// Listen for custom event from parent component
		window.addEventListener('quillbooking-tab-changed', handleTabChange);

		return () => {
			window.removeEventListener('popstate', handleTabChange);
			window.removeEventListener(
				'quillbooking-tab-changed',
				handleTabChange
			);
		};
	}, [slug, previousSlug]);

	useEffect(() => {
		fetchCalendars();
		setIsProVersion(
			Boolean(applyFilters('quillbooking.integration', false))
		);
	}, []);

	// Set form values for non-Zoom integrations (Zoom handles its own form values)
	useEffect(() => {
		if (slug === 'zoom') {
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
	}, [integration, form, slug, CACHE_TIME_OPTIONS]);

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

	const handleSaveSettings = (values: any) => {
		console.log('Submitted values:', values);
		// Log the form field value directly from the form instance
		console.log('Direct form value:', form.getFieldValue('cache_time'));

		// Make sure we're getting the latest value
		const formValues = form.getFieldsValue();
		console.log('All form values:', formValues);

		// Apply any filters from plugins to modify the form values before submission
		const processedValues = applyFilters(
			'quillbooking.before_save_settings',
			formValues,
			form,
			slug,
			CACHE_TIME_OPTIONS
		);

		console.log('Processed values after filter:', processedValues);
		if (slug === 'zoom') {
		}

		return;
		form.submit();

		setSaving(true);
		callApi({
			path: `integrations/${slug}`,
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
		switch (slug) {
			case 'zoom':
				return (
					<ZoomFields
						fields={integration.fields}
						calendar={calendar}
						form={form}
						handleNavigation={handleNavigation}
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
						{isProVersion && (
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
						)}

						{!isProVersion && renderFields()}
					</div>
				</>
			)}
		</Card>
	);
};

export default ConnectionCard;
