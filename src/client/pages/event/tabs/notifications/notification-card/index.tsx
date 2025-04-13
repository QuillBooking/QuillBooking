/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Switch, Button, Modal, Input, Form, InputNumber, Typography, Radio, Select, Flex } from 'antd';

/**
 * External dependencies
 */
import { NotificationType } from '@quillbooking/client';
import { useNotice, useApi } from '@quillbooking/hooks';
import EmailEditor from './editor';
import { LimitsAddIcon, LimitsTrashIcon, UrlIcon } from '@quillbooking/components';
import { ReactMultiEmail, isEmail } from 'react-multi-email';
import 'react-multi-email/dist/style.css';

const { TextArea } = Input;

type NotificationCardProps = {
    notifications: Record<string, NotificationType>;
    notificationKey: string;
    notificationType: 'email' | 'sms';
    eventId: number;
    setNotifications: (notifications: Record<string, NotificationType>) => void;
};

const NotificationCard: React.FC<NotificationCardProps> = ({ notifications, notificationKey, notificationType, eventId, setNotifications }) => {
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [form] = Form.useForm();
    const { successNotice, errorNotice } = useNotice();
    const [emails, setEmails] = useState<string[]>([]);
    const [focused, setFocused] = useState(false);
    const notification = notifications[notificationKey];
    const { callApi, loading } = useApi();

    console.log(notification)

    const handleSave = () => {
        form.validateFields().then((values) => {
            const updatedSettings = { ...notifications, [notificationKey]: { ...notifications[notificationKey], ...values } };

            setNotifications(updatedSettings);
            saveNotificationSettings(updatedSettings);
        });
    };

    const handleSwitchChange = (checked: boolean) => {
        if (!notification) {
            return;
        }
        const updatedSettings = { ...notifications, [notificationKey]: { ...notification, default: checked } };

        setNotifications(updatedSettings);
        saveNotificationSettings(updatedSettings);
    };

    const saveNotificationSettings = (settings: Record<string, NotificationType>) => {
        callApi({
            path: `events/${eventId}`,
            method: 'POST',
            data: {
                [`${notificationType}_notifications`]: settings,
            },
            onSuccess() {
                successNotice(__('Notification settings saved successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const handleEdit = () => {
        setEditingKey(notificationKey);
        form.setFieldsValue(notification);
    };

    const renderModalContent = () => (
        <Form form={form} layout="vertical" className='w-full'
            initialValues={{
                times: [{ value: 15, unit: 'minutes' }],
            }}>
            {notificationType === 'email' && (
                <Form.Item name={['template', 'subject']}
                    label={<span className="text-[#09090B] text-[16px] font-semibold">
                        {__('Subject', 'quillbooking')}
                        <span className='text-red-500'>*</span>
                    </span>}
                    //rules={[{ required: true, message: __('Subject is required', 'quillbooking') }]}
                    className='w-full'
                >
                    <Input
                        placeholder='New Booking: {{guest.full_name}} @ {{booking.start_date_time_for_host}}'
                        className='h-[48px] rounded-lg'
                        suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg'>
                            <UrlIcon />
                        </span>}
                        style={{ padding: "0 0 0 10px" }} />
                </Form.Item>
            )}
            <Form.Item name={['template', 'message']}
                //rules={[{ required: true, message: __('Message is required', 'quillbooking') }]}
                className='w-full mb-5'
            >
                {notificationType === 'email' ? (
                    <>
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Email Body', 'quillbooking')}
                            <span className='text-red-500'>*</span>
                        </span>
                        <EmailEditor message={notification.template.message}
                            onChange={(content) => {
                                console.log(content);  // Log the updated value
                                form.setFieldsValue({ template: { message: content } });
                            }} />
                    </>
                ) : (
                    <>
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('SMS Body', 'quillbooking')}
                        </span>
                        <TextArea
                            autoSize={{ minRows: 4 }}
                            value={notification.template.message}
                            onChange={(e) => form.setFieldsValue({ template: { message: e.target.value } })}
                            className='mt-2 rounded-lg'
                        />
                    </>
                )}
            </Form.Item>
            <Form.Item
                //rules={[{ required: true, message: __('Message is required', 'quillbooking') }]}
                className='w-full mb-5'
            >
                {notificationType === 'email' ? (
                    <>
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Additional Recipients', 'quillbooking')}
                            <span className='text-red-500'>*</span>
                        </span>
                        <ReactMultiEmail
                            placeholder={__('Enter email addresses separated by commas', 'quillbooking')}
                            emails={emails}
                            onChange={(_emails: string[]) => {
                                setEmails(_emails);
                            }}
                            autoFocus={true}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            delimiter={','}
                            getLabel={(email, index, removeEmail) => {
                                return (
                                    <div data-tag key={index}>
                                        <div data-tag-item>{email}</div>
                                        <span data-tag-handle onClick={() => removeEmail(index)}>
                                            ×
                                        </span>
                                    </div>
                                );
                            }}
                            className='min-h-[48px] rounded-lg'
                        />
                        <span className='text-[#818181]'>{__("Provided email address will set as CC to this email notification.", "quillbooking")}</span>
                    </>
                ) : (
                    <Form.Item name={['template', 'type']}
                        label={<span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Sender', 'quillbooking')}
                            <span className='text-red-500'>*</span>
                        </span>}
                        //rules={[{ required: true, message: __('Type is required', 'quillbooking') }]}
                        >
                        <Radio.Group className='text-[#3F4254] font-semibold'>
                            <Radio value="sms" className='custom-radio'>{__('SMS', 'quillbooking')}</Radio>
                            <Radio value="whatsapp" className='custom-radio'>{__('WhatsApp', 'quillbooking')}</Radio>
                        </Radio.Group>
                    </Form.Item>
                )}
            </Form.Item>
            {notification.times && (
                <>
                    <span className="text-[#09090B] text-[16px] font-semibold">
                        {__('Timing', 'quillbooking')}
                        <span className='text-red-500'>*</span>
                    </span>
                    <Form.List name="times" >
                        {(fields, { add, remove }) => (
                            <Flex vertical gap={10} className='mt-3'>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Flex key={key} align="center" gap={10}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            rules={[{ required: true, message: __('Value is required', 'quillbooking') }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <InputNumber className='h-[48px] rounded-lg pt-2 w-16' />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'unit']}
                                            rules={[{ required: true, message: __('Unit is required', 'quillbooking') }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Select
                                                className='h-[48px] rounded-lg w-44'
                                                getPopupContainer={(trigger) => trigger.parentElement}
                                                options={[
                                                    { value: 'minutes', label: <span>{__('Minutes Before', 'quillbooking')}</span> },
                                                    { value: 'hours', label: <span>{__('Hours Before', 'quillbooking')}</span> },
                                                    { value: 'days', label: <span>{__('Days Before', 'quillbooking')}</span> },
                                                ]}
                                            />
                                        </Form.Item>

                                        {/* Only show Remove button if it's NOT the first item */}
                                        {index > 0 && (
                                            <Button onClick={() => remove(name)} danger className='border-none shadow-none p-0'>
                                                <LimitsTrashIcon />
                                            </Button>
                                        )}

                                        {/* Only show Add button beside the first item */}
                                        {index === 0 && (
                                            <Button onClick={() => add({ value: 15, unit: 'minutes' })} className='border-none shadow-none p-0'>
                                                <LimitsAddIcon />
                                            </Button>
                                        )}
                                    </Flex>
                                ))}
                            </Flex>
                        )}
                    </Form.List>

                </>
            )}
            {/* <Form.Item>
                <Button type="primary" onClick={handleSave} loading={loading}>
                    {__('Save', 'quillbooking')}
                </Button>
            </Form.Item> */}
        </Form>
    );

    return (
        <Card style={{ marginBottom: 16 }}>
            {/* <Flex justify="space-between">
                <Flex vertical>
                    <Flex gap={15}>
                        <Typography.Title level={5} className='text-[#09090B] text-[20px] font-[500] m-0'>{notification.label}</Typography.Title>
                        {notification.default && (
                            <span className='bg-color-primary text-white rounded-lg text-[11px] pt-[3px] px-2 h-[22px] mt-[7px]'>{__("ENABLED", "quillbooking")}</span>
                        )}
                    </Flex>
                    <span className='text-[#625C68] text-[14px]'>{__("This SMS will be sent to the attendee if phone number is provided during booking.", "quillbooking")}</span>
                </Flex> */}
            <Flex gap={10} align="center">
                {/* <Button onClick={handleEdit}>{__('Edit', 'quillbooking')}</Button>
                    <Switch
                        checked={notification.default}
                        loading={loading}
                        onChange={handleSwitchChange}
                    /> */}
                {/* <Modal
                        title={notification.label}
                        open={editingKey === notificationKey}
                        onCancel={() => setEditingKey(null)}
                        footer={null}
                        getContainer={false}
                        width={800}
                    >  */}
                {renderModalContent()}
                {/* </Modal> */}
            </Flex>
        </Card>
    );
};

export default NotificationCard;