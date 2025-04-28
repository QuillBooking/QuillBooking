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
import { Editor, Header, MergeTagModal, UrlIcon } from '@quillbooking/components';
import Mentions from '../../../../../../components/editor/mentions';

const { TextArea } = Input;

type NotificationCardProps = {
    notifications: Record<string, NotificationType>;
    notificationKey: string;
    setNotifications: (notifications: Record<string, NotificationType>) => void;
};

const SmsNotificationCard: React.FC<NotificationCardProps> = ({ notifications, notificationKey, setNotifications }) => {
    const [form] = Form.useForm();
    const [mergeTagModal, setMergeTagModal] = useState<boolean>(false);

    // Get the current notification
    const notification = notifications[notificationKey];

    // Update form when notification changes
    useEffect(() => {
        if (notification) {
            // Reset the form with current notification values
            form.setFieldsValue({
                template: {
                    message: notification.template?.message || '',
                    type: notification.template?.type || '',
                }
            });
        }
    }, [notification, form]);
    console.log(notification)

    const handleMentionClick = (mention: string, category) => {
        const currentValue = form.getFieldValue(['template', 'message']) || '';
        form.setFieldsValue({
            template: {
                ...form.getFieldValue('template'),
                message: currentValue + mention
            }
        });
        setMergeTagModal(false);

        // Update notifications with the new message
        handleFormChange(form.getFieldsValue());
    };

    const handleFormChange = (changedValues) => {
        // Create deep copy of notifications to avoid reference issues
        const updatedNotifications = JSON.parse(JSON.stringify(notifications));

        // Ensure template object exists
        if (!updatedNotifications[notificationKey].template) {
            updatedNotifications[notificationKey].template = {};
        }

        // Update only the fields that changed
        if (changedValues.template) {
            if (changedValues.template.message !== undefined) {
                updatedNotifications[notificationKey].template.message = changedValues.template.message;
            }
            if (changedValues.template.type !== undefined) {
                // Store the type value in the subject field (based on your code structure)
                updatedNotifications[notificationKey].template.type = changedValues.template.type;
            }
        }

        // Update parent component
        setNotifications(updatedNotifications);
    };

    // Check if notification exists before rendering
    if (!notification) {
        return <Card>No notification data found</Card>;
    }

    return (
        <Card style={{ marginBottom: 16 }}>
            <Flex gap={10} align="center">
                <Form
                    form={form}
                    layout="vertical"
                    className='w-full'
                    initialValues={{
                        template: {
                            message: notification.template?.message || '',
                            type: notification.template?.type || ''
                        }
                    }}
                    onValuesChange={handleFormChange}
                >
                    <Form.Item
                        label={
                            <Flex justify='space-between' align='center'>
                                <span className="text-[#09090B] text-[16px] font-semibold w-[540px]">
                                    {__('SMS Body', 'quillbooking')}
                                </span>
                                {/* <div className='bg-[#EEEEEE] p-2 rounded-lg border border-[#D3D4D6]' onClick={() => setMergeTagModal(true)}>
                                    <UrlIcon />
                                </div> */}
                            </Flex>
                        }
                        name={['template', 'message']}
                        rules={[{ required: true, message: __('Message is required', 'quillbooking') }]}
                        className='w-full mb-5'
                    >
                        {/* <TextArea
                            autoSize={{ minRows: 4 }}
                            className='mt-2 rounded-lg'
                        /> */}
                       <Editor message={notification?.template?.message || ''}
						onChange={(content) => {
							form.setFieldsValue({
								template: {
									...form.getFieldValue('template'),
									message: content,
								},
							});
							handleFormChange({
								template: { message: content },
                            
							});
						}}
                        type='sms'
                        />
                    </Form.Item>
                    <Form.Item
                        className='w-full mb-5'
                    >
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
                    </Form.Item>
                </Form>
                <Modal
                    open={mergeTagModal}
                    onCancel={() => setMergeTagModal(false)}
                    footer={null}
                    width={1000}
                    getContainer={false}
                >
                    <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                        <div className='bg-[#EDEDED] rounded-lg p-3 mt-2' >
                            <UrlIcon />
                        </div>
                        <Header header={__('SMS Merge tags', 'quillbooking')}
                            subHeader={__(
                                'Choose your Merge tags type and Select one of them related to your input.',
                                'quillbooking'
                            )} />
                    </Flex>
                    <Mentions onMentionClick={(mention, category) => handleMentionClick(mention, category)} />
                </Modal>
            </Flex>
        </Card>
    );
};

export default SmsNotificationCard;