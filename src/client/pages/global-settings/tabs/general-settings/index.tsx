/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Card } from 'antd';

/**
 * Internal dependencies
 */
import { useApi } from '@quillbooking/hooks';
import GeneralSettingsCard from './general-settings-card';
import PaymentSettings from './payment-settings';
import EmailingSettings from './emailing-settings';
import ThemeSettings from './theme-settings';
import { NoticeBanner } from '@quillbooking/components';
import { NoticeMessage } from '@quillbooking/client';

const SettingsShimmer = () => {
	return (
		<Flex vertical gap={20} className="w-full">
			<div className="grid grid-cols-2 gap-5 w-full">
				<Flex gap={20} vertical className="w-full">
					<Card className="w-full">
						<Flex vertical gap={20}>
							<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
							<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded mt-4" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
						</Flex>
					</Card>
					<Card className="w-full">
						<Flex vertical gap={20}>
							<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
							<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded mt-4" />
						</Flex>
					</Card>
				</Flex>
				<Flex gap={20} vertical className="w-full">
					<Card className="w-full">
						<Flex vertical gap={20}>
							<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
							<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded mt-4" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded" />
						</Flex>
					</Card>
					<Card className="w-full">
						<Flex vertical gap={20}>
							<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
							<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
							<div className="animate-pulse bg-gray-200 h-10 w-full rounded mt-4" />
						</Flex>
					</Card>
				</Flex>
			</div>
		</Flex>
	);
};

/**
 * General Settings Component
 */
const GeneralSettings = () => {
	const { callApi } = useApi();
	const { callApi: saveApi, loading: saveLoading } = useApi();
	const [loading, setLoading] = useState(true);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Function to show notice with auto-hide
	const showNotice = useCallback((noticeData: NoticeMessage) => {
		setNotice(noticeData);
		// Auto hide after 3 seconds
		setTimeout(() => {
			setNotice(null);
		}, 3000);
	}, []);

	// Unified state for all settings
	const [settings, setSettings] = useState({
		general: {
			admin_email: '',
			start_from: 'monday',
			time_format: '',
			auto_cancel_after: 60, // 1 hour default
			auto_complete_after: 120, // 2 hours default
			default_country_code: '+1',
			enable_summary_email: false,
			summary_email_frequency: 'daily',
		},
		payments: {
			currency: 'USD',
		},
		email: {
			from_name: '',
			from_email: '',
			reply_to_name: '',
			reply_to_email: '',
			use_host_from_name: false,
			use_host_reply_to_email: false,
			include_ics: true,
			footer: '',
		},
		theme: {
			color_scheme: 'system',
		},
	});

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			// Clear any existing timeout when component unmounts
			if (notice) {
				setNotice(null);
			}
		};
	}, []);

	// Fetch settings on component mount
	useEffect(() => {
		const fetchSettings = async () => {
			setLoading(true);
			callApi({
				path: 'settings',
				method: 'GET',
				onSuccess(response) {
					setSettings(response);
					setLoading(false);
				},
				onError(error) {
					showNotice({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message:
							error.message ||
							__('Failed to fetch settings', 'quillbooking'),
					});
					setLoading(false);
				},
			});
		};

		fetchSettings();
	}, [showNotice]);

	const handleSave = () => {
		saveApi({
			path: 'settings',
			method: 'POST',
			data: settings,
			onSuccess() {
				showNotice({
					type: 'success',
					title: __('Success', 'quillbooking'),
					message: __('Settings saved successfully', 'quillbooking'),
				});
			},
			onError(error) {
				showNotice({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message:
						error.message ||
						__('Failed to save settings', 'quillbooking'),
				});
			},
		});
	};

	// Function to update settings state
	const updateSettings = (section, field, value) => {
		setSettings((prevState) => ({
			...prevState,
			[section]: {
				...prevState[section],
				[field]: value,
			},
		}));
	};

	if (loading) {
		return <SettingsShimmer />;
	}

	return (
		<Flex vertical gap={20}>
			{notice && (
				<NoticeBanner
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}
			<div className="grid grid-cols-2 gap-5">
				<Flex gap={20} vertical>
					<GeneralSettingsCard
						settings={settings.general}
						updateSettings={(field, value) =>
							updateSettings('general', field, value)
						}
					/>
					<PaymentSettings
						settings={settings.payments}
						updateSettings={(field, value) =>
							updateSettings('payments', field, value)
						}
					/>
				</Flex>
				<Flex gap={20} vertical>
					<EmailingSettings
						settings={settings.email}
						updateSettings={(field, value) =>
							updateSettings('email', field, value)
						}
					/>
					{/* <ThemeSettings
						settings={settings.theme}
						updateSettings={(field, value) =>
							updateSettings('theme', field, value)
						}
					/> */}
				</Flex>
			</div>
			<Flex justify="flex-end">
				<Button
					type="primary"
					onClick={handleSave}
					disabled={saveLoading}
					className={`rounded-lg font-medium px-10 text-white ${
						saveLoading
							? 'bg-gray-400 cursor-not-allowed'
							: 'bg-color-primary '
					}`}
				>
					{__('Save', 'quillbooking')}
				</Button>
			</Flex>
		</Flex>
	);
};

export default GeneralSettings;
