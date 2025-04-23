/**
 * WordPress Dependencies
 */
import { useEffect, useState, forwardRef, useImperativeHandle } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External Dependencies
 */
import {
    Card,
    Flex,
    Button,
    Switch,
    Input,
    InputNumber,
    Radio,
    Skeleton,
    Form,
    Checkbox,
} from 'antd';
import { get, isEmpty, map } from 'lodash';

/**
 * Internal Dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { CardHeader, Header, PaymentIcon, ProductSelect } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { useEventContext } from '../../state/context';
import './style.scss';
import { FaPlus } from 'react-icons/fa';
import paypal from '../../../../../../assets/icons/paypal/paypal.png';
import stripe from '../../../../../../assets/icons/stripe/stripe.png';
import { PiClockClockwiseFill } from "react-icons/pi";


interface PaymentItem {
    item: string;
    price: number;
}

interface PaymentsSettings {
    enable_payment: boolean;
    type: 'native' | 'woocommerce';
    woo_product: number | null;
    enable_items_based_on_duration: boolean;
    items: PaymentItem[];
    multi_duration_items: {
        [key: string]: PaymentItem & { duration: string };
    };
    payment_methods?: string[];
    enable_paypal: boolean;
    enable_stripe: boolean;
}

interface EventPaymentProps {
    disabled: boolean;
    setDisabled: (disabled: boolean) => void;
}

interface EventPaymentHandle {
    saveSettings: () => Promise<void>;
}

const Payments = forwardRef<EventPaymentHandle, EventPaymentProps>((props, ref) => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [settings, setSettings] = useState<PaymentsSettings | null>(null);
    const setBreadcrumbs = useBreadcrumbs();
    const [form] = Form.useForm();
    const [selectedValue, setSelectedValue] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<string[]>([]);
    console.log(settings);

    useImperativeHandle(ref, () => ({
        saveSettings: async () => {
            if (settings) {
                return saveSettings();
            }
        },
    }));

    // Update the toggleSelectionMethod function with null checks
    const toggleSelectionMethod = (method: string) => {
        // Update the selectedMethod array
        const newMethods = selectedMethod.includes(method)
            ? selectedMethod.filter((item) => item !== method) // Remove if already selected
            : [...selectedMethod, method]; // Add if not selected

        setSelectedMethod(newMethods);

        // Only update settings if it's not null
        if (settings) {
            // Update the corresponding boolean flag in settings
            const updatedSettings = { ...settings };
            if (method === 'paypal') {
                updatedSettings.enable_paypal = !updatedSettings.enable_paypal;
            } else if (method === 'stripe') {
                updatedSettings.enable_stripe = !updatedSettings.enable_stripe;
            }

            setSettings(updatedSettings);
        }

        // Update form values
        form.setFieldValue('payment_methods', newMethods);
        form.setFieldValue('enable_paypal', method === 'paypal' ?
            !(settings?.enable_paypal ?? false) :
            (settings?.enable_paypal ?? false));
        form.setFieldValue('enable_stripe', method === 'stripe' ?
            !(settings?.enable_stripe ?? false) :
            (settings?.enable_stripe ?? false));

        // Mark as modified
        if (props.setDisabled) {
            props.setDisabled(false);
        }
    };

    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/payments_settings`,
            method: 'GET',
            onSuccess(response: PaymentsSettings) {
                console.log
                setSettings(response);
                setSelectedValue(response.type || '');
                setSelectedMethod(response.payment_methods || []);

                const initialValues = get(
                    event,
                    'additional_settings.selectable_durations',
                    []
                ).reduce((acc, duration) => {
                    acc[duration.toString()] = get(
                        response,
                        ['multi_duration_items', duration],
                        { item: __('Booking Item', 'quillbooking'), price: 100 }
                    );
                    return acc;
                }, {});

                form.setFieldsValue({
                    enable_payment: response.enable_payment,
                    type: response.type,
                    woo_product: response.woo_product,
                    enable_items_based_on_duration:
                        response.enable_items_based_on_duration,
                    items: response.items,
                    payment_methods: response.payment_methods || [],
                    enable_paypal: response.enable_paypal,
                    enable_stripe: response.enable_stripe,
                    multi_duration_items: isEmpty(response.multi_duration_items)
                        ? initialValues
                        : response.multi_duration_items,
                });
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    useEffect(() => {
        if (!event) {
            return;
        }

        fetchSettings();
        setBreadcrumbs([
            {
                path: `calendars/${event.calendar_id}/events/${event.id}/payments`,
                title: __('Payments Settings', 'quillbooking'),
            },
        ]);
    }, [event]);

    const saveSettings = () => {
        form.validateFields().then((values) => {
            if (!event) return;

            // Include the selected payment methods in the settings
            const updatedSettings = {
                ...settings,
                ...values,
                payment_methods: selectedMethod,
            };

            callApi({
                path: `events/${event.id}`,
                method: 'POST',
                data: {
                    payments_settings: updatedSettings,
                },
                onSuccess() {
                    successNotice(
                        __('Settings saved successfully', 'quillbooking')
                    );
                    if (props.setDisabled) {
                        props.setDisabled(true);
                    }
                },
                onError(error) {
                    errorNotice(error.message);
                },
            });
        });
    };

    const handleFormChange = () => {
        if (props.setDisabled) {
            props.setDisabled(false);
        }
    };

    if (!settings || !event) {
        return <Skeleton active />;
    }

    const isWooCommerceEnabled = ConfigAPI.isWoocommerceActive();

    return (
        <Card className="rounded-lg mx-9">
            <CardHeader title={__('Pricing Options', 'quillbooking')}
                description={__(
                    'Select Pricing Modal and your price.',
                    'quillbooking'
                )}
                icon={<PaymentIcon />} />
            <Form
                form={form}
                layout="vertical"
                onFinish={saveSettings}
                onValuesChange={handleFormChange}
            >
                <Flex
                    vertical
                    gap={25}
                    className="quillbooking-payments-tab mt-4"
                >
                    <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
                        {({ getFieldValue }) => {
                            const enablePayment = getFieldValue('enable_payment');
                            const allowAttendeesToSelectDuration = get(
                                event,
                                'additional_settings.allow_attendees_to_select_duration'
                            );

                            if (!enablePayment) {
                                // Only show Enable Payment full width if switch is off
                                return (
                                    <Flex gap={10} className="w-full">
                                        <Flex className="justify-between items-center w-full">
                                            <Flex vertical gap={1}>
                                                <div className="text-[#09090B] font-bold">
                                                    {__('Enable Payment', 'quillbooking')}
                                                </div>
                                                <div className="text-[#71717A] font-[500]">
                                                    {__('Enable this event as Paid and collect payment on booking', 'quillbooking')}
                                                </div>
                                            </Flex>
                                            <Form.Item name="enable_payment" valuePropName="checked">
                                                <Switch className="custom-switch" />
                                            </Form.Item>
                                        </Flex>
                                    </Flex>
                                );
                            }

                            // enable_payment is ON
                            return (
                                <Flex gap={20} className="w-full">
                                    <Flex className={`justify-between items-center ${allowAttendeesToSelectDuration ? 'w-1/2' : 'w-full'}`}>
                                        <Flex vertical gap={1}>
                                            <div className="text-[#09090B] font-bold">
                                                {__('Enable Payment', 'quillbooking')}
                                            </div>
                                            <div className="text-[#71717A] font-[500]">
                                                {__('Enable this event as Paid and collect payment on booking', 'quillbooking')}
                                            </div>
                                        </Flex>
                                        <Form.Item name="enable_payment" valuePropName="checked">
                                            <Switch className="custom-switch" />
                                        </Form.Item>
                                    </Flex>

                                    {allowAttendeesToSelectDuration && (
                                        <Flex className="justify-between items-center w-1/2">
                                            <Flex vertical gap={1}>
                                                <div className="text-[#09090B] font-bold">
                                                    {__('Enable Multiple Payment', 'quillbooking')}
                                                </div>
                                                <div className="text-[#71717A] font-[500]">
                                                    {__('Enable Multiple Payment options based on duration.', 'quillbooking')}
                                                </div>
                                            </Flex>
                                            <Form.Item
                                                name="enable_items_based_on_duration"
                                                valuePropName="checked"
                                            >
                                                <Switch className="custom-switch" />
                                            </Form.Item>
                                        </Flex>
                                    )}
                                </Flex>
                            );
                        }}
                    </Form.Item>


                    {/* Main form content */}
                    <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
                        {({ getFieldValue }) => {
                            const enablePayment = getFieldValue('enable_payment');
                            const type = getFieldValue('type') || '';
                            const allowAttendeesToSelectDuration = get(
                                event,
                                'additional_settings.allow_attendees_to_select_duration'
                            );
                            const enableItemsBasedOnDuration = getFieldValue(
                                'enable_items_based_on_duration'
                            );
                            if (!enablePayment) return null;

                            return (
                                <>
                                    <Form.Item name="type">
                                        <Flex vertical gap={2}>
                                            <div className="text-[#09090B] font-semibold text-[16px]">
                                                {__(
                                                    'Discount Type',
                                                    'quillbooking'
                                                )}
                                            </div>
                                            <Radio.Group
                                                className="flex w-full"
                                                value={selectedValue}
                                                onChange={(e) => {
                                                    setSelectedValue(e.target.value);
                                                    if (props.setDisabled) {
                                                        props.setDisabled(false);
                                                    }
                                                }}
                                            >
                                                <Radio
                                                    value="native"
                                                    className={`custom-radio border w-1/2 rounded-lg p-4 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                                  ${selectedValue === 'native'
                                                            ? 'bg-color-secondary border-color-primary'
                                                            : 'border'
                                                        }`}
                                                >
                                                    {__(
                                                        'Use Native Payment Methods by Quillbooking',
                                                        'quillbooking'
                                                    )}
                                                </Radio>
                                                <Radio
                                                    value="woocommerce"
                                                    disabled={
                                                        !isWooCommerceEnabled
                                                    }
                                                    className={`custom-radio border w-1/2 rounded-lg p-4 font-semibold cursor-pointer transition-all duration-300 text-[#3F4254] 
                                                ${selectedValue === 'woocommerce'
                                                            ? 'bg-color-secondary border-color-primary'
                                                            : 'border'
                                                        }`}
                                                >
                                                    {__(
                                                        'Use WooCommerce Checkout',
                                                        'quillbooking'
                                                    )}
                                                </Radio>
                                            </Radio.Group>
                                        </Flex>
                                    </Form.Item>
                                    {type === 'woocommerce' &&
                                        isWooCommerceEnabled && (
                                            <Form.Item
                                                name="woo_product"
                                                label={__(
                                                    'WooCommerce Product',
                                                    'quillbooking'
                                                )}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: __(
                                                            'Please select a WooCommerce product',
                                                            'quillbooking'
                                                        ),
                                                    },
                                                ]}
                                            >
                                                <div className="text-[#09090B] text-[16px]">
                                                    {__("Select WooCommerce Product", "quillbooking")}
                                                    <span className='text-red-500'>*</span>
                                                </div>
                                                <ProductSelect
                                                    placeholder={__(
                                                        'Select a WooCommerce product...',
                                                        'quillbooking'
                                                    )}
                                                    onChange={(value) => {
                                                        form.setFieldsValue({
                                                            woo_product: value,
                                                        });
                                                        if (props.setDisabled) {
                                                            props.setDisabled(false);
                                                        }
                                                    }}
                                                    value={
                                                        get(
                                                            settings,
                                                            'woo_product'
                                                        ) || 0
                                                    }
                                                />
                                            </Form.Item>
                                        )
                                    }
                                    {type === 'native' && (
                                        <>
                                            <Form.Item name="payment_methods" className='mt-5'>
                                                <Flex vertical gap={2}>
                                                    <div className="text-[#09090B] font-semibold text-[16px]">
                                                        {__(
                                                            'Select One or More',
                                                            'quillbooking'
                                                        )}
                                                    </div>
                                                    <Flex gap={20} className='mb-5'>
                                                        <Checkbox
                                                            checked={selectedMethod.includes("paypal")}
                                                            onChange={() => toggleSelectionMethod("paypal")}
                                                            className={`custom-check border px-4 py-[10px] rounded-lg ${selectedMethod.includes("paypal") ? "border-color-primary bg-color-secondary" : ""}`}>
                                                            <img src={paypal} alt='paypal' className='paypal-img ' />
                                                        </Checkbox>

                                                        <Checkbox
                                                            checked={selectedMethod.includes("stripe")}
                                                            onChange={() => toggleSelectionMethod("stripe")}
                                                            className={`custom-check border px-4 py-[10px] rounded-lg ${selectedMethod.includes("stripe") ? "border-color-primary bg-color-secondary" : ""}`}>
                                                            <img src={stripe} alt='stripe' className='stripe-img' />
                                                        </Checkbox>
                                                    </Flex>
                                                </Flex>
                                            </Form.Item>
                                            {enableItemsBasedOnDuration &&
                                                allowAttendeesToSelectDuration ? (
                                                <Flex vertical gap={20}>
                                                    <Header
                                                        header={__('Booking Payment Items', 'quillbooking')}
                                                        subHeader={__(
                                                            'Manage your Payment Items per Durations for events.',
                                                            'quillbooking'
                                                        )}
                                                    />
                                                    {map(get(event, 'additional_settings.selectable_durations', []), (duration: number | string) => {
                                                        const durationStr = duration.toString();

                                                        const itemValue = get(settings, ['multi_duration_items', durationStr, 'item']);
                                                        const priceValue = get(settings, ['multi_duration_items', durationStr, 'price']);

                                                        return (
                                                            <Card
                                                                key={durationStr}
                                                                className="w-full"
                                                            >
                                                                <Flex vertical>
                                                                    <div className="font-semibold text-[#7E8299] mb-5 flex items-center px-3 py-1 bg-[#F1F1F2] rounded-lg w-[140px]">
                                                                        <PiClockClockwiseFill className='text-[18px] mr-1' />  {sprintf(__('%s minutes', 'quillbooking'), duration)}
                                                                    </div>
                                                                    <Flex gap={10}>
                                                                        <Form.Item
                                                                            name={['multi_duration_items', durationStr, 'item']}
                                                                            initialValue={itemValue}
                                                                            rules={[
                                                                                {
                                                                                    required: true,
                                                                                    message: __('Please enter item name', 'quillbooking'),
                                                                                },
                                                                            ]}
                                                                            className='w-full'
                                                                        >
                                                                            <div className="text-[#09090B] text-[16px] pb-1">
                                                                                {__("Booking Payment Items", "quillbooking")}
                                                                                <span className='text-red-500'>*</span>
                                                                            </div>
                                                                            <Input placeholder={__('Booking Fee', 'quillbooking')} className='h-[48px] rounded-lg w-full' />
                                                                        </Form.Item>

                                                                        <Form.Item
                                                                            name={['multi_duration_items', durationStr, 'price']}
                                                                            initialValue={priceValue}
                                                                            rules={[
                                                                                {
                                                                                    required: true,
                                                                                    message: __('Please enter item price', 'quillbooking'),
                                                                                },
                                                                            ]}
                                                                            className='w-full'
                                                                        >
                                                                            <div className="text-[#09090B] text-[16px] pb-1">
                                                                                {__("Price", "quillbooking")}
                                                                                <span className='text-red-500'>*</span>
                                                                            </div>
                                                                            <InputNumber
                                                                                placeholder={__('Price', 'quillbooking')}
                                                                                suffix={<span className='border-l pl-2'>$</span>}
                                                                                className='h-[48px] rounded-lg w-full'
                                                                            />
                                                                        </Form.Item>
                                                                    </Flex>
                                                                </Flex>
                                                            </Card>
                                                        );
                                                    })}
                                                </Flex>
                                            ) : (
                                                <Form.List name="items">
                                                    {(
                                                        fields,
                                                        { add }
                                                    ) => (
                                                        <>
                                                            {fields.map(
                                                                ({
                                                                    key,
                                                                    name,
                                                                    ...restField
                                                                }) => (
                                                                    <Flex
                                                                        key={
                                                                            key
                                                                        }
                                                                        gap={10}
                                                                    >
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[
                                                                                name,
                                                                                'item',
                                                                            ]}
                                                                            rules={[
                                                                                {
                                                                                    required:
                                                                                        true,
                                                                                    message:
                                                                                        __(
                                                                                            'Please enter item name',
                                                                                            'quillbooking'
                                                                                        ),
                                                                                },
                                                                            ]}
                                                                            className='w-full'
                                                                        >
                                                                            <div className="text-[#09090B] text-[16px] pb-2">
                                                                                {__("Booking Payment Items", "quillbooking")}
                                                                                <span className='text-red-500'>*</span>
                                                                            </div>
                                                                            <Input
                                                                                placeholder={__(
                                                                                    'Item Name',
                                                                                    'quillbooking'
                                                                                )}
                                                                                className='h-[48px] rounded-lg w-full'
                                                                            />
                                                                        </Form.Item>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[
                                                                                name,
                                                                                'price',
                                                                            ]}
                                                                            rules={[
                                                                                {
                                                                                    required:
                                                                                        true,
                                                                                    message:
                                                                                        __(
                                                                                            'Please enter item price',
                                                                                            'quillbooking'
                                                                                        ),
                                                                                },
                                                                            ]}
                                                                            className='w-full'
                                                                        >
                                                                            <div className="text-[#09090B] text-[16px] pb-2">
                                                                                {__("Price", "quillbooking")}
                                                                                <span className='text-red-500'>*</span>
                                                                            </div>
                                                                            <InputNumber
                                                                                placeholder={__(
                                                                                    'Price',
                                                                                    'quillbooking'
                                                                                )}
                                                                                suffix={<span className='border-l pl-2'>$</span>}
                                                                                className='h-[48px] rounded-lg w-full'
                                                                            />
                                                                        </Form.Item>
                                                                    </Flex>
                                                                )
                                                            )}
                                                            <Button
                                                                onClick={() =>
                                                                    add({
                                                                        item: 'Booking Item',
                                                                        price: 100,
                                                                    })
                                                                }
                                                                icon={<FaPlus className='text-color-primary' />}
                                                                className='text-color-primary font-semibold outline-none border-none shadow-none'
                                                            >
                                                                {__(
                                                                    'Add More Items',
                                                                    'quillbooking'
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}
                                                </Form.List>
                                            )}
                                        </>
                                    )}
                                </>
                            );
                        }}
                    </Form.Item>
                </Flex>
            </Form>
        </Card>
    );
});

export default Payments;