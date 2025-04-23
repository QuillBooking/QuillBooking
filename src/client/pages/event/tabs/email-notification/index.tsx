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
import { EditNotificationIcon, EmailNotificationIcon, Header, SmsNotificationIcon } from '@quillbooking/components';
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

    console.log(notificationSettings)

    // Expose the saveSettings method through the ref
    useImperativeHandle(ref, () => ({
        saveSettings: async () => {
            if (notificationSettings) {
                return saveNotificationSettings(newNotificationSettings);
            }
            return Promise.resolve();
        }
    }));

    useEffect(() => {
        fetchNotificationSettings();
    }, [event]);

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
        setNewNotificationSettings(prev => {
            if (!prev) return prev;

            const updated = {
                ...prev,
                [key]: {
                    ...prev[key],
                    default: checked,
                }
            };
            
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
                    [`email_notifications`]: settings,
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
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                            <div className='bg-[#EDEDED] rounded-lg p-2' >
                                <EmailNotificationIcon />
                            </div>
                            <Header header={__('Email Notification', 'quillbooking')}
                                subHeader={__(
                                    'Customize the email notifications sent to attendees and organizers',
                                    'quillbooking'
                                )} />
                </Flex>
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
            </Card>
            <Card>
                <Flex className='justify-between items-center border-b pb-4 mb-4'>
                    <Flex gap={10} className='items-center'>
                        <div className='bg-[#EDEDED] rounded-lg p-2' >
                            <EditNotificationIcon />
                        </div>
                        <Header header={__('Edit', 'quillbooking')}
                            subHeader={__(
                                'Booking Confirmation Email to Attendee',
                                'quillbooking'
                            )} />

                    </Flex>
                    {editingKey && (
                        <Switch
                            checked={notificationSettings[editingKey]?.default}
                            loading={loading}
                            onChange={(checked) => handleSwitchChange(checked, editingKey)}
                            className={notificationSettings[editingKey]?.default ? "bg-color-primary" : "bg-gray-400"}
                        />
                    )}
                </Flex>
                {editingKey && notificationSettings[editingKey] && (
                    <EmailNotificationCard
                        key={editingKey}
                        notifications={notificationSettings}
                        notificationKey={editingKey}
                        eventId={event?.id || 0}
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
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                    <div className='bg-[#EDEDED] rounded-lg p-2' >
                        <EmailNotificationIcon />
                    </div>
                    <Header header={__('Other Notification', 'quillbooking')}
                        subHeader={__(
                            'Optimize your email notifications for confirmations and declines',
                            'quillbooking'
                        )} />
                </Flex>
                {notificationSettings &&
                    Object.entries(notificationSettings).map(([key, _notification], index) => {
                        if (index < 8) return null; // Skip items 9-12 here

                        return (
                            <div key={key} onClick={() => setEditingKey(editingKey === key ? null : key)}>
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