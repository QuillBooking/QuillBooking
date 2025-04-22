/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
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
import { Header, LimitsAddIcon, LimitsTrashIcon, MergeTagModal, UrlIcon } from '@quillbooking/components';
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
    //const { successNotice, errorNotice } = useNotice();
    const [emails, setEmails] = useState<string[]>([]);
    const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);
    const [focused, setFocused] = useState(false);
    // const notification = notifications[notificationKey];
    // const [message, setMessage] = useState<string>(notification.template.message);
    //const { callApi, loading } = useApi();
    
    // Initialize form with notification data when component mounts
    useEffect(() => {
        if (notifications) {
            form.setFieldsValue(notifications[notificationKey]);
        }
    }, []);

    const handleMentionClick = (mention: string) => {
        const currentValue = form.getFieldValue(['template', 'subject']) || '';
        form.setFieldsValue({
          template: {
            subject: currentValue + mention
          }
        });
        setMergeTagModal(false);
        
        // Mark as needing to save
        const updatedValues = form.getFieldsValue();
        handleFormChange(updatedValues);
    };

    const handleSave = () => {
        form.validateFields().then((values) => {
            const updatedSettings = { ...notifications, [notificationKey]: { ...notifications[notificationKey], ...values } };
            setNotifications(updatedSettings);
        });
    };

    // const handleSwitchChange = (checked: boolean) => {
    //     if (!notification) {
    //         return;
    //     }
    //     const updatedSettings = { ...notifications, [notificationKey]: { ...notification, default: checked } };
    //     setNotifications(updatedSettings);
    // };

    // Handle form field changes
    const handleFormChange = (changedValues) => {
        const updatedSettings = { 
            ...notifications, 
            [notificationKey]: { 
                ...notifications[notificationKey], 
                ...changedValues 
            } 
        };
        setNotifications(updatedSettings);
    };

    // const handleEdit = () => {
    //     setEditingKey(notificationKey);
    //     form.setFieldsValue(notification);
    // };

    // Add form.onFieldsChange to detect changes
    const onFieldsChange = () => {
        // This will mark the form as needing to be saved whenever any field changes
        handleSave();
    };

    const renderModalContent = () => (
        <Form 
            form={form} 
            layout="vertical" 
            className='w-full'
            initialValues={{
                times: [{ value: 15, unit: 'minutes' }],
                ...form.getFieldsValue(),
            }}
            onValuesChange={handleFormChange}
            onFieldsChange={onFieldsChange}
        >
            {notificationType === 'email' && (
                <>
                <Form.Item name={['template', 'subject']}
                    label={<span className="text-[#09090B] text-[16px] font-semibold">
                        {__('Subject', 'quillbooking')}
                        <span className='text-red-500'>*</span>
                    </span>}
                    rules={[{ required: true, message: __('Subject is required', 'quillbooking') }]}
                    className='w-full mb-6'
                >
                    <Input
                        placeholder='New Booking: {{guest.full_name}} @ {{booking.start_date_time_for_host}}'
                        className='h-[48px] rounded-lg'
                        suffix={<span className='bg-[#EEEEEE] p-[0.7rem] rounded-r-lg' onClick={()=>setMergeTagModal(true)}>
                            <UrlIcon />
                        </span>}
                        style={{ padding: "0 0 0 10px" }} />
                </Form.Item>
                <Modal
                    open={mergeTagModal}
                    onCancel={() => setMergeTagModal(false)}
                    footer={null}
                    width={700}
                    getContainer={false}
                >
                    <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                        <div className='bg-[#EDEDED] rounded-lg p-3 mt-2' >
                            <UrlIcon />
                        </div>
                        <Header header={__('Subject Merge tags', 'quillbooking')}
                            subHeader={__(
                            'Choose your Merge tags type and Select one of them related to your input.',
                            'quillbooking'
                            )} />
                    </Flex>
                    <MergeTagModal onMentionClick={handleMentionClick}/>
                </Modal>
                </>
            )}
            <Form.Item name={['template', 'message']}
                rules={[{ required: true, message: __('Message is required', 'quillbooking') }]}
                className='w-full mb-5'
            >
                {notificationType === 'email' ? (
                    <>
                        <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('Email Body', 'quillbooking')}
                            <span className='text-red-500'>*</span>
                        </span>
                        <div className='mt-2'>
                        <EmailEditor message={notifications[notificationKey].template.message}
                            onChange={(content) => {
                                form.setFieldsValue({ template: { message: content } });
                                handleFormChange({ template: { message: content } });
                            }} />
                        </div>
                    </>
                ) : (
                    <>
                        {/* <span className="text-[#09090B] text-[16px] font-semibold">
                            {__('SMS Body', 'quillbooking')}
                        </span>
                        <TextArea
                            autoSize={{ minRows: 4 }}
                            value={form.getFieldValue('template')?.message}
                            onChange={(e) => {
                                const value = e.target.value;
                                form.setFieldsValue({ template: { message: value } });
                                handleFormChange({ template: { message: value } });
                            }}
                            className='mt-2 rounded-lg'
                        /> */}
                    </>
                )}
            </Form.Item>
            <Form.Item
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
                                handleFormChange({ recipients: _emails });
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
                        rules={[{ required: true, message: __('Type is required', 'quillbooking') }]}
                    >
                        <Radio.Group className='text-[#3F4254] font-semibold'>
                            <Radio value="sms" className='custom-radio'>{__('SMS', 'quillbooking')}</Radio>
                            <Radio value="whatsapp" className='custom-radio'>{__('WhatsApp', 'quillbooking')}</Radio>
                        </Radio.Group>
                    </Form.Item>
                )}
            </Form.Item>

        </Form>
    );

    return (
        <Card style={{ marginBottom: 16 }}>
            <Flex gap={10} align="center">
                {renderModalContent()}
            </Flex>
        </Card>
    );
};

export default NotificationCard;