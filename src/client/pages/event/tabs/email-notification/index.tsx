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
import { Card, Flex, Switch } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useEvent, useNotice } from '@quillbooking/hooks';
import { NotificationType } from '@quillbooking/types';
import { CardHeader, EditNotificationIcon } from '@quillbooking/components';
import EmailNotificationCard from './email-notification-card';
import EmailTabs from './email-tabs';
import OtherNotifications from './other-notifications';

const EmailNotificationShimmer = () => {
	return (
		<div className="grid grid-cols-2 gap-5 px-9">
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
			<Card>
				<Flex vertical gap={20}>
					{[1, 2].map((i) => (
						<Flex key={i} className="border-b pb-4">
							<Flex vertical gap={8} className="w-full">
								<div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
								<div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
							</Flex>
						</Flex>
					))}
				</Flex>
			</Card>
		</div>
	);
};

export interface EmailNotificationsTabHandle {
	saveSettings: () => Promise<void>;
}

interface EmailNotificationsTabProps {
	disabled: boolean;
	setDisabled: (disabled: boolean) => void;
}

const EmailNotificationTab = forwardRef<
	EmailNotificationsTabHandle,
	EmailNotificationsTabProps
>((props, ref) => {
	const { currentEvent: event } = useEvent();
	const { callApi, loading } = useApi();
	const { successNotice } = useNotice();
	const [notificationSettings, setNotificationSettings] = useState<Record<
		string,
		NotificationType
	> | null>(null);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [isNoticeVisible, setNoticeVisible] = useState(true);
	const [notificationsLoaded, setNotificationsLoaded] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);

	useEffect(() => {
		fetchNotificationSettings();
	}, [event]);

	useEffect(() => {
		if (notificationsLoaded && notificationSettings && !editingKey) {
			const firstKey = Object.keys(notificationSettings)[0];
			if (firstKey) {
				setEditingKey(firstKey);
			}
			setInitialLoading(false);
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
			path: `events/${event.id}/meta/email_notifications`,
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

			// Create a complete copy with all existing values
			const updated = { ...prev };

			// Update just the default property for this notification
			updated[key] = {
				...updated[key],
				default: checked,
			};

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
		if (!event || !notificationSettings) return;

		try {
			return await callApi({
				path: `events/${event.id}`,
				method: 'POST',
				data: {
					[`email_notifications`]: notificationSettings,
				},
				onSuccess() {
					successNotice(
						__(
							'Notification settings saved successfully',
							'quillbooking'
						)
					);
					props.setDisabled(true);
					setNotificationSettings(notificationSettings);
				},
				onError(error) {
					// This will be caught by the outer try-catch
					throw new Error(error.message);
				},
			});
		} catch (error) {
			console.error('Error in saveNotificationSettings:', error);
			// No error notice shown to the user
		}
	};

	if (initialLoading || !notificationSettings) {
		return <EmailNotificationShimmer />;
	}

	return (
		<div className="grid grid-cols-2 gap-5 px-9">
			<EmailTabs
				isNoticeVisible={isNoticeVisible}
				setNoticeVisible={setNoticeVisible}
				notificationSettings={notificationSettings}
				editingKey={editingKey}
				onSelect={handleNotificationSelect}
			/>
			<Card>
				<Flex className="justify-between items-center border-b mb-4">
					<CardHeader
						title={__('Edit', 'quillbooking')}
						description={__(
							'Booking Confirmation Email to Attendee',
							'quillbooking'
						)}
						icon={<EditNotificationIcon />}
						border={false}
					/>
					{editingKey && (
						<Switch
							checked={
								notificationSettings?.[editingKey]?.default ||
								false
							}
							loading={loading}
							onChange={(checked) =>
								handleSwitchChange(checked, editingKey)
							}
							className={
								notificationSettings?.[editingKey]?.default
									? 'bg-color-primary'
									: 'bg-gray-400'
							}
						/>
					)}
				</Flex>
				{editingKey && notificationSettings[editingKey] && (
					<EmailNotificationCard
						key={editingKey}
						notifications={notificationSettings}
						notificationKey={editingKey}
						setNotifications={(updatedNotifications) => {
							setNotificationSettings(updatedNotifications);
						}}
						setDisabled={props.setDisabled}
					/>
				)}
			</Card>
			<OtherNotifications
				notificationSettings={notificationSettings}
				setEditingKey={setEditingKey}
				editingKey={editingKey}
			/>
		</div>
	);
});

export default EmailNotificationTab;
