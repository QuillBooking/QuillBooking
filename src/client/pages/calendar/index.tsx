/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Skeleton } from 'antd';
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
import { GeneralSettings } from './tabs';
import { ShareIcon } from '@quillbooking/components';
import { NoticeBanner } from '@quillbooking/components';

/**
 * Main Calendars Component.
 */
const Calendar: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
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

		console.log(calendar);

		// Validate
		if (!calendar.name) {
			setErrorMessage(__('Please enter a name for the calendar.', 'quillbooking'));
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
				setErrorMessage(error.message || __('Failed to save settings.', 'quillbooking'));
				setShowErrorBanner(true);
				setTimeout(() => setShowErrorBanner(false), 5000);
				setSaveDisabled(false);
			},
		});
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
									{__('Host Settings', 'quillbooking')}
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
					<Box className="px-14 py-5">
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
								closeNotice={() => setShowSavedBanner(false)}
							/>
						)}
						{showErrorBanner && (
							<NoticeBanner
								notice={{
									type: 'error',
									title: __('Error', 'quillbooking'),
									message: errorMessage,
								}}
								closeNotice={() => setShowErrorBanner(false)}
							/>
						)}
						{isLoading ? (
							<div className="space-y-6">
								<Skeleton active paragraph={{ rows: 4 }} />
								<Skeleton active paragraph={{ rows: 3 }} />
								<Skeleton active paragraph={{ rows: 2 }} />
							</div>
						) : (
							<GeneralSettings />
						)}
					</Box>
				</div>
			</Dialog>
		</Provider>
	);
};

export default Calendar;
