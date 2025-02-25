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
        <Form form={form} layout="vertical">
            {notificationType === 'email' && (
                <Form.Item name={['template', 'subject']} label={__('Subject', 'quillbooking')} rules={[{ required: true, message: __('Subject is required', 'quillbooking') }]}>
                    <Input />
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
            <Form.Item name={['template', 'message']} label={__('Message', 'quillbooking')} rules={[{ required: true, message: __('Message is required', 'quillbooking') }]}>
                {notificationType === 'email' ? (
                    <EmailEditor value={notification.template.message} onChange={(content) => form.setFieldsValue({ template: { message: content } })} />
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
            <Flex justify="space-between">
                <Typography.Title style={{ margin: 0 }} level={5}>{notification.label}</Typography.Title>
                <Flex gap={10} align="center">
                    <Button onClick={handleEdit}>{__('Edit', 'quillbooking')}</Button>
                    <Switch
                        checked={notification.default}
                        loading={loading}
                        onChange={handleSwitchChange}
                    />
                    <Modal
                        title={notification.label}
                        open={editingKey === notificationKey}
                        onCancel={() => setEditingKey(null)}
                        footer={null}
                        width={800}
                    >
                        {renderModalContent()}
                    </Modal>
                </Flex>
            </Flex>
        </Card>
    );
};

export default NotificationCard;