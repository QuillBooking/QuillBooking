/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
    Card,
    Button,
    Flex,
    Form,
    Input,
    Divider,
    Radio,
    Switch,
    Checkbox,
    Skeleton,
    Spin,
} from 'antd';

/**
 * Internal dependencies
 */
// @ts-ignore
import paypal from '../../../../../../../assets/icons/paypal/paypal_vertical.png';
// @ts-ignore
import stripe from '../../../../../../../assets/icons/stripe/stripe.png';
import type { PaymentGateway } from '@quillbooking/config';
import { useApi, useNotice } from '@quillbooking/hooks';

// Extend the PaymentGateway type for our component needs
interface ExtendedPaymentGateway extends PaymentGateway {
    enabled?: boolean;
}

export interface PaymentGatewayCardProps {
    slug: string | null;
    gateway: ExtendedPaymentGateway;
    updateGatewayProperty: (property: string, value: any) => void;
    updateGatewaySettings: (gatewayId: string, settings: any) => void;
    isLoading?: boolean;
}

const PaymentGatewayCard: React.FC<PaymentGatewayCardProps> = ({ 
    slug, 
    gateway, 
    updateGatewayProperty,
    updateGatewaySettings,
    isLoading = false
}) => {
    if (!slug) return null;
    const [form] = Form.useForm();
    const { callApi, loading: isSaving } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [formMode, setFormMode] = useState(gateway.settings?.mode || 'sandbox');

    useEffect(() => {
        // Only set form values if gateway settings exist and form exists
        if (gateway.settings && form) {
            const settings = gateway.settings || {};
            // Reset fields first to avoid field value persistence between different gateways
            form.resetFields();
            // Then set the values
            form.setFieldsValue({
                ...settings,
                mode: settings.mode || 'sandbox'
            });
            setFormMode(settings.mode || 'sandbox');
        }
    }, [gateway, form]);

    const handleSaveSettings = (values: any) => {
        // Only validate if gateway is enabled
        if (gateway.enabled) {
            form.validateFields()
                .then(() => {
                    callApi({
                        path: `payment-gateways/${slug}`,
                        method: 'POST',
                        data: values,
                        onSuccess() {
                            successNotice(__('Payment gateway settings saved successfully', 'quillbooking'));
                            // Update the local state with the new settings
                            updateGatewaySettings(slug, values);
                            setFormMode(values.mode || 'sandbox');
                        },
                        onError(error) {
                            errorNotice(error.message || __('Failed to save payment gateway settings', 'quillbooking'));
                        }
                    });
                }).catch((error) => {
                    errorNotice(error.message || __('Failed to save settings', 'quillbooking'));
                });
        }
    };

    const renderField = (field: any) => {
        switch (field.type) {
            case 'switch':
            case 'checkbox':
                return <Switch />;
            case 'password':
                return (
                    <Input.Password
                        placeholder={field.placeholder || ''}
                        className='h-[48px] w-full'
                    />
                );
            case 'email':
                return (
                    <Input
                        type="email"
                        placeholder={field.placeholder || ''}
                        className='h-[48px] w-full'
                    />
                );
            case 'text':
            default:
                return (
                    <Input
                        placeholder={field.placeholder || ''}
                        className='h-[48px] w-full'
                    />
                );
        }
    };

    // Get gateway info
    const gatewayFields = gateway.fields || {};
    const title = slug === 'paypal' ? 'PayPal' : 'Stripe';
    const logo = slug === 'paypal' ? paypal : stripe;
    const logoClass = slug === 'paypal' ? 'size-12' : 'w-16 h-8';

    return (
        <Card className="rounded-lg mb-6 w-full">
            {isLoading ? (
                <Flex vertical gap={20}>
                    <Skeleton.Avatar size={64} active />
                    <Skeleton active paragraph={{ rows: 4 }} />
                </Flex>
            ) : (
                <>
                    <Flex align='center' gap={16} className="p-0 text-color-primary-text border-b pb-5">
                        <img src={logo} alt={`${slug}.png`} className={logoClass} />
                        <div>
                            <p className="text-[#09090B] font-bold text-2xl">{__(title, 'quillbooking')}</p>
                            <p className="text-[#71717A] font-medium text-sm">
                                {__(`${title} Information`, "quillbooking")}
                            </p>
                        </div>
                    </Flex>
                    <Flex vertical gap={15} className='mt-5'>
                        <div style={{ flexGrow: 1 }}>
                            <Flex vertical gap={4}>
                                <div className="font-semibold text-[16px]">
                                    {__('Status', 'quillbooking')}
                                </div>
                                <Checkbox
                                    className="custom-check text-[#3F4254] font-semibold"
                                    checked={gateway.enabled}
                                    onChange={(e) => updateGatewayProperty('enabled', e.target.checked)}
                                    disabled={isLoading}
                                >
                                    {__(`Enable ${title} payment for booking payment`, 'quillbooking')}
                                </Checkbox>
                            </Flex>
                            {gateway.enabled && (
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSaveSettings}
                                    initialValues={{ mode: 'sandbox' }}
                                    onValuesChange={(changedValues) => {
                                        if (changedValues.mode) {
                                            setFormMode(changedValues.mode);
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    <Form.Item
                                        name="mode"
                                        className='mt-3'
                                        label={
                                            <div className="text-[#3F4254] font-semibold text-[16px]">
                                                {__('Payment Mode', 'quillbooking')}
                                            </div>
                                        }
                                    >
                                        <Radio.Group className="flex gap-2 mt-2 w-full">
                                            <Radio value="sandbox"
                                                className={`custom-radio border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                                ${formMode === 'sandbox'
                                                        ? 'bg-color-secondary border-color-primary'
                                                        : 'border'
                                                    }`}
                                            >
                                                {__('Sandbox (Testing)', 'quillbooking')}
                                            </Radio>
                                            <Radio value="live"
                                                className={`custom-radio border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                                ${formMode === 'live'
                                                        ? 'bg-color-secondary border-color-primary'
                                                        : 'border'
                                                    }`}
                                            >
                                                {__('Live (Production)', 'quillbooking')}
                                            </Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    <Form.Item shouldUpdate>
                                        {({ getFieldValue }) => {
                                            const mode = getFieldValue('mode') || 'sandbox';
                                            return (
                                                <>
                                                    {isLoading ? (
                                                        <Skeleton active paragraph={{ rows: 4 }} />
                                                    ) : (
                                                        <Flex vertical gap={10}>
                                                            {Object.entries(gatewayFields).map(([fieldKey, field]) => (
                                                                <Flex vertical gap={10} key={fieldKey}>
                                                                    <Form.Item
                                                                        name={`${mode}_${fieldKey}`}
                                                                        label={
                                                                            <div className="text-[#3F4254] font-semibold text-[16px]">
                                                                                {field.label}
                                                                                {field.required && <span className="text-red-500">*</span>}
                                                                            </div>
                                                                        }
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
                                                                </Flex>
                                                            ))}
                                                        </Flex>
                                                    )}
                                                    <Divider />
                                                    {slug === 'paypal' && (
                                                        <span className='text-[#71717A] italic'>
                                                            {__('If you are unable to use Payment Data Transfer and payments are not getting marked as complete, then check this box. This forces the site to use a slightly less secure method of verifying purchases.', 'quillbooking')}
                                                        </span>
                                                    )}
                                                    <Form.Item className='mt-4'>
                                                        <Flex justify='flex-end'>
                                                            <Button
                                                                type="primary"
                                                                htmlType="submit"
                                                                loading={isSaving || isLoading}
                                                                disabled={isLoading}
                                                            >
                                                                {__('Save Settings', 'quillbooking')}
                                                            </Button>
                                                        </Flex>
                                                    </Form.Item>
                                                </>
                                            );
                                        }}
                                    </Form.Item>
                                </Form>
                            )}
                        </div>
                    </Flex>
                </>
            )}
        </Card>
    );
};

export default PaymentGatewayCard;