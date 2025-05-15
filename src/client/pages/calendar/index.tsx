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
import type { Calendar as CalendarType } from '@quillbooking/client';
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
	const navigate = useNavigate();
	const setBreadcrumbs = useBreadcrumbs();
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
		setOpen(false);
		navigate('calendars');
	};

	const saveSettings = () => {
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
			setErrorMessage(__('Please select a timezone.', 'quillbooking'));
			setShowErrorBanner(true);
			setTimeout(() => setShowErrorBanner(false), 5000);
			return;
		}

		// Save settings
		callApi({
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
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'general':
				return <GeneralSettings />;
			case 'integrations':
				return <Integrations />;
			default:
				return <GeneralSettings />;
		}
	};

	const tabItems = [
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
							<Flex
								gap={15}
								align="center"
								justify="flex-start"
							>
								{tabItems.map(
									({ key, label, icon }) => (
										<Button
											key={key}
											type="text"
											onClick={() =>
												setActiveTab(key)
											}
											className={`${activeTab === key ? 'bg-color-tertiary' : ''}`}
										>
											<TabButtons
												label={label}
												icon={icon}
												isActive={
													activeTab === key
												}
											/>
										</Button>
									)
								)}
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
