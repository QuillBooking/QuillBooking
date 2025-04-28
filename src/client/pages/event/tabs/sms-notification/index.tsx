/**
 * WordPress dependencies
 */
import { useState, useEffect, forwardRef, useImperativeHandle } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Card, Flex, Radio, Switch, Typography } from 'antd';
import { map, set } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import SmsNotificationCard from './sms-notification-card'; // Fixed the typo in the import
import { NotificationType } from '@quillbooking/client';
import { CardHeader, EditNotificationIcon, Header, NoticeComponent, SmsNotificationIcon } from '@quillbooking/components';
import { BsInfoCircleFill } from "react-icons/bs";
import { IoClose } from "react-icons/io5";

export interface NotificationsTabHandle {
    saveSettings: () => Promise<void>;
}

interface NotificationsTabProps {
    disabled?: boolean;
    setDisabled?: (disabled: boolean) => void;
}

const SmsNotificationTab = forwardRef<NotificationsTabHandle, NotificationsTabProps>(({ disabled, setDisabled }, ref) => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [notificationSettings, setNotificationSettings] = useState<Record<string, NotificationType> | null>(null);
    const [newNotificationSettings, setNewNotificationSettings] = useState<Record<string, NotificationType> | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [isNoticeVisible, setNoticeVisible] = useState(true);
    const [connected, setConnected] = useState(false);
    const [isConnectionVisible, setIsConnectionVisible] = useState(true);

    // Expose the saveSettings method through the ref
    useImperativeHandle(ref, () => ({
        saveSettings: async () => {
            if (newNotificationSettings) {
                return saveNotificationSettings(newNotificationSettings);
            }
            return Promise.resolve();
        }
    }));

    useEffect(() => {
        fetchNotificationSettings();
    }, [event]);

    // Initialize newNotificationSettings when notificationSettings is fetched
    useEffect(() => {
        if (notificationSettings) {
            setNewNotificationSettings(JSON.parse(JSON.stringify(notificationSettings)));
        }
    }, [notificationSettings]);

    const fetchNotificationSettings = () => {
        if (!event) {
            return;
        }
        callApi({
            path: `events/${event.id}/meta/sms_notifications`,
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
        setNewNotificationSettings(prev => {
            if (!prev) return prev;

            // Create a deep copy to avoid reference issues
            const updated = JSON.parse(JSON.stringify(prev));
            updated[key].default = checked;

            // Mark as needing to save if setDisabled is provided
            if (setDisabled) {
                setDisabled(false);
            }

            return updated;
        });
    };

    const saveNotificationSettings = async (settings: Record<string, NotificationType>) => {
        if (!event) return Promise.reject('No event found');

        return new Promise<void>((resolve, reject) => {
            callApi({
                path: `events/${event.id}`,
                method: 'POST',
                data: {
                    [`sms_notifications`]: settings,
                },
                onSuccess() {
                    successNotice(__('Notification settings saved successfully', 'quillbooking'));
                    if (setDisabled) {
                        setDisabled(true);
                    }
                    // Update the base notification settings with a deep copy to avoid reference issues
                    setNotificationSettings(JSON.parse(JSON.stringify(settings)));
                    resolve();
                },
                onError(error) {
                    errorNotice(error.message);
                    reject(error);
                },
            });
        });
    };

    if (loading || !notificationSettings || !newNotificationSettings) {
        return <Card title={__('Notifications', 'quillbooking')} loading />;
    }

    return (
        <div className='w-full px-9'>
            {isConnectionVisible && (
                <Card>
                    <CardHeader title={__('Sms Notification', 'quillbooking')}
                        description={__(
                            'Customize the sms notifications sent to attendees and organizers',
                            'quillbooking'
                        )}
                        icon={<SmsNotificationIcon />} />
                    <Card className='mt-4 px-4'>
                        <Flex justify='space-between' align='center'>
                            <span>{__("You didn't configure twilio yet. Please configure it.", "quillbooking")}</span>
                            <Button type="primary"
                                size="middle"
                                onClick={() => { setConnected(true); setIsConnectionVisible(false) }}
                                loading={loading}
                                className='rounded-lg font-[500] text-white bg-color-primary'>
                                {__("Connect to Twilio", "quillbooking")}
                            </Button>
                        </Flex>
                    </Card>
                </Card>
            )}
            {connected && (
                <div className='grid grid-cols-2 gap-5'>
                    <Card>
                        <CardHeader title={__('Sms Notification', 'quillbooking')}
                            description={__(
                                'Customize the sms notifications sent to attendees and organizers',
                                'quillbooking'
                            )}
                            icon={<SmsNotificationIcon />} />
                        <div className='mt-4'>
                            <NoticeComponent
                                isNoticeVisible={isNoticeVisible}
                                setNoticeVisible={setNoticeVisible}
                            />
                            {newNotificationSettings &&
                                Object.entries(newNotificationSettings).map(([key, _notification], index) => {
                                    return (
                                        <div key={key} onClick={() => setEditingKey(editingKey === key ? null : key)}>
                                            <Card
                                                style={{ marginBottom: 16, cursor: 'pointer' }}
                                                className={editingKey === key ? 'border border-color-primary bg-color-secondary' : 'border'}
                                            >
                                                <Flex gap={10}>
                                                    <Flex vertical>
                                                        <Flex gap={15}>
                                                            <Typography.Title level={5} className='text-[#09090B] text-[20px] font-[500] m-0'>
                                                                {_notification.label}
                                                            </Typography.Title>
                                                            {_notification.default && (
                                                                <span className='bg-color-primary text-white rounded-lg text-[11px] pt-[3px] px-2 h-[22px] mt-[7px]'>
                                                                    {__('ENABLED', 'quillbooking')}
                                                                </span>
                                                            )}
                                                        </Flex>
                                                        <span className='text-[#625C68] text-[14px]'>
                                                            {__('This SMS will be sent to the attendee if phone number is provided during booking.', 'quillbooking')}
                                                        </span>
                                                    </Flex>
                                                </Flex>
                                            </Card>
                                        </div>
                                    );
                                })}
                        </div>
                    </Card>
                    <Card>
                        <Flex className='justify-between items-center border-b mb-4'>
                            <CardHeader title={__('Edit', 'quillbooking')}
                                description={__('Booking Confirmation SMS to Attendee', 'quillbooking')}
                                icon={<EditNotificationIcon />} border={false} />
                            {editingKey && (
                                <Switch
                                    checked={newNotificationSettings[editingKey]?.default}
                                    loading={loading}
                                    onChange={(checked) => handleSwitchChange(checked, editingKey)}
                                    className={newNotificationSettings[editingKey]?.default ? "bg-color-primary" : "bg-gray-400"}
                                />
                            )}
                        </Flex>
                        {editingKey && newNotificationSettings[editingKey] && (
                            <SmsNotificationCard
                                key={editingKey}
                                notifications={newNotificationSettings}
                                notificationKey={editingKey}
                                setNotifications={(updatedNotifications) => {
                                    setNewNotificationSettings(updatedNotifications);
                                    if (setDisabled) {
                                        setDisabled(false);
                                    }
                                }}
                            />
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
});

export default SmsNotificationTab;