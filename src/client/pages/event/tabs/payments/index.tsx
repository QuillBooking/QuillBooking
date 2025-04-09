/**
 * WordPress Dependencies
 */
import { useEffect, useState } from '@wordpress/element';
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
    Typography,
    Form,
    Table,
    Checkbox,
} from 'antd';
import { get, isEmpty, map } from 'lodash';

/**
 * Internal Dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { Header, PaymentIcon, ProductSelect } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { useEventContext } from '../../state/context';
import './style.scss';
import { FaPlus } from 'react-icons/fa';
import paypal from '../../../../../../assets/icons/paypal/paypal.png';
import stripe from '../../../../../../assets/icons/stripe/stripe.png';

const { Title } = Typography;

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
}

const Payments: React.FC = () => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [settings, setSettings] = useState<PaymentsSettings | null>(null);
    const setBreadcrumbs = useBreadcrumbs();
    const [form] = Form.useForm();
    const [selectedValue, setSelectedValue] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<string[]>([]);

    const toggleSelectionMethod = (method: string) => {
        setSelectedMethod((prev) =>
            prev.includes(method)
                ? prev.filter((item) => item !== method) // Remove if already selected
                : [...prev, method] // Add if not selected
        );
    };

    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/payments_settings`,
            method: 'GET',
            onSuccess(response: PaymentsSettings) {
                setSettings(response);
                const initialValues = get(
                    event,
                    'additional_settings.selectable_durations',
                    []
                ).reduce((acc, duration) => {
                    acc[duration.toString()] = get(
                        settings,
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

            const updatedSettings = {
                ...settings,
                ...values,
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
                },
                onError(error) {
                    errorNotice(error.message);
                },
            });
        });
    };

    if (!settings || !event) {
        return <Skeleton active />;
    }

    const columns = [
        {
            title: __('Duration', 'quillbooking'),
            dataIndex: 'duration',
            key: 'duration',
            render: (text: number) =>
                sprintf(__('%s minutes', 'quillbooking'), text),
        },
        {
            title: __('Item Name', 'quillbooking'),
            dataIndex: 'item',
            key: 'item',
            render: (
                text: string,
                item: PaymentItem & { duration: string }
            ) => (
                <Form.Item
                    name={['multi_duration_items', item.duration, 'item']}
                    initialValue={text}
                    rules={[
                        {
                            required: true,
                            message: __(
                                'Please enter item name',
                                'quillbooking'
                            ),
                        },
                    ]}
                >
                    <Input placeholder={__('Item Name', 'quillbooking')} />
                </Form.Item>
            ),
        },
        {
            title: __('Price', 'quillbooking'),
            dataIndex: 'price',
            key: 'price',
            render: (
                text: number,
                item: PaymentItem & { duration: string }
            ) => (
                <Form.Item
                    name={['multi_duration_items', item.duration, 'price']}
                    initialValue={text}
                    rules={[
                        {
                            required: true,
                            message: __(
                                'Please enter item price',
                                'quillbooking'
                            ),
                        },
                    ]}
                >
                    <InputNumber placeholder={__('Price', 'quillbooking')} />
                </Form.Item>
            ),
        },
    ];

    const isWooCommerceEnabled = ConfigAPI.isWoocommerceActive();

    return (
        <Card className="rounded-lg mx-9">
            <Flex gap={10} className="items-center border-b pb-4">
                <div className="bg-[#EDEDED] rounded-lg p-2">
                    <PaymentIcon />
                </div>
                <Header
                    header={__('Pricing Options', 'quillbooking')}
                    subHeader={__(
                        'Select Pricing Modal and your price.',
                        'quillbooking'
                    )}
                />
            </Flex>
            <Form form={form} layout="vertical" onFinish={saveSettings}>
                <Flex
                    vertical
                    gap={25}
                    className="quillbooking-payments-tab mt-4"
                >
                    <Flex className="justify-between items-center">
                        <Flex vertical gap={1}>
                            <div className="text-[#09090B] font-bold">
                                {__('Enable Payment', 'quillbooking')}
                            </div>
                            <div className="text-[#71717A] font-[500]">
                                {__(
                                    'Enable this event as Paid and collect payment on booking',
                                    'quillbooking'
                                )}
                            </div>
                        </Flex>
                        <Form.Item
                            name="enable_payment"
                            valuePropName="checked"
                        >
                            <Switch className="custom-switch" />
                        </Form.Item>
                    </Flex>
                    <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
                        {({ getFieldValue }) => {
                            const enablePayment =
                                getFieldValue('enable_payment');
                            const type = getFieldValue('type');
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
                                                onChange={(e) =>
                                                    setSelectedValue(
                                                        e.target.value
                                                    )
                                                }
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
                                    <Form.Item className=''>
                                        <Flex vertical gap={2}>
                                            <div className="text-[#09090B] font-semibold text-[16px]">
                                                {__(
                                                    'Select One or More',
                                                    'quillbooking'
                                                )}
                                            </div>
                                            <Flex gap={20}>
                                                <Checkbox checked={selectedMethod.includes("paypal")}
                                                    onChange={() => toggleSelectionMethod("paypal")}
                                                    className={`custom-check border px-4 py-[10px] rounded-lg ${selectedMethod.includes("paypal") ? "border-color-primary bg-color-secondary" : ""}`}>
                                                    <img src={paypal}
                                                        alt='paypal' className='paypal-img ' />
                                                </Checkbox>
                                                <Checkbox checked={selectedMethod.includes("stripe")}
                                                    onChange={() => toggleSelectionMethod("stripe")}
                                                    className={`custom-check border px-4 py-[10px] rounded-lg ${selectedMethod.includes("stripe") ? "border-color-primary bg-color-secondary" : ""}`}>
                                                    <img src={stripe}
                                                        alt='stripe' className='stripe-img' />
                                                </Checkbox>
                                            </Flex>
                                        </Flex>
                                    </Form.Item >
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
                                                    onChange={(value) =>
                                                        form.setFieldsValue({
                                                            woo_product: value,
                                                        })
                                                    }
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
                                            {allowAttendeesToSelectDuration && (
                                                <Form.Item
                                                    name="enable_items_based_on_duration"
                                                    valuePropName="checked"
                                                    label={__(
                                                        'Enable Items Based on Duration',
                                                        'quillbooking'
                                                    )}
                                                >
                                                    <Switch />
                                                </Form.Item>
                                            )}
                                            {enableItemsBasedOnDuration &&
                                                allowAttendeesToSelectDuration ? (
                                                <>
                                                    <Table
                                                        columns={columns}
                                                        dataSource={map(
                                                            get(
                                                                event,
                                                                'additional_settings.selectable_durations'
                                                            ),
                                                            (duration) => ({
                                                                duration:
                                                                    duration.toString(),
                                                                item: get(
                                                                    settings,
                                                                    [
                                                                        'multi_duration_items',
                                                                        duration,
                                                                        'item',
                                                                    ]
                                                                ),
                                                                price: get(
                                                                    settings,
                                                                    [
                                                                        'multi_duration_items',
                                                                        duration,
                                                                        'price',
                                                                    ]
                                                                ),
                                                            })
                                                        )}
                                                        pagination={false}
                                                        bordered
                                                    />
                                                </>
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
                                                                                className='h-[48px] rounded-lg w-[315px]'
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
                                                                                className='h-[48px] rounded-lg w-[315px]'
                                                                            />
                                                                        </Form.Item>
                                                                        {/* <Button
                                                                            danger
                                                                            onClick={() =>
                                                                                remove(
                                                                                    name
                                                                                )
                                                                            }
                                                                        >
                                                                            {__(
                                                                                'Remove',
                                                                                'quillbooking'
                                                                            )}
                                                                        </Button> */}
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
        </Card >
    );
};

export default Payments;
