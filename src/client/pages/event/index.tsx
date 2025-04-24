/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Switch } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Event as EventType } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import {
	useApi,
	useNotice,
	useBreadcrumbs,
	useNavigate,
} from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import {
	AvailabilityIcon,
	CalendarsIcon,
	EmailNotiIcon,
	IntegrationsIcon,
	PaymentSettingsIcon,
	QuestionIcon,
	SettingsIcon,
	ShareIcon,
	SmsNotiIcon,
	TrashRedIcon,
	WebhookIcon,
} from '@quillbooking/components';
import { Provider } from './state/context';
import Calendar from '../calendar';
import {
	EventDetails,
	Notifications,
	AdvancedSettings,
	Payments,
	WebhookFeeds,
	EmailNotificationTab,
} from './tabs';
import {
	Box,
	Dialog,
	DialogActions,
	DialogTitle,
	Tab,
	Tabs,
} from '@mui/material';
import { IoCloseSharp } from 'react-icons/io5';
import ShareModal from '../calendars/share-modal';
import EventFieldsTab from './tabs/fields';
import AvailabilityLimits from './tabs/availability-limits';

const Event: React.FC = () => {
	const {
		id: calendarId,
		eventId: id,
		tab,
	} = useParams<{ id: string; eventId: string; tab: string }>();
	if (!id?.match(/^\d+$/)) {
		return <Calendar />;
	}

	const childRef = useRef<any>(null);
	const siteUrl = ConfigAPI.getSiteUrl();
	const { callApi, loading } = useApi();
	const { errorNotice, successNotice } = useNotice();
	const [event, setEvent] = useState<EventType | null>(null);
	const [open, setOpen] = useState(!!id);
	const [checked, setChecked] = useState(true);
	const [modalShareId, setModalShareId] = useState<string | null>(null);
	const [saveDisabled, setSaveDisabled] = useState(true);

	const navigate = useNavigate();
	const setBreadcrumbs = useBreadcrumbs();
	if (!id) {
		return null;
	}

	const fetchEvent = async () => {
		callApi({
			path: `events/${id}`,
			method: 'GET',
			onSuccess(response: EventType) {
				setEvent(response);
				setBreadcrumbs([
					{
						path: `calendars/${calendarId}`,
						title: response.calendar.name,
					},
					{
						path: `calendars/${calendarId}/${id}`,
						title: response.name,
					},
				]);
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	useEffect(() => {
		fetchEvent();
	}, []);

	useEffect(() => {
		const handleTabClose = (event: BeforeUnloadEvent) => {
			if (saveDisabled) {
				return;
			}
			// If discardChanges returns false (meaning changes are unsaved),
			// then we want to prompt the user before reloading/closing.
			if (!discardChanges()) {
				event.preventDefault();
				// Setting returnValue triggers the browser's confirmation dialog.
				event.returnValue = '';
			}
		};
		window.addEventListener('beforeunload', handleTabClose);

		return () => {
			window.removeEventListener('beforeunload', handleTabClose);
		};
	}, [saveDisabled]);

	const handleDeleteEvent = () => {
		if (!event?.id) return;

		if (
			!window.confirm(
				__(
					'Are you sure you want to delete this event?',
					'quillbooking'
				)
			)
		) {
			return; // Exit if the user cancels
		}

		callApi({
			path: `events/${event.id}`,
			method: 'DELETE',
			onSuccess: () => {
				successNotice(__('Event deleted successfully', 'quillbooking'));
				setOpen(false);
				navigate('calendars'); // Redirect after deletion
			},
			onError: (error: string) => {
				errorNotice(error);
			},
		});
	};

	// const saveSettings = () => {
	// 	//if (!validate() || loading) return;
	// 	callApi({
	// 		path: `events/${event.id}`,
	// 		method: 'PUT',
	// 		data: event,
	// 		onSuccess: () => {
	// 			successNotice(
	// 				__('Event settings saved successfully', 'quillbooking')
	// 			);
	// 			setOpen(false);
	// 			navigate('calendars');
	// 		},
	// 		onError: (error: string) => {
	// 			errorNotice(error);
	// 		},
	// 	});
	// };

	const handleClose = () => {
		if (discardChanges()) {
			setOpen(false);
			navigate('calendars');
		}
	};

	const handleChange = (checked: boolean) => {
		setChecked(checked);
	};

	const handleSave = () => {
		if (childRef.current) {
			childRef.current.saveSettings();
		}
	};

	const tabs = [
		{
			key: 'details',
			label: __('Event Details', 'quillbooking'),
			children: event ? (
				<EventDetails
					onKeepDialogOpen={() => setOpen(true)}
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			) : null,
			icon: <CalendarsIcon />,
		},
		{
			key: 'availability',
			label: __('Availability & Limits', 'quillbooking'),
			children: <AvailabilityLimits />,
			icon: <AvailabilityIcon />,
		},
		{
			key: 'question',
			label: __('Question Settings', 'quillbooking'),
			children: event ? (
				<EventFieldsTab
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			) : null,
			icon: <QuestionIcon />,
		},
		{
			key: 'email-notifications',
			label: __('Email Notification', 'quillbooking'),
			children: <EmailNotificationTab
				//notificationType="email"
				ref={childRef}
				disabled={saveDisabled}
				setDisabled={setSaveDisabled}
			/>,
			icon: <EmailNotiIcon />,
		},
		{
			key: 'sms-notifications',
			label: __('SMS Notification', 'quillbooking'),
			children: <Notifications
				notificationType="sms"
				ref={childRef}
				disabled={saveDisabled}
				setDisabled={setSaveDisabled}
			/>,
			icon: <SmsNotiIcon />,
		},
		{
			key: 'advanced-settings',
			label: __('Advanced Settings', 'quillbooking'),
			children: event ? (
				<AdvancedSettings
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			) : null,
			icon: <SettingsIcon />,
		},
		{
			key: 'payment-settings',
			label: __('Payments Settings', 'quillbooking'),
			children: event ? (
				<Payments
					ref={childRef}
					disabled={saveDisabled}
					setDisabled={setSaveDisabled}
				/>
			) : null,
			icon: <PaymentSettingsIcon />,
		},
		{
			key: 'webhooks-feeds',
			label: __('Webhooks Feeds', 'quillbooking'),
			children: <WebhookFeeds />,
			icon: <WebhookIcon />,
		},
		// {
		// 	key: 'integrations',
		// 	label: __('Integrations', 'quillbooking'),
		// 	children: <Fields />,
		// 	icon: <IntegrationsIcon />,
		// },
	];
	const [activeTab, setActiveTab] = useState(tab || 'details');

	useEffect(() => {
		if (tab) {
			console.log('URL tab changed to:', tab); // Debugging log
			setActiveTab(tab);
		}
	}, [tab]);

	const discardChanges = (): boolean => {
		if (saveDisabled) {
			return true;
		}

		const confirmed = window.confirm(
			__(
				'You have unsaved changes. Switching tabs will discard them. Do you want to continue?',
				'quillbooking'
			)
		);

		if (confirmed) {
			return true;
		}

		return false;
	};

	const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
		console.log('Switching to tab:', newValue);

		if (!calendarId || !id) {
			console.error('Missing calendar ID or event ID');
			return;
		}

		if (discardChanges()) {
			setSaveDisabled(true);
			setActiveTab(newValue);
			navigate(`calendars/${calendarId}/events/${id}/${newValue}`);
		}
	};

	return (
		<Provider
			value={{
				state: event,
				actions: {
					setEvent,
				},
			}}
		>
			<Dialog
				open={open}
				onClose={handleClose}
				fullScreen
				className='z-[1000000000000000000]'
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
									{__('Event Setup', 'quillbooking')}
								</div>
							</DialogActions>
						</Flex>
						<Flex gap={24} className="items-center">
							<Flex gap={16} className="items-center">
								<Switch
									checked={checked}
									onChange={handleChange}
									className={
										checked
											? 'bg-color-primary'
											: 'bg-gray-400'
									}
								/>
								<DialogActions
									className="cursor-pointer"
									color="primary"
									onClick={handleDeleteEvent}
								>
									<TrashRedIcon />
								</DialogActions>
								<Button
									type="text"
									icon={<ShareIcon />}
									style={{ paddingLeft: 0, paddingRight: 0 }}
									onClick={() => setModalShareId(id)}
								>
									{__('Share', 'quillbooking')}
								</Button>
								{modalShareId !== null && (
									<ShareModal
										open={modalShareId !== null}
										onClose={() => setModalShareId(null)}
										url={`${siteUrl}?quillbooking_event=${event?.slug}`}
									/>
								)}
							</Flex>
							<Button
								type="primary"
								size="middle"
								// onClick={saveSettings}
								onClick={handleSave}
								loading={loading}
								disabled={saveDisabled}
								className={`rounded-lg font-[500] text-white ${saveDisabled
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-color-primary '
									}`}
							>
								{__('Save Changes', 'quillbooking')}
							</Button>
						</Flex>
					</Flex>
				</DialogTitle>
				<div className="quillbooking-event">
					<Box
						sx={{
							width: '100%',
							bgcolor: '#FBFBFB',
							display: 'flex',
							justifyContent: 'center',
							padding: '20px 16px',
						}}
					>
						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							variant="scrollable"
							//scrollButtons="auto"
							sx={{
								'& .MuiTabs-indicator': { display: 'none' },
							}}
						>
							{tabs.map((tab) => (
								<Tab
									key={tab.key}
									label={tab.label}
									value={tab.key}
									icon={tab.icon}
									// onClick={() => setActiveTab(tab.key)}
									iconPosition="start" // Ensures icon is placed before the label
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px', // Ensures spacing between icon & label
										bgcolor:
											activeTab === tab.key
												? '#953AE4'
												: 'transparent',
										color: '#292D32',
										borderRadius: '16px',
										textTransform: 'capitalize',
										px: 3,
										minHeight: '48px', // Force tab height
										height: '48px', // Force height to override default
										mx: 1,
										fontWeight: '700',
										transition: '0.3s',
										'&.Mui-selected': { color: 'white' },
									}}
								/>
							))}
						</Tabs>
					</Box>

					<div style={{ padding: '20px' }}>
						{tabs.find((t) => t.key === activeTab)?.children || (
							<p>No content available</p>
						)}
					</div>

					{/* <Tabs
                        defaultActiveKey={tab || 'details'}
                        activeKey={tab || 'details'}
                        items={tabs}
                        tabPosition="top"
                        className="custom-tabs"
                        style={{borderBottom:"none", outline:"none"}}
                        //tabBarStyle={{ width: "100%", backgroundColor: "#FBFBFB", borderBottom: "none" }}
                        onChange={(key) => {
                            if (event) {
                                navigate(`calendars/${event.calendar.id}/events/${event.id}/${key}`);
                            }
                        }}
                    /> */}
				</div>
			</Dialog>
		</Provider>
	);
};

export default Event;
