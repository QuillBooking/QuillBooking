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
    Radio,
    Switch,
} from 'antd';
import { DollarOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { Header } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import type { PaymentGateway } from '@quillbooking/config';

const { Text, Paragraph } = Typography;

const PaymentsTab: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const paymentGateways = ConfigAPI.getPaymentGateways();

    useEffect(() => {
        if (Object.keys(paymentGateways).length > 0 && !activeTab) {
            setActiveTab(Object.keys(paymentGateways)[0]);
        }
    }, [paymentGateways, activeTab]);

    const tabItems = Object.entries(paymentGateways).map(([slug, gateway]) => ({
        key: slug,
        label: gateway.name,
        children: <PaymentGatewayCard slug={slug} gateway={gateway} />
    }));

    return (
        <div className="payments-tab">
            <Card className="settings-card rounded-lg mb-6">
                <Flex gap={10} className="items-center border-b pb-4 mb-4">
                    <div className="bg-[#EDEDED] rounded-lg p-2">
                        <DollarOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <Header
                        header={__('Payment Gateways', 'quillbooking')}
                        subHeader={__(
                            'Configure payment gateways for accepting payments',
                            'quillbooking'
                        )}
                    />
                </Flex>

                {tabItems.length > 0 ? (
                    <Tabs
                        activeKey={activeTab || undefined}
                        onChange={setActiveTab}
                        items={tabItems}
                        type="card"
                    />
                ) : (
                    <div className="p-4 text-center">
                        <Text type="secondary">{__('No payment gateways available', 'quillbooking')}</Text>
                    </div>
                )}
            </Card>
        </div>
    );
};

/**
 * Individual Payment Gateway Card
 */
const PaymentGatewayCard: React.FC<{
    slug: string;
    gateway: PaymentGateway;
}> = ({ slug, gateway }) => {
    const [form] = Form.useForm();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();

    useEffect(() => {
        // Load existing settings
        const settings = gateway.settings || {};
        form.setFieldsValue({
            mode: settings.mode || 'sandbox',
            ...settings
        });
    }, [gateway, form]);

    const handleSaveSettings = (values: any) => {
        form.validateFields()
            .then(() => {
                callApi({
                    path: `payment-gateways/${slug}`,
                    method: 'POST',
                    data: values,
                    onSuccess() {
                        successNotice(__('Payment gateway settings saved successfully', 'quillbooking'));
                    },
                    onError(error) {
                        errorNotice(error.message || __('Failed to save payment gateway settings', 'quillbooking'));
                    }
                });
            }).catch((error) => {
                errorNotice(error.message || __('Failed to save settings', 'quillbooking'));
            });
    };

    const renderField = (field: any) => {
        switch (field.type) {
            case 'switch':
            case 'checkbox':
                return <Switch />;
            case 'password':
                return (
                    <Input
                        type="password"
                        placeholder={field.placeholder || ''}
                    />
                );
            case 'email':
                return (
                    <Input
                        type="email"
                        placeholder={field.placeholder || ''}
                    />
                );

            case 'text':
            default:
                return (
                    <Input
                        placeholder={field.placeholder || ''}
                    />
                );
        }
    };

    // Get all fields for the gateway
    const gatewayFields = gateway.fields || {};

    return (
        <Card
            className="payment-gateway-card"
            bordered={false}
        >
            <Flex gap={16} align="flex-start">
                <div style={{ flexGrow: 1 }}>
                    <Paragraph type="secondary">
                        {gateway.description}
                    </Paragraph>

                    <Divider />
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSaveSettings}
                        initialValues={{ mode: 'sandbox' }}
                    >
                        <Form.Item
                            name="mode"
                            label={__('Environment Mode', 'quillbooking')}
                        >
                            <Radio.Group>
                                <Radio value="sandbox">{__('Sandbox (Testing)', 'quillbooking')}</Radio>
                                <Radio value="live">{__('Live (Production)', 'quillbooking')}</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Divider dashed />
                        <Form.Item shouldUpdate>
                            {({ getFieldValue }) => {
                                const mode = getFieldValue('mode') || 'sandbox';
                                return (
                                    <>
                                        <Row gutter={[16, 16]}>
                                            {Object.entries(gatewayFields).map(([fieldKey, field]) => (
                                                <Col span={12} key={fieldKey}>
                                                    <Form.Item
                                                        name={`${mode}_${fieldKey}`}
                                                        label={field.label}
                                                        tooltip={field.description}
                                                        rules={[
                                                            {
                                                                required: field.required,
                                                                message: __('This field is required', 'quillbooking'),
                                                            },
                                                        ]}
                                                    >
                                                        {renderField(field)}
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
                                    </>
                                );
                            }}
                        </Form.Item>

                    </Form>
                </div>
            </Flex>
        </Card>
    );
};

export default PaymentsTab;