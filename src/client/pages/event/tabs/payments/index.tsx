/**
 * WordPress Dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * External Dependencies
 */
import { Card, Flex, Button, Switch, Input, InputNumber, Radio, Skeleton, Typography, Form, Table } from 'antd';
import { get, isEmpty, map } from 'lodash';

/**
 * Internal Dependencies
 */
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { ProductSelect } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { useEventContext } from '../../state/context';

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
    }
}

const EventPaymentsSettings: React.FC = () => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [settings, setSettings] = useState<PaymentsSettings | null>(null);
    const setBreadcrumbs = useBreadcrumbs();
    const [form] = Form.useForm();

    const fetchSettings = () => {
        if (!event) return;

        callApi({
            path: `events/${event.id}/meta/payments_settings`,
            method: 'GET',
            onSuccess(response: PaymentsSettings) {
                setSettings(response);
                const initialValues = get(event, 'additional_settings.selectable_durations', []).reduce((acc, duration) => {
                    acc[duration.toString()] = get(settings, ['multi_duration_items', duration], { item: __('Booking Item', 'quillbooking'), price: 100 });
                    return acc;
                }, {});

                form.setFieldsValue({
                    enable_payment: response.enable_payment,
                    type: response.type,
                    woo_product: response.woo_product,
                    enable_items_based_on_duration: response.enable_items_based_on_duration,
                    items: response.items,
                    multi_duration_items: isEmpty(response.multi_duration_items) ? initialValues : response.multi_duration_items,
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
                    successNotice(__('Settings saved successfully', 'quillbooking'));
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
            render: (text: number) => sprintf(__('%s minutes', 'quillbooking'), text),
        },
        {
            title: __('Item Name', 'quillbooking'),
            dataIndex: 'item',
            key: 'item',
            render: (text: string, item: PaymentItem & { duration: string }) => (
                <Form.Item
                    name={['multi_duration_items', item.duration, 'item']}
                    initialValue={text}
                    rules={[{ required: true, message: __('Please enter item name', 'quillbooking') }]}
                >
                    <Input placeholder={__('Item Name', 'quillbooking')} />
                </Form.Item>
            ),
        },
        {
            title: __('Price', 'quillbooking'),
            dataIndex: 'price',
            key: 'price',
            render: (text: number, item: PaymentItem & { duration: string }) => (
                <Form.Item
                    name={['multi_duration_items', item.duration, 'price']}
                    initialValue={text}
                    rules={[{ required: true, message: __('Please enter item price', 'quillbooking') }]}
                >
                    <InputNumber placeholder={__('Price', 'quillbooking')} />
                </Form.Item>
            ),
        },
    ];

    const isWooCommerceEnabled = ConfigAPI.isWoocommerceActive();

    return (
        <Flex vertical gap={20} className="quillbooking-payments-tab">
            <Title className="quillbooking-tab-title" level={4}>
                {__('Payments Settings', 'quillbooking')}
            </Title>
            <Form form={form} layout="vertical" onFinish={saveSettings}>
                <Card>
                    <Form.Item name="enable_payment" valuePropName="checked" label={__('Enable Payments', 'quillbooking')}>
                        <Switch />
                    </Form.Item>
                    <Form.Item shouldUpdate style={{ marginBottom: 0 }}>
                        {({ getFieldValue }) => {
                            const enablePayment = getFieldValue('enable_payment');
                            const type = getFieldValue('type');
                            const allowAttendeesToSelectDuration = get(event, 'additional_settings.allow_attendees_to_select_duration');
                            const enableItemsBasedOnDuration = getFieldValue('enable_items_based_on_duration');
                            if (!enablePayment) return null;

                            return (
                                <>
                                    <Form.Item name="type" label={__('Payment Type', 'quillbooking')}>
                                        <Radio.Group>
                                            <Radio value="native">{__('Use Native Payment Methods by Quillbooking', 'quillbooking')}</Radio>
                                            <Radio value="woocommerce" disabled={!isWooCommerceEnabled}>{__('Use WooCommerce', 'quillbooking')}</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                    {type === 'woocommerce' && isWooCommerceEnabled && (
                                        <Form.Item name="woo_product" label={__('WooCommerce Product', 'quillbooking')} rules={[{ required: true, message: __('Please select a WooCommerce product', 'quillbooking') }]}>
                                            <ProductSelect
                                                placeholder={__('Select a WooCommerce product...', 'quillbooking')}
                                                onChange={(value) => form.setFieldsValue({ woo_product: value })}
                                                value={get(settings, 'woo_product') || 0}
                                            />
                                        </Form.Item>
                                    )}
                                    {type === 'native' && (
                                        <>
                                            {allowAttendeesToSelectDuration && (
                                                <Form.Item name="enable_items_based_on_duration" valuePropName="checked" label={__('Enable Items Based on Duration', 'quillbooking')}>
                                                    <Switch />
                                                </Form.Item>
                                            )}
                                            {enableItemsBasedOnDuration && allowAttendeesToSelectDuration ? (
                                                <>
                                                    <Table
                                                        columns={columns}
                                                        dataSource={map(get(event, 'additional_settings.selectable_durations'), (duration) => ({
                                                            duration: duration.toString(),
                                                            item: get(settings, ['multi_duration_items', duration, 'item']),
                                                            price: get(settings, ['multi_duration_items', duration, 'price']),
                                                        }))}
                                                        pagination={false}
                                                        bordered
                                                    />
                                                </>
                                            ) : (
                                                <Form.List name="items">
                                                    {(fields, { add, remove }) => (
                                                        <>
                                                            {fields.map(({ key, name, ...restField }) => (
                                                                <Flex key={key} gap={10}>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, 'item']}
                                                                        rules={[{ required: true, message: __('Please enter item name', 'quillbooking') }]}
                                                                    >
                                                                        <Input placeholder={__('Item Name', 'quillbooking')} />
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, 'price']}
                                                                        rules={[{ required: true, message: __('Please enter item price', 'quillbooking') }]}
                                                                    >
                                                                        <InputNumber placeholder={__('Price', 'quillbooking')} />
                                                                    </Form.Item>
                                                                    <Button danger onClick={() => remove(name)}>
                                                                        {__('Remove', 'quillbooking')}
                                                                    </Button>
                                                                </Flex>
                                                            ))}
                                                            <Button type="dashed" onClick={() => add({ item: 'Booking Item', price: 100 })}>
                                                                {__('Add Item', 'quillbooking')}
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
                </Card>
                <Button type="primary" htmlType="submit" loading={loading} style={{ marginTop: 20 }}>
                    {__('Save Settings', 'quillbooking')}
                </Button>
            </Form>
        </Flex>
    );
};

export default EventPaymentsSettings;