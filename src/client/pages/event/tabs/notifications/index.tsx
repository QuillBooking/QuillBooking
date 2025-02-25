/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import NotificationCard from './notification-card';
import { NotificationType } from '@quillbooking/client';

const NotificationsTab: React.FC<{ notificationType: 'email' | 'sms' }> = ({ notificationType }) => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { errorNotice } = useNotice();
    const [notificationSettings, setNotificationSettings] = useState<Record<string, NotificationType> | null>(null);

    useEffect(() => {
        fetchNotificationSettings();
    }, [event]);

    const fetchNotificationSettings = () => {
        if (!event) {
            return;
        }
        callApi({
            path: `events/${event.id}/meta/${notificationType}_notifications`,
            method: 'GET',
            onSuccess(response: Record<string, NotificationType>) {
                setNotificationSettings(response);
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
        <Card title={__('Notifications', 'quillbooking')}>
            {map(notificationSettings, (_notification, key) => (
                <NotificationCard
                    key={key}
                    notifications={notificationSettings}
                    notificationKey={key}
                    notificationType={notificationType}
                    eventId={event?.id || 0}
                    setNotifications={setNotificationSettings}
                />
            ))}
        </Card>
    );
};

export default NotificationsTab;