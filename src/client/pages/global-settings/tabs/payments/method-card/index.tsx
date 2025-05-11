/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

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
} from 'antd';

/**
 * Internal dependencies
 */
import paypal from '../../../../../../../assets/icons/paypal/paypal_vertical.png';
import stripe from '../../../../../../../assets/icons/stripe/stripe.png';
import type { PaymentGateway } from '@quillbooking/config';
import { useApi, useNotice } from '@quillbooking/hooks';

export interface PaymentGatewayCardProps {
    slug: string | null;
    gateway: PaymentGateway;
}

const PaymentGatewayCard: React.FC<PaymentGatewayCardProps> = ({ slug, gateway }) => {
    if (!slug) return null;
    const [form] = Form.useForm();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();

    useEffect(() => {
        // Load existing settings when gateway changes
        const settings = gateway.settings || {};
        form.setFieldsValue({
            ...settings,
            mode: settings.mode || 'sandbox'
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
                            onChange={(e) => { gateway.enabled = e.target.checked }}
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
                        >
                            <Form.Item
                                name="mode"
                                className='mt-3'
                            >
                                <div className="text-[#3F4254] font-semibold text-[16px]">
                                    {__('Payment Mode', 'quillbooking')}
                                </div>
                                <Radio.Group className="flex gap-2 mt-2 w-full">
                                    <Radio value="saandbox"
                                        className={`custom-radio border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                        ${gateway.settings.mode === 'saandbox'
                                                ? 'bg-color-secondary border-color-primary'
                                                : 'border'
                                            }`}
                                    >
                                        {__('Sandbox (Testing)', 'quillbooking')}
                                    </Radio>
                                    <Radio value="live"
                                        className={`custom-radio border w-1/2 rounded-lg p-3 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                        ${gateway.settings.mode === 'live'
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
                                            <Flex vertical gap={10}>
                                                {Object.entries(gatewayFields).map(([fieldKey, field]) => (
                                                    <Flex vertical gap={10} key={fieldKey}>
                                                        <Form.Item
                                                            name={`${mode}_${fieldKey}`}
                                                            tooltip={field.description}
                                                            rules={[
                                                                {
                                                                    required: field.required,
                                                                    message: __('This field is required', 'quillbooking'),
                                                                },
                                                            ]}
                                                        >
                                                            {['checkbox', 'switch'].includes(field.type) ? (
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-[#3F4254] font-semibold text-[16px]">
                                                                        {field.label}
                                                                    </div>
                                                                    {renderField(field)}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="text-[#3F4254] font-semibold text-[16px]">
                                                                        {field.label}
                                                                        {field.required && <span className="text-red-500">*</span>}
                                                                    </div>
                                                                    {renderField(field)}
                                                                </div>
                                                            )}
                                                        </Form.Item>
                                                    </Flex>
                                                ))}
                                            </Flex>
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
                                                        loading={loading}
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
        </Card>
    );
};

export default PaymentGatewayCard;