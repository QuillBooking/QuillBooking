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
import { UrlIcon } from '@quillbooking/components';

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
        <Form form={form} layout="vertical" className='w-full'>
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
            {notificationType === 'sms' && (
                <Form.Item name={['template', 'type']} label={__('Type', 'quillbooking')} rules={[{ required: true, message: __('Type is required', 'quillbooking') }]}>
                    <Radio.Group>
                        <Radio value="sms">{__('SMS', 'quillbooking')}</Radio>
                        <Radio value="whatsapp">{__('WhatsApp', 'quillbooking')}</Radio>
                    </Radio.Group>
                </Form.Item>
            )}
            <Form.Item name={['template', 'message']}
                label={<span className="text-[#09090B] text-[16px] font-semibold">
                    {__('Email Body', 'quillbooking')}
                    <span className='text-red-500'>*</span>
                </span>}
            //rules={[{ required: true, message: __('Message is required', 'quillbooking') }]}
            className='w-full'
            >
                {notificationType === 'email' ? (
                    <EmailEditor message={notification.template.message}
                        onChange={(content) => {
                            console.log(content);  // Log the updated value
                            form.setFieldsValue({ template: { message: content } });
                        }} />
                ) : (
                    <TextArea
                        autoSize={{ minRows: 4 }}
                        value={notification.template.message}
                        onChange={(e) => form.setFieldsValue({ template: { message: e.target.value } })}
                    />
                )}
            </Form.Item>
            {notification.times && (
                <Form.List name="times">
                    {(fields, { add, remove }) => (
                        <Flex vertical gap={10}>
                            {fields.map(({ key, name, ...restField }) => (
                                <Flex key={key} align="start" gap={10}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'value']}
                                        rules={[{ required: true, message: __('Value is required', 'quillbooking') }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <InputNumber />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'unit']}
                                        rules={[{ required: true, message: __('Unit is required', 'quillbooking') }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            options={[
                                                { value: 'minutes', label: <span>{__('Minutes Before', 'quillbooking')}</span> },
                                                { value: 'hours', label: <span>{__('Hours Before', 'quillbooking')}</span> },
                                                { value: 'days', label: <span>{__('Days Before', 'quillbooking')}</span> },
                                            ]}
                                        />
                                    </Form.Item>
                                    <Button onClick={() => remove(name)} danger>
                                        {__('Remove', 'quillbooking')}
                                    </Button>
                                </Flex>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add({ value: 15, unit: 'minutes' })} block>
                                    {__('Add Time', 'quillbooking')}
                                </Button>
                            </Form.Item>
                        </Flex>
                    )}
                </Form.List>
            )}
            <Form.Item>
                <Button type="primary" onClick={handleSave} loading={loading}>
                    {__('Save', 'quillbooking')}
                </Button>
            </Form.Item>
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