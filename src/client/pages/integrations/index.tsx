/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
    Card,
    Form,
    Input,
    Button,
    Typography,
    Tabs,
    Flex,
    Row,
    Col,
    Divider,
    Badge,
    Space
} from 'antd';
import { ApiOutlined, LockOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { Header } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import type { Integration } from '@quillbooking/config';

const { Title, Text, Paragraph } = Typography;
// Remove TabPane import as we're now using items prop

const IntegrationsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState('oauth');
    const integrations = Object.entries(ConfigAPI.getIntegrations());
    
    // const oauthIntegrations = Object.entries(integrations).filter(
    //     ([_, integration]) => integration.auth_type === 'oauth' && integration.is_calendar
    // );
    
    const tabItems = [
        {
            key: 'oauth',
            label: (
                <Flex align="center" gap={8}>
                    <LockOutlined />
                    <span>{__('OAuth Integrations', 'quillbooking')}</span>
                </Flex>
            ),
            children: <OAuthIntegrations integrations={integrations} />
        }
    ];

    return (
        <div className="integrations-tab">
            <Card className="settings-card rounded-lg mb-6">
                <Flex gap={10} className="items-center border-b pb-4 mb-4">
                    <div className="bg-[#EDEDED] rounded-lg p-2">
                        <ApiOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <Header
                        header={__('Integrations', 'quillbooking')}
                        subHeader={__(
                            'Configure external integrations with QuillBooking',
                            'quillbooking'
                        )}
                    />
                </Flex>

                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
            </Card>
        </div>
    );
};

/**
 * OAuth Integrations component
 */
const OAuthIntegrations: React.FC<{ integrations: [string, Integration][] }> = ({ integrations }) => {
    if (integrations.length === 0) {
        return (
            <div className="p-4 text-center">
                <Text type="secondary">{__('No OAuth integrations available', 'quillbooking')}</Text>
            </div>
        );
    }

    return (
        <Row gutter={[24, 24]}>
            {integrations.map(([slug, integration]) => (
                <Col xs={24} key={slug}>
                    <IntegrationCard
                        slug={slug}
                        integration={integration}
                    />
                </Col>
            ))}
        </Row>
    );
};

/**
 * Individual Integration Card
 */
const IntegrationCard: React.FC<{
    slug: string;
    integration: Integration;
}> = ({ slug, integration }) => {
    const [form] = Form.useForm();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();

    useEffect(() => {
        form.setFieldsValue(integration.settings.app || {});
    }, [integration, form]);

    const handleSaveSettings = (values: any) => {
        callApi({
            path: `integrations/${slug}`,
            method: 'POST',
            data: { settings: { app: values } },
            onSuccess() {
                successNotice(__('Integration settings saved successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message || __('Failed to save integration settings', 'quillbooking'));
            }
        });
    };

    const displayFields = integration.auth_fields;

    return (
        <Card
            className="integration-card"
            bordered={true}
            style={{ marginBottom: 16 }}
        >
            <Flex gap={16} align="flex-start">
                <div className="integration-icon">
                    <img
                        src={integration.icon}
                        alt={integration.name}
                        width={48}
                        height={48}
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                <div style={{ flexGrow: 1 }}>
                    <Flex justify="space-between" align="center">
                        <Title level={4}>{integration.name}</Title>
                        <Space>
                            <Badge
                                count={'OAuth'}
                                style={{
                                    backgroundColor: '#52c41a' }}
                            />
                        </Space>
                    </Flex>

                    <Paragraph type="secondary">
                        {integration.description}
                    </Paragraph>

                    <Divider />
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSaveSettings}
                    >
                        <Row gutter={[16, 16]}>
                            {Object.entries(displayFields).map(([fieldKey, field]) => (
                                <Col span={12} key={fieldKey}>
                                    <Form.Item
                                        name={fieldKey}
                                        label={field.label}
                                        tooltip={field.description}
                                        rules={[
                                            {
                                                required: field.required,
                                                message: __('This field is required', 'quillbooking'),
                                            },
                                        ]}
                                    >
                                        <Input
                                            type={field.type === 'password' ? 'password' : 'text'}
                                            placeholder={field.placeholder || ''}
                                        />
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                            >
                                {__('Save Settings', 'quillbooking')}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Flex>
        </Card>
    );
};

export default IntegrationsTab;

// /**
//  * WordPress dependencies
//  */
// import { __ } from '@wordpress/i18n';
// import { useEffect, useState } from '@wordpress/element';

// /**
//  * External dependencies
//  */
// import { Button, Card, Flex } from 'antd';

// /**
//  * Internal dependencies
//  */
// import { Header, TabButtons, UpcomingCalendarIcon, VideoConferencingIcon } from '@quillbooking/components';
// import { useCurrentUser, useNavigate, useNotice } from '@quillbooking/hooks';
// import { CalendarsIntegrations, VideoConferencing } from './tabs';

// /**
//  * Integration component
//  * Parent component for all integrations tabs
//  */

// const Integrations: React.FC = () => {
//     const navigate = useNavigate();
//     const { isAdmin } = useCurrentUser();
//     const { errorNotice } = useNotice();
//     const [activeTab, setActiveTab] = useState<string>('video');

//     useEffect(() => {
//         if (!isAdmin()) {
//             errorNotice(__('You do not have permission to access this page', 'quillbooking'));
//             navigate('calendars');
//             return;
//         }
//     }, []);

//     if (!isAdmin()) {
//         return null;
//     }

//     const handleTabChange = (key: string) => {
//         setActiveTab(key);
//     };

//     const renderTabContent = () => {
//         switch (activeTab) {
//             case 'video':
//                 return <VideoConferencing />;
//             case 'calendars':
//                 return <CalendarsIntegrations />;
//             default:
//                 return <VideoConferencing />;
//         }
//     };

//     const items = [
//         {
//             key: 'video',
//             label: __('Video Conferencing', 'quillbooking'),
//             icon: <VideoConferencingIcon />
//         },
//         {
//             key: 'calendars',
//             label: __('Calendars', 'quillbooking'),
//             icon: <UpcomingCalendarIcon width={20} height={20} />
//         },
//     ];

//     return (
//         <div className="quillbooking-integrations-page">
//             <Header
//                 header={__('Integrations', 'quillbooking')}
//                 subHeader={__('Connect Quill Booking to your tools and apps to enhance your scheduling automations.', 'quillbooking')}
//             />
//             <Flex vertical gap={20} className="integrations-container">
//                 <Card className='mt-5'>
//                     <Flex gap={15} align='center' justify='flex-start'>
//                         {items.map(({ key, label, icon }) => (
//                             <Button
//                                 key={key}
//                                 type="text"
//                                 onClick={() => handleTabChange(key)}
//                                 className={`${activeTab === key ? 'bg-color-tertiary' : ''}`}
//                             >
//                                 <TabButtons 
//                                     label={label} 
//                                     icon={icon}
//                                     isActive={activeTab === key} 
//                                 />
//                             </Button>
//                         ))}
//                     </Flex>
//                 </Card>
//                 <Flex>
//                     {renderTabContent()}
//                 </Flex>
//             </Flex>
//         </div>
//     );
// };

// export default Integrations;