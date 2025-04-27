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
import { Card, Flex, Radio, Switch, Typography } from 'antd';
import { map, set } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import NotificationCard from './email-notification-card';
import { NotificationType } from '@quillbooking/client';
import {
	CardHeader,
	EditNotificationIcon,
	EmailNotificationIcon,
	Header,
	SmsNotificationIcon,
} from '@quillbooking/components';
import { BsInfoCircleFill } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';
import EmailNotificationCard from './email-notification-card';
import EmatilTabs from './email-tabs';
import EmailTabs from './email-tabs';
import OtherNotifications from './other-notifications';

export interface NotificationsTabHandle {
	saveSettings: () => Promise<void>;
}

interface NotificationsTabProps {
	//notificationType: 'email' | 'sms';
	disabled?: boolean;
	setDisabled?: (disabled: boolean) => void;
}

const EmailNotificationTab = forwardRef<
	NotificationsTabHandle,
	NotificationsTabProps
>(({ disabled, setDisabled }, ref) => {
	const { state: event } = useEventContext();
	const { callApi, loading } = useApi();
	const { successNotice, errorNotice } = useNotice();
	const [notificationSettings, setNotificationSettings] = useState<Record<
		string,
		NotificationType
	> | null>(null);
	// const [notificationSettings, setNotificationSettings] =
	// 	useState<any>(null);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const [isNoticeVisible, setNoticeVisible] = useState(true);

	useEffect(() => {
		fetchNotificationSettings();
	}, [event]);

	// Add this useEffect to ensure notificationSettings gets updated when notificationSettings changes
	useEffect(() => {
		if (notificationSettings) {
			setNotificationSettings(notificationSettings);
		}
	}, [notificationSettings]);

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

			// Mark as needing to save if setDisabled is provided
			if (setDisabled) {
				setDisabled(false);
			}

			return updated;
		});
	};

	const saveNotificationSettings = async () => {
		if (!event || !notificationSettings)
			return Promise.reject('No event or settings found');

		console.log('before save method', notificationSettings);
		return new Promise<void>((resolve, reject) => {
			callApi({
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
					if (setDisabled) {
						setDisabled(true);
					}
					setNotificationSettings(notificationSettings);
					console.log(
						'Notification settings saved successfully',
						notificationSettings
					);
					resolve();
				},
				onError(error) {
					errorNotice(error.message);
					reject(error);
				},
			});
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
				setEditingKey={setEditingKey}
				editingKey={editingKey}
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
							if (setDisabled) {
								setDisabled(false);
							}
						}}
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
