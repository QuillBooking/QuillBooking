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
    Select,
    Radio,
    Checkbox,
    Row,
    Col,
    Button,
    Flex,
} from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import {
    SettingsIcon,
    Header
} from '@quillbooking/components';
import { MailOutlined, DollarOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * General Settings Component
 */
const GeneralSettings = () => {
    const [form] = Form.useForm();
    const { callApi, loading } = useApi();
    const {callApi: saveApi, loading: saveLoading} = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [settings, setSettings] = useState(null);
    const [summaryEnabled, setSummaryEnabled] = useState(false);

    // Fetch settings on component mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        callApi({
            path: 'settings',
            method: 'GET',
            onSuccess(response) {
                setSettings(response);
                form.setFieldsValue({
                    general: response.general,
                    payments: response.payments,
                    email: response.email
                });
                setSummaryEnabled(response.general?.enable_summary_email || false);
            },
            onError(error) {
                errorNotice(error.message || __('Failed to fetch settings', 'quillbooking'));
            },
        });
    };

    const handleSave = (values) => {
        saveApi({
            path: 'settings',
            method: 'POST',
            data: values,
            onSuccess() {
                successNotice(__('Settings saved successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message || __('Failed to save settings', 'quillbooking'));
            },
        });
    };

    // Generate time options for auto cancel/complete
    const getTimeOptions = () => {
        const options: { value: number; label: string }[] = [];

        // 10 to 50 minutes
        for (let i = 10; i <= 50; i += 10) {
            options.push({ value: i, label: `${i} ${__('minutes', 'quillbooking')}` });
        }

        // 1 to 12 hours
        for (let i = 1; i <= 12; i++) {
            options.push({ value: i * 60, label: `${i} ${i === 1 ? __('hour', 'quillbooking') : __('hours', 'quillbooking')}` });
        }

        // 1 to 2 days
        for (let i = 1; i <= 2; i++) {
            options.push({ value: i * 24 * 60, label: `${i} ${i === 1 ? __('day', 'quillbooking') : __('days', 'quillbooking')}` });
        }

        return options;
    };

    // Country code options simplified without ISOCountries
    const countryOptions = [
        { value: '+1', label: 'United States (+1)' },
        { value: '+44', label: 'United Kingdom (+44)' },
        { value: '+91', label: 'India (+91)' },
        { value: '+49', label: 'Germany (+49)' },
        { value: '+33', label: 'France (+33)' },
        { value: '+81', label: 'Japan (+81)' },
        { value: '+86', label: 'China (+86)' },
        { value: '+7', label: 'Russia (+7)' },
        { value: '+61', label: 'Australia (+61)' },
        { value: '+55', label: 'Brazil (+55)' },
        { value: '+39', label: 'Italy (+39)' },
        { value: '+1', label: 'Canada (+1)' },
        { value: '+52', label: 'Mexico (+52)' }
    ];

    // Currency options
    const currencyOptions = [
        { value: 'USD', label: 'USD - US Dollar' },
        { value: 'EUR', label: 'EUR - Euro' },
        { value: 'GBP', label: 'GBP - British Pound' },
        { value: 'JPY', label: 'JPY - Japanese Yen' },
        { value: 'AUD', label: 'AUD - Australian Dollar' },
        { value: 'CAD', label: 'CAD - Canadian Dollar' },
        { value: 'CHF', label: 'CHF - Swiss Franc' },
        { value: 'CNY', label: 'CNY - Chinese Yuan' },
        { value: 'INR', label: 'INR - Indian Rupee' },
        { value: 'BRL', label: 'BRL - Brazilian Real' }
    ];

    // Day options
    const dayOptions = [
        { value: 'sunday', label: __('Sunday', 'quillbooking') },
        { value: 'monday', label: __('Monday', 'quillbooking') },
        { value: 'tuesday', label: __('Tuesday', 'quillbooking') },
        { value: 'wednesday', label: __('Wednesday', 'quillbooking') },
        { value: 'thursday', label: __('Thursday', 'quillbooking') },
        { value: 'friday', label: __('Friday', 'quillbooking') },
        { value: 'saturday', label: __('Saturday', 'quillbooking') }
    ];

    // Frequency options
    const frequencyOptions = [
        { value: 'daily', label: __('Daily', 'quillbooking') },
        { value: 'weekly', label: __('Weekly', 'quillbooking') },
        { value: 'monthly', label: __('Monthly', 'quillbooking') }
    ];

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            className="quillbooking-general-settings"
            initialValues={settings || {}}
        >
            <Card className="settings-card mb-6 rounded-lg" loading={loading}>
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                    <div className='bg-[#EDEDED] rounded-lg p-2'>
                        <SettingsIcon />
                    </div>
                    <Header
                        header={__('General Settings', 'quillbooking')}
                        subHeader={__(
                            'Manage your settings related emails, notifications and other general settings',
                            'quillbooking'
                        )}
                    />
                </Flex>

                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <Form.Item
                            name={['general', 'admin_email']}
                            label={__('Admin Email', 'quillbooking')}
                            rules={[
                                { type: 'email', message: __('Please enter a valid email', 'quillbooking') }
                            ]}
                        >
                            <Input placeholder={__('Enter admin email', 'quillbooking')} size="large" />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={['general', 'start_from']}
                            label={__('Calendar Start From', 'quillbooking')}
                        >
                            <Select size="large" placeholder={__('Select start day', 'quillbooking')} options={dayOptions} />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={['general', 'time_format']}
                            label={__('Time Format', 'quillbooking')}
                        >
                            <Radio.Group size="large">
                                <Radio value="12">{__('12-hour', 'quillbooking')}</Radio>
                                <Radio value="24">{__('24-hour', 'quillbooking')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={['general', 'auto_cancel_after']}
                            label={__('Automatically Cancel Booking', 'quillbooking')}
                        >
                            <Select size="large" placeholder={__('Select time', 'quillbooking')} options={getTimeOptions()} />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={['general', 'auto_complete_after']}
                            label={__('Automatically Complete Booking', 'quillbooking')}
                        >
                            <Select size="large" placeholder={__('Select time', 'quillbooking')} options={getTimeOptions()} />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name={['general', 'default_country_code']}
                            label={__('Default Country Code', 'quillbooking')}
                        >
                            <Select
                                showSearch
                                size="large"
                                placeholder={__('Select country code', 'quillbooking')}
                                optionFilterProp="children"
                                filterOption={(input, option) => {
                                    if (!option?.label) return false;
                                    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                }}
                                options={countryOptions}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name={['general', 'enable_summary_email']}
                            valuePropName="checked"
                        >
                            <Checkbox
                                onChange={(e) => setSummaryEnabled(e.target.checked)}
                            >
                                {__('Enable Summary Email', 'quillbooking')}
                            </Checkbox>
                        </Form.Item>

                        {summaryEnabled && (
                            <Form.Item
                                name={['general', 'summary_email_frequency']}
                                label={__('Summary Email Frequency', 'quillbooking')}
                                rules={[{ required: summaryEnabled, message: __('Please select frequency', 'quillbooking') }]}
                            >
                                <Select size="large" placeholder={__('Select frequency', 'quillbooking')} options={frequencyOptions} />
                            </Form.Item>
                        )}
                    </Col>
                </Row>
            </Card>

            <Card className="settings-card mb-6 rounded-lg" loading={loading}>
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                    <div className='bg-[#EDEDED] rounded-lg p-2'>
                        <DollarOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <Header
                        header={__('Payment Settings', 'quillbooking')}
                        subHeader={__(
                            'Configure your global payment settings for booking related payments',
                            'quillbooking'
                        )}
                    />
                </Flex>

                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <Form.Item
                            name={['payments', 'currency']}
                            label={__('Currency', 'quillbooking')}
                        >
                            <Select
                                size="large"
                                placeholder={__('Select currency', 'quillbooking')}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) => {
                                    if (!option?.label) return false;
                                    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                }}
                                options={currencyOptions}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card className="settings-card rounded-lg" loading={loading}>
                <Flex gap={10} className='items-center border-b pb-4 mb-4'>
                    <div className='bg-[#EDEDED] rounded-lg p-2'>
                        <MailOutlined style={{ fontSize: '20px' }} />
                    </div>
                    <Header
                        header={__('Email Settings', 'quillbooking')}
                        subHeader={__(
                            'Configure your email settings for booking related emails',
                            'quillbooking'
                        )}
                    />
                </Flex>

                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Form.Item
                            name={['email', 'from_name']}
                            label={__('From Name', 'quillbooking')}
                        >
                            <Input size="large" placeholder={__('Enter from name', 'quillbooking')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={['email', 'from_email']}
                            label={__('From Email', 'quillbooking')}
                            rules={[
                                { type: 'email', message: __('Please enter a valid email', 'quillbooking') }
                            ]}
                        >
                            <Input size="large" placeholder={__('Enter from email', 'quillbooking')} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name={['email', 'reply_to_name']}
                            label={__('Reply To Name', 'quillbooking')}
                            rules={[{ message: __('Please enter reply to name', 'quillbooking') }]}
                        >
                            <Input size="large" placeholder={__('Enter reply to name', 'quillbooking')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name={['email', 'reply_to_email']}
                            label={__('Reply To Email', 'quillbooking')}
                            rules={[
                                { type: 'email', message: __('Please enter a valid email', 'quillbooking') }
                            ]}
                        >
                            <Input size="large" placeholder={__('Enter reply to email', 'quillbooking')} />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name={['email', 'use_host_from_name']}
                            valuePropName="checked"
                        >
                            <Checkbox>
                                {__('Use host name as From Name for booking emails to guests', 'quillbooking')}
                            </Checkbox>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name={['email', 'use_host_reply_to_email']}
                            valuePropName="checked"
                        >
                            <Checkbox>
                                {__('Use host email for reply-to value for booking emails to guests', 'quillbooking')}
                            </Checkbox>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name={['email', 'include_ics']}
                            valuePropName="checked"
                        >
                            <Checkbox>
                                {__('Include ICS file attachment in booking confirmation emails', 'quillbooking')}
                            </Checkbox>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name={['email', 'footer']}
                            label={__('Email Footer for Booking related emails (Optional)', 'quillbooking')}
                        >
                            <TextArea
                                rows={6}
                                placeholder={__('Enter email footer content...', 'quillbooking')}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={saveLoading}
                    size="large"
                    className="mt-6 bg-color-primary"
                >
                    {__('Save Settings', 'quillbooking')}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default GeneralSettings;