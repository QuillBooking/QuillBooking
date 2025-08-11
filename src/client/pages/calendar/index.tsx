/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Skeleton, Card } from 'antd';
import { IoCloseSharp } from 'react-icons/io5';
import { Box, Dialog, DialogActions, DialogTitle } from '@mui/material';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Calendar as CalendarType } from '@quillbooking/types';
import {
	useApi,
	useNotice,
	useBreadcrumbs,
	useNavigate,
} from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import { Provider } from './state/context';
import { GeneralSettings, Integrations } from './tabs';
import {
	ShareIcon,
	SettingsIcon,
	UpcomingCalendarIcon,
	TabButtons,
} from '@quillbooking/components';
import { NoticeBanner } from '@quillbooking/components';

export const UnifiedShimmerLoader = () => (
	<div className="space-y-6 w-full">
		<Card className="p-6">
			<div className="grid grid-cols-2 gap-6">
				<div>
					<Skeleton active paragraph={{ rows: 2 }} />
					<div className="mt-4">
						<Skeleton active paragraph={{ rows: 1 }} />
					</div>
				</div>
				<div>
					<Skeleton active paragraph={{ rows: 4 }} />
				</div>
			</div>
		</Card>
	</div>
);

/**
 * Main Calendars Component.
 */
const Calendar: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const { callApi, loading } = useApi();
	const { errorNotice } = useNotice();
	const [calendar, setCalendar] = useState<CalendarType | null>(null);
	const [originalCalendar, setOriginalCalendar] =
		useState<CalendarType | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [saveDisabled, setSaveDisabled] = useState(true);
	const [open, setOpen] = useState(!!id);
	const [showSavedBanner, setShowSavedBanner] = useState(false);
	const [showErrorBanner, setShowErrorBanner] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [activeTab, setActiveTab] = useState('general');
	const [hasSelectedCalendar, setHasSelectedCalendar] = useState(false);
	const [hasAccounts, setHasAccounts] = useState(false);
	const navigate = useNavigate();
	const setBreadcrumbs = useBreadcrumbs();

	// Get URL parameters
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get('tab');
		if (tabParam === 'integrations') {
			// Check if calendar is loaded and is team type
			if (calendar?.type === 'team') {
				// Remove integrations tab from URL and set general tab
				urlParams.delete('tab');
				urlParams.delete('subtab');
				const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
				window.history.replaceState({}, '', newUrl);
				setActiveTab('general');
			} else {
				setActiveTab('integrations');
			}
		}
	}, [calendar]);

	// Prevent team calendars from accessing integrations tab
	useEffect(() => {
		if (calendar?.type === 'team' && activeTab === 'integrations') {
			// Redirect to general tab immediately
			const urlParams = new URLSearchParams(window.location.search);
			urlParams.delete('tab');
			urlParams.delete('subtab');
			const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
			window.history.replaceState({}, '', newUrl);
			setActiveTab('general');
		}
	}, [calendar, activeTab]);

	if (!id) {
		return null;
	}

	// Add effect to update saveDisabled based on changes
	useEffect(() => {
		if (!calendar || !originalCalendar) {
			setSaveDisabled(true);
			return;
		}

		// Check if required fields are present
		const hasRequiredFields = calendar.name && calendar.timezone;

		// Check if any changes were made by comparing with original data
		const hasChanges =
			JSON.stringify(calendar) !== JSON.stringify(originalCalendar);

		setSaveDisabled(!hasRequiredFields || !hasChanges);
	}, [calendar, originalCalendar]);

	const fetchCalendar = async () => {
		setIsLoading(true);
		callApi({
			path: `calendars/${id}`,
			method: 'GET',
			onSuccess(response) {
				setCalendar(response);
				setOriginalCalendar(response); // Store the original state
				setBreadcrumbs([
					{
						path: `calendars/${id}`,
						title: response.name,
					},
				]);
				setIsLoading(false);
			},
			onError(error) {
				errorNotice(error.message);
				setIsLoading(false);
			},
		});
	};

	useEffect(() => {
		fetchCalendar();
	}, []);

	const handleClose = () => {
		if (hasAccounts && !hasSelectedCalendar) {
			window.alert(
				__(
					'Please select a remote calendar before closing the settings.',
					'quillbooking'
				)
			);
			return;
		}

		setOpen(false);
		navigate('calendars');
	};

	const saveSettings = async () => {
		try {
			if (!calendar) return;

			// Validate
			if (!calendar.name) {
				setErrorMessage(
					__('Please enter a name for the calendar.', 'quillbooking')
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				return;
			}

			if (!calendar.timezone) {
				setErrorMessage(
					__('Please select a timezone.', 'quillbooking')
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				return;
			}

			try {
				// Save settings
				await callApi({
					path: `calendars/${id}`,
					method: 'PUT',
					data: calendar,
					onSuccess: () => {
						setShowSavedBanner(true);
						setTimeout(() => setShowSavedBanner(false), 5000);
						setSaveDisabled(true);
						setOriginalCalendar(calendar);
					},
					onError: (error) => {
						setErrorMessage(
							error.message ||
								__('Failed to save settings.', 'quillbooking')
						);
						setShowErrorBanner(true);
						setTimeout(() => setShowErrorBanner(false), 5000);
						setSaveDisabled(false);
					},
				});
			} catch (apiError) {
				console.error('API call failed:', apiError);
				setErrorMessage(
					__(
						'An unexpected error occurred during the API call.',
						'quillbooking'
					)
				);
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				setSaveDisabled(false);
			}
		} catch (error) {
			console.error('Unexpected error in saveSettings:', error);
			setErrorMessage(
				__(
					'An unexpected error occurred while saving settings.',
					'quillbooking'
				)
			);
			setShowErrorBanner(true);
			setTimeout(() => setShowErrorBanner(false), 5000);
			setSaveDisabled(false);
		}
	};
	const renderTabContent = () => {
		switch (activeTab) {
			case 'general':
				return <GeneralSettings />;
			case 'integrations':
				// Don't render integrations for team calendars
				if (calendar?.type === 'team') {
					return <GeneralSettings />;
				}
				return (
					<Integrations
						hasSelectedCalendar={hasSelectedCalendar}
						hasAccounts={hasAccounts}
						setHasSelectedCalendar={setHasSelectedCalendar}
						setHasAccounts={setHasAccounts}
					/>
				);
			default:
				return <GeneralSettings />;
		}
	};

	const generalTabItems = [
		{
			key: 'general',
			label: __('General Host Settings', 'quillbooking'),
			icon: <SettingsIcon width={20} height={20} />,
		},
		{
			key: 'integrations',
			label: __('Remote Calendars and Conferencing', 'quillbooking'),
			icon: <UpcomingCalendarIcon width={20} height={20} />,
		},
	];

	const teamTabItems = [
		{
			key: 'general',
			label: __('General Host Settings', 'quillbooking'),
			icon: <SettingsIcon width={20} height={20} />,
		},
	];
	const tabItems = calendar?.type === 'team' ? teamTabItems : generalTabItems;

	const handleTabClick = (key: string) => {
		// Check if we're trying to change tabs while in integrations with accounts but no calendar
		if (
			activeTab === 'integrations' &&
			hasAccounts &&
			!hasSelectedCalendar
		) {
			window.alert(
				__(
					'Please select a remote calendar before changing tabs.',
					'quillbooking'
				)
			);
			return;
		}

		// Update URL with the new tab
		const urlParams = new URLSearchParams(window.location.search);
		if (key === 'integrations') {
			urlParams.set('tab', 'integrations');
		} else {
			urlParams.delete('tab');
		}
		const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
		window.history.pushState({}, '', newUrl);

		setActiveTab(key);
	};

	return (
		<Provider
			value={{
				state: calendar,
				actions: {
					setCalendar,
				},
			}}
		>
			<Dialog
				open={open}
				onClose={handleClose}
				fullScreen
				className="z-[120000]"
			>
				<DialogTitle className="border-b" sx={{ padding: '10px 16px' }}>
					<Flex className="justify-between items-center">
						<Flex gap={10}>
							<DialogActions>
								<DialogActions
									className="cursor-pointer"
									onClick={handleClose}
									color="primary"
								>
									<IoCloseSharp />
								</DialogActions>
								<div className="text-[#09090B] text-[24px] font-[500]">
									{__('Calendar Settings', 'quillbooking')}
								</div>
							</DialogActions>
						</Flex>
						<Flex gap={20} className="items-center">
							<Button
								type="text"
								icon={<ShareIcon />}
								className="p-0"
							>
								{__('View', 'quillbooking')}
							</Button>
							<Button
								type="primary"
								size="middle"
								onClick={saveSettings}
								loading={loading}
								disabled={saveDisabled}
								className="border-none shadow-none"
							>
								{__('Save Setting Changes', 'quillbooking')}
							</Button>
						</Flex>
					</Flex>
				</DialogTitle>
				<div className="quillbooking-event">
					<Box className="px-20 py-5">
						<Card className="mb-5">
							<Flex gap={15} align="center" justify="flex-start">
								{tabItems.map(({ key, label, icon }) => {
									return (
										<Button
											key={key}
											type="text"
											onClick={() => handleTabClick(key)}
											className={`${activeTab === key ? 'bg-color-tertiary' : ''}`}
										>
											<TabButtons
												label={label}
												icon={icon}
												isActive={activeTab === key}
											/>
										</Button>
									);
								})}
							</Flex>
						</Card>
						{isLoading ? (
							<UnifiedShimmerLoader />
						) : (
							<>
								{showSavedBanner && (
									<NoticeBanner
										notice={{
											type: 'success',
											title: __(
												'Successfully Updated',
												'quillbooking'
											),
											message: __(
												'The Calendar settings have been updated successfully.',
												'quillbooking'
											),
										}}
										closeNotice={() =>
											setShowSavedBanner(false)
										}
									/>
								)}
								{showErrorBanner && (
									<NoticeBanner
										notice={{
											type: 'error',
											title: __('Error', 'quillbooking'),
											message: errorMessage,
										}}
										closeNotice={() =>
											setShowErrorBanner(false)
										}
									/>
								)}
								{renderTabContent()}
							</>
						)}
					</Box>
				</div>
			</Dialog>
		</Provider>
	);
};

export default Calendar;
