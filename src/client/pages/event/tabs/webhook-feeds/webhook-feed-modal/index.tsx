/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { Modal, Form, Input, Select, Checkbox, Radio, Space, Button } from 'antd';

const { Option } = Select;

export type WebhookFeedType = {
    name: string;
    url: string;
    method: string;
    format: string;
    hasHeaders: boolean;
    headers: { header: string; value: string }[];
    hasBodyFields: boolean;
    bodyFields: { field: string; value: string }[];
    triggers: string[];
    enabled: boolean;
};

type WebhookFeedModalProps = {
    visible: boolean;
    onCancel: () => void;
    onSave: (values: WebhookFeedType) => void;
    webhookFeed?: WebhookFeedType | null;
};

const WebhookFeedModal: React.FC<WebhookFeedModalProps> = ({ visible, onCancel, onSave, webhookFeed }) => {
    const [form] = Form.useForm();

    const initialValues: WebhookFeedType = webhookFeed || {
        name: '',
        url: '',
        method: 'POST',
        format: 'json',
        hasHeaders: false,
        headers: [],
        hasBodyFields: false,
        bodyFields: [],
        triggers: [],
        enabled: false,
    };

    const handleSave = () => {
        form.validateFields().then((values) => {
            onSave(values);
            form.resetFields();
        });
    };

    return (
        <Modal
            title={webhookFeed ? __('Edit Webhook Feed', 'quillbooking') : __('Add Webhook Feed', 'quillbooking')}
            open={visible}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            onOk={handleSave}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
            >
                <Form.Item
                    label={__('Name', 'quillbooking')}
                    name="name"
                    rules={[{ required: true, message: __('Please enter a name', 'quillbooking') }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={__('Request URL', 'quillbooking')}
                    name="url"
                    rules={[{ required: true, type: 'url', message: __('Please enter a valid URL', 'quillbooking') }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={__('Request Method', 'quillbooking')}
                    name="method"
                    rules={[{ required: true, message: __('Please select a request method', 'quillbooking') }]}
                >
                    <Select>
                        <Option value="GET">GET</Option>
                        <Option value="POST">POST</Option>
                        <Option value="PUT">PUT</Option>
                        <Option value="DELETE">DELETE</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label={__('Request Format', 'quillbooking')}
                    name="format"
                    rules={[{ required: true, message: __('Please select a request format', 'quillbooking') }]}
                >
                    <Select>
                        <Option value="json">JSON</Option>
                        <Option value="form">Form</Option>
                    </Select>
                </Form.Item>
                <Form.Item label={__('Request Has Headers', 'quillbooking')} name="hasHeaders">
                    <Radio.Group>
                        <Radio value={true}>{__('With Headers', 'quillbooking')}</Radio>
                        <Radio value={false}>{__('Without Headers', 'quillbooking')}</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.List name="headers">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'header']}
                                        rules={[{ required: true, message: __('Missing header name', 'quillbooking') }]}
                                    >
                                        <Input placeholder={__('Header', 'quillbooking')} />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'value']}
                                        rules={[{ required: true, message: __('Missing header value', 'quillbooking') }]}
                                    >
                                        <Input placeholder={__('Value', 'quillbooking')} />
                                    </Form.Item>
                                    <Button type="link" onClick={() => remove(name)}>
                                        {__('Remove', 'quillbooking')}
                                    </Button>
                                </Space>
                            ))}
                            <Button type="dashed" onClick={() => add()} style={{ marginTop: 8 }}>
                                {__('Add Header', 'quillbooking')}
                            </Button>
                        </>
                    )}
                </Form.List>
                <Form.Item label={__('Request Has Body Fields', 'quillbooking')} name="hasBodyFields">
                    <Radio.Group>
                        <Radio value={true}>{__('With Body Fields', 'quillbooking')}</Radio>
                        <Radio value={false}>{__('Without Body Fields', 'quillbooking')}</Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.List name="bodyFields">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, fieldKey, ...restField }) => (
                                <Space key={key} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'field']}
                                        rules={[{ required: true, message: __('Missing field name', 'quillbooking') }]}
                                    >
                                        <Input placeholder={__('Field', 'quillbooking')} />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'value']}
                                        rules={[{ required: true, message: __('Missing field value', 'quillbooking') }]}
                                    >
                                        <Input placeholder={__('Value', 'quillbooking')} />
                                    </Form.Item>
                                    <Button type="link" onClick={() => remove(name)}>
                                        {__('Remove', 'quillbooking')}
                                    </Button>
                                </Space>
                            ))}
                            <Button type="dashed" onClick={() => add()} style={{ marginTop: 8 }}>
                                {__('Add Body Field', 'quillbooking')}
                            </Button>
                        </>
                    )}
                </Form.List>
                <Form.Item
                    label={__('Event Triggers', 'quillbooking')}
                    name="triggers"
                    rules={[{ required: true, message: __('Please select at least one trigger', 'quillbooking') }]}
                >
                    <Checkbox.Group>
                        <Checkbox value="Booking Confirmed">{__('Booking Confirmed', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Canceled">{__('Booking Canceled', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Completed">{__('Booking Completed', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Rescheduled">{__('Booking Rescheduled', 'quillbooking')}</Checkbox>
                        <Checkbox value="Booking Rejected">{__('Booking Rejected', 'quillbooking')}</Checkbox>
                    </Checkbox.Group>
                </Form.Item>
                <Form.Item name="enabled" valuePropName="checked">
                    <Checkbox>{__('Enable this Webhook Feed', 'quillbooking')}</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default WebhookFeedModal;