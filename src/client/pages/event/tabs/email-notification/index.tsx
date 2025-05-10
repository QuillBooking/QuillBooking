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
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import { NotificationType } from '@quillbooking/client';
import {
	CardHeader,
	EditNotificationIcon,
} from '@quillbooking/components';
import EmailNotificationCard from './email-notification-card';
import EmailTabs from './email-tabs';
import OtherNotifications from './other-notifications';

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
>(({ disabled, setDisabled }, ref) => {
	const { state: event } = useEventContext();
	const { callApi, loading } = useApi();
	const { successNotice, errorNotice } = useNotice();
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
			path: `events/${event.id}/meta/email_notifications`,
			method: 'GET',
			onSuccess(response: Record<string, NotificationType>) {
				setNotificationSettings(response);
				setNotificationsLoaded(true);
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	const handleSwitchChange = (checked, key) => {
		console.log('Toggle switch changed:', checked, key);

		setNotificationSettings((prev) => {
			if (!prev) return prev;

			// Create a complete copy with all existing values
			const updated = { ...prev };

			// Update just the default property for this notification
			updated[key] = {
				...updated[key],
				default: checked,
			};

			console.log('Updated notification settings:', updated);

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
		if (!event || !notificationSettings)
			return;

		console.log('before save method', notificationSettings);
		return callApi({
				path: `events/${event.id}`,
				method: 'POST',
				data: {
					[`email_notifications`]: notificationSettings,
				},
				onSuccess() {
					console.log('before success message', notificationSettings);

					successNotice(
						__(
							'Notification settings saved successfully',
							'quillbooking'
						)
					);

					setDisabled(true);

					setNotificationSettings(notificationSettings);
					console.log(
						'Notification settings saved successfully',
						notificationSettings
					);
				},
				onError(error) {
					errorNotice(error.message);
				},
			});
	};

	if (loading || !notificationSettings) {
		return <Card title={__('Notifications', 'quillbooking')} loading />;
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
						setDisabled={setDisabled}
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
