/**
 * WordPress dependencies
 */
import { useState, useEffect, forwardRef, useImperativeHandle } from '@wordpress/element';
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
import { CardHeader, EditNotificationIcon, EmailNotificationIcon, Header, SmsNotificationIcon } from '@quillbooking/components';
import { BsInfoCircleFill } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import EmailNotificationCard from './email-notification-card';

export interface NotificationsTabHandle {
    saveSettings: () => Promise<void>;
}

interface NotificationsTabProps {
    //notificationType: 'email' | 'sms';
    disabled?: boolean;
    setDisabled?: (disabled: boolean) => void;
}

const EmailNotificationTab = forwardRef<NotificationsTabHandle, NotificationsTabProps>(({ disabled, setDisabled }, ref) => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [notificationSettings, setNotificationSettings] = useState<Record<string, NotificationType> | null>(null);
    const [newNotificationSettings, setNewNotificationSettings] = useState<any>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [isNoticeVisible, setNoticeVisible] = useState(true);

    useEffect(() => {
        fetchNotificationSettings();
    }, [event]);

    // Add this useEffect to ensure newNotificationSettings gets updated when notificationSettings changes
    useEffect(() => {
        if (notificationSettings) {
            setNewNotificationSettings(notificationSettings);
        }
    }, [notificationSettings]);

    // Expose the saveSettings method through the ref
    useImperativeHandle(ref, () => ({
        saveSettings: async () => {
            if (notificationSettings) {
                return saveNotificationSettings();
            }
            return Promise.resolve();
        }
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
        console.log("Toggle switch changed:", checked, key);

        setNewNotificationSettings(prev => {
            if (!prev) return prev;

            // Create a complete copy with all existing values
            const updated = { ...prev };

            // Update just the default property for this notification
            updated[key] = {
                ...updated[key],
                default: checked
            };

            console.log("Updated notification settings:", updated);

            // Mark as needing to save if setDisabled is provided
            if (setDisabled) {
                setDisabled(false);
            }

            return updated;
        });
    };

    const saveNotificationSettings = async () => {
        if (!event || !newNotificationSettings) return Promise.reject('No event or settings found');
        console.log(newNotificationSettings)

        return new Promise<void>((resolve, reject) => {
            callApi({
                path: `events/${event.id}`,
                method: 'POST',
                data: {
                    [`email_notifications`]: newNotificationSettings,
                },
                onSuccess() {
                    successNotice(__('Notification settings saved successfully', 'quillbooking'));
                    if (setDisabled) {
                        setDisabled(true);
                    }
                    setNotificationSettings(newNotificationSettings);
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
        <div className='grid grid-cols-2 gap-5 px-9'>
            <Card>
                <CardHeader title={__('Email Notification', 'quillbooking')}
                    description={__(
                        'Customize the email notifications sent to attendees and organizers',
                        'quillbooking'
                    )}
                    icon={<EmailNotificationIcon />} />
                    <div className='mt-4'>
                {isNoticeVisible && (
                    <Flex className='justify-between items-start border py-3 px-5 mb-4 bg-[#FBFBFB] border-[#E0E0E0]'>
                        <Flex vertical>
                            <Flex className='items-baseline gap-2'>
                                <BsInfoCircleFill className='text-[#727C88] text-[14px]' />
                                <span className='text-[#727C88] text-[16px] font-semibold'>{__("Notice", "quillbooking")}</span>
                            </Flex>
                            <span className='text-[#999999]'>{__("You can Choose the settings for each one and change its internal settings.", "quillbooking")}</span>
                        </Flex>
                        <IoClose
                            onClick={() => setNoticeVisible(false)}
                            className='text-[#727C88] text-[18px] cursor-pointer pt-1'
                        />
                    </Flex>)}
                {notificationSettings &&
                    Object.entries(notificationSettings).map(([key, _notification], index) => {
                        if (index >= 8) return null;

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
                        description={__(
                            'Booking Confirmation Email to Attendee',
                            'quillbooking'
                        )}
                        icon={<EditNotificationIcon />} border={false}/>
                    {editingKey && (
                        <Switch
                            checked={newNotificationSettings?.[editingKey]?.default || false}
                            loading={loading}
                            onChange={(checked) => handleSwitchChange(checked, editingKey)}
                            className={newNotificationSettings?.[editingKey]?.default ? "bg-color-primary" : "bg-gray-400"}
                        />
                    )}
                </Flex>
                {editingKey && notificationSettings[editingKey] && (
                    <EmailNotificationCard
                        key={editingKey}
                        notifications={notificationSettings}
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
            <Card>
            <CardHeader title={__('Other Notification', 'quillbooking')}
                        description={__(
                            'Optimize your email notifications for confirmations and declines',
                            'quillbooking'
                        )}
                        icon={<EmailNotificationIcon />} />
                {notificationSettings &&
                    Object.entries(notificationSettings).map(([key, _notification], index) => {
                        if (index < 8) return null; 

                        return (
                            <div key={key} onClick={() => setEditingKey(editingKey === key ? null : key)} className='mt-4'>
                                <Card
                                    style={{ marginBottom: 16, cursor: 'pointer' }}
                                    className={editingKey === key ? 'border border-color-primary bg-color-secondary' : 'border'}
                                >
                                    <Flex>
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
            </Card>
        </div>
    );
});

export default EmailNotificationTab;