/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex } from 'antd';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import GeneralSettingsCard from './general-settings-card';
import PaymentSettings from './payment-settings';
import EmailingSettings from './emailing-settings';
import ThemeSettings from './theme-settings';

/**
 * General Settings Component
 */
const GeneralSettings = () => {
    const { callApi } = useApi();
    const { callApi: saveApi, loading: saveLoading } = useApi();
    const { successNotice, errorNotice } = useNotice();

    // Unified state for all settings
    const [settings, setSettings] = useState({
        general: {
            admin_email: '',
            start_from: 'monday',
            time_format: '',
            auto_cancel_after: 60, // 1 hour default
            auto_complete_after: 120, // 2 hours default
            default_country_code: '+1',
            enable_summary_email: false,
            summary_email_frequency: 'daily'
        },
        payments: {
            currency: 'USD',
        },
        email: {
            from_name: '',
            from_email: '',
            reply_to_name: '',
            reply_to_email: '',
            use_host_from_name: false,
            use_host_reply_to_email: false,
            include_ics: true,
            footer: ''
        },
        theme: {
            color_scheme: 'system',
        },
    });

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
            },
            onError(error) {
                errorNotice(error.message || __('Failed to fetch settings', 'quillbooking'));
            },
        });
    };

    const handleSave = () => {
        saveApi({
            path: 'settings',
            method: 'POST',
            data: settings,
            onSuccess() {
                successNotice(__('Settings saved successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message || __('Failed to save settings', 'quillbooking'));
            },
        });
    };

    // Function to update settings state
    const updateSettings = (section, field, value) => {
        setSettings(prevState => ({
            ...prevState,
            [section]: {
                ...prevState[section],
                [field]: value
            }
        }));
    };

    console.log(settings);

    return (
        <Flex vertical gap={20}>
            <div className='grid grid-cols-2 gap-5'>
                <Flex gap={20} vertical>
                    <GeneralSettingsCard
                        settings={settings.general}
                        updateSettings={(field, value) => updateSettings('general', field, value)}
                    />
                    <PaymentSettings
                        settings={settings.payments}
                        updateSettings={(field, value) => updateSettings('payments', field, value)}
                    />
                </Flex>
                <Flex gap={20} vertical>
                    <EmailingSettings
                        settings={settings.email}
                        updateSettings={(field, value) => updateSettings('email', field, value)}
                    />
                    <ThemeSettings
                        settings={settings.theme}
                        updateSettings={(field, value) => updateSettings('theme', field, value)}
                    />
                </Flex>
            </div>
            <Flex justify='flex-end'>
                <Button
                type='primary'
                    onClick={handleSave}
                    disabled={saveLoading}
                    className={`rounded-lg font-medium px-10 text-white ${saveLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-color-primary '
                        }`}
                >
                    {saveLoading ? __('Saving...', 'quillbooking') : __('Save', 'quillbooking')}
                </Button>
            </Flex>
        </Flex>
    );
};

export default GeneralSettings;