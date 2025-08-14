/**
 * WordPress dependencies
 */
import {
	useState,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Card, Flex, Switch } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNavigate, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import SmsNotificationCard from './sms-notification-card';
import { NotificationType } from '@quillbooking/types';
import {
	CardHeader,
	EditNotificationIcon,
	SmsNotificationIcon,
} from '@quillbooking/components';
import SmsTabs from './sms-tabs';

const SmsNotificationShimmer = () => {
	return (
		<div className="w-full px-9">
			<div className="grid grid-cols-2 gap-5">
				<Card>
					<Flex vertical gap={20}>
						{[1, 2, 3].map((i) => (
							<Flex key={i} className="border-b pb-4">
								<Flex vertical gap={8} className="w-full">
									<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
									<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
								</Flex>
							</Flex>
						))}
					</Flex>
				</Card>
				<Card>
					<Flex className="justify-between items-center border-b pb-4 mb-4">
						<Flex vertical gap={8}>
							<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
							<div className="animate-pulse bg-gray-200 h-4 w-64 rounded" />
						</Flex>
						<div className="animate-pulse bg-gray-200 h-8 w-12 rounded-full" />
					</Flex>
					<Flex vertical gap={16}>
						<div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
						<div className="animate-pulse bg-gray-200 h-32 w-full rounded" />
					</Flex>
				</Card>
			</div>
		</div>
	);
};

export interface SmsNotificationsTabHandle {
	saveSettings: () => Promise<void>;
}

interface SmsNotificationsTabProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

const SmsNotificationTab = forwardRef<
	SmsNotificationsTabHandle,
	SmsNotificationsTabProps
>(({ disabled, setDisabled }, ref) => {
	const { state: event } = useEventContext();
	const { callApi, loading } = useApi();
	const { successNotice } = useNotice();
	const navigate = useNavigate();
	const [notificationSettings, setNotificationSettings] = useState<Record<
		string,
		NotificationType
	> | null>(null);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [isNoticeVisible, setNoticeVisible] = useState(true);
	const [notificationsLoaded, setNotificationsLoaded] = useState(false);

	useEffect(() => {
		fetchNotificationSettings();
	}, [event]);

	// Set the first notification as selected when settings are loaded
	useEffect(() => {
		if (notificationsLoaded && notificationSettings && !editingKey) {
			const firstKey = Object.keys(notificationSettings)[0];
			if (firstKey) {
				setEditingKey(firstKey);
			}
		}
	}, [notificationsLoaded]);

	// Expose the saveSettings method through the ref
	useImperativeHandle(ref, () => ({
		saveSettings: async () => {
			if (notificationSettings) {
				return saveNotificationSettings();
			}
			return Promise.resolve();
		},
	}));

	const fetchNotificationSettings = () => {
		if (!event) {
			return;
		}
		callApi({
			path: `events/${event.id}/meta/sms_notifications`,
			method: 'GET',
			onSuccess(response: Record<string, NotificationType>) {
				setNotificationSettings(response);
				setNotificationsLoaded(true);
			},
			onError(error) {
				throw new Error(error.message);
			},
		});
	};

	const handleSwitchChange = (checked, key) => {
		setNotificationSettings((prev) => {
			if (!prev) return prev;

			// Create a deep copy to avoid reference issues
			const updated = { ...prev };

			updated[key] = {
				...updated[key],
				default: checked,
			};

			setDisabled(false);

			return updated;
		});
	};

	const handleNotificationSelect = (key: string) => {
		// Only update if selecting a different notification
		if (editingKey !== key) {
			setEditingKey(key);
		}
	};

	const saveNotificationSettings = async () => {
		try {
			// Validate required data
			if (!event || !notificationSettings) {
				console.warn(
					'Cannot save notification settings - missing event or settings data'
				);
				return;
			}

			await callApi({
				path: `events/${event.id}`,
				method: 'POST',
				data: {
					[`sms_notifications`]: notificationSettings,
				},
				onSuccess() {
					// Show success message and update state
					successNotice(
						__(
							'Notification settings saved successfully',
							'quillbooking'
						)
					);
					setDisabled(true);
					// Update the base notification settings with a deep copy
					setNotificationSettings(
						JSON.parse(JSON.stringify(notificationSettings))
					);
				},
				onError(error) {
					// Re-throw error to be caught by outer try-catch
					throw new Error(error.message);
				},
			});
		} catch (error: any) {
			console.error('Failed to save notification settings:', error);
			// Re-throw error if you want calling code to handle it
			throw new Error(error.message);
		}
	};

	if (!notificationsLoaded || !notificationSettings) {
		return <SmsNotificationShimmer />;
	}

	return (
		<div className="w-full px-9">
			{!event?.connected_integrations.twilio.has_settings &&
			!event?.connected_integrations.twilio.connected &&
			!event?.connected_integrations.twilio.has_accounts ? (
				<Card>
					<CardHeader
						title={__('Sms Notification', 'quillbooking')}
						description={__(
							'Customize the sms notifications sent to attendees and organizers',
							'quillbooking'
						)}
						icon={<SmsNotificationIcon />}
					/>
					<Card className="mt-4 px-4">
						<Flex justify="space-between" align="center">
							<span>
								{__(
									"You didn't configure twilio yet. Please configure it.",
									'quillbooking'
								)}
							</span>
							<Button
								type="primary"
								size="middle"
								onClick={() => {
									navigate(
										'integrations&tab=sms-integration'
									);
								}}
								loading={loading}
								className="rounded-lg font-[500] text-white bg-color-primary"
							>
								{__('Connect to Twilio', 'quillbooking')}
							</Button>
						</Flex>
					</Card>
				</Card>
			) : (
				<div className="grid grid-cols-2 gap-5">
					<SmsTabs
						isNoticeVisible={isNoticeVisible}
						setNoticeVisible={setNoticeVisible}
						notificationSettings={notificationSettings}
						editingKey={editingKey}
						onSelect={handleNotificationSelect} // Changed to use the new handler
					/>
					<Card>
						<Flex className="justify-between items-center border-b mb-4">
							<CardHeader
								title={__('Edit', 'quillbooking')}
								description={__(
									'Booking Confirmation SMS to Attendee',
									'quillbooking'
								)}
								icon={<EditNotificationIcon />}
								border={false}
							/>
							{editingKey && (
								<Switch
									checked={
										notificationSettings?.[editingKey]
											?.default || false
									}
									loading={loading}
									onChange={(checked) =>
										handleSwitchChange(checked, editingKey)
									}
									className={
										notificationSettings?.[editingKey]
											?.default
											? 'bg-color-primary'
											: 'bg-gray-400'
									}
								/>
							)}
						</Flex>
						{editingKey && notificationSettings[editingKey] && (
							<SmsNotificationCard
								key={editingKey}
								notifications={notificationSettings}
								notificationKey={editingKey}
								setNotifications={(updatedNotifications) => {
									setNotificationSettings(
										updatedNotifications
									);
								}}
								setDisabled={setDisabled}
							/>
						)}
					</Card>
				</div>
			)}
		</div>
	);
});

export default SmsNotificationTab;
