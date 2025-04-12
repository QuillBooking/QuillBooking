/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Flex, Tabs } from 'antd';
import { SettingOutlined, TeamOutlined, ApiOutlined, DollarOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useParams } from '@quillbooking/navigation';
import { useBreadcrumbs, useNavigate, useCurrentUser, useNotice } from '@quillbooking/hooks';
import { GeneralSettingsTab, TeamTab, IntegrationsTab, PaymentsTab } from './tabs';

/**
 * GlobalSettings component
 * Parent component for all settings tabs
 */
const GlobalSettings: React.FC = () => {
    const { tab = 'general' } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbs();
    const { isAdmin } = useCurrentUser();
    const { errorNotice } = useNotice();

    // Set breadcrumbs for this page
    useEffect(() => {
        if (!isAdmin()) {
            errorNotice(__('You do not have permission to access this page', 'quillbooking'));
            navigate('calendars');
            return;
        }

        setBreadcrumbs([
            {
                path: 'settings',
                title: __('Settings', 'quillbooking')
            },
            {
                path: `settings/${tab}`,
                title: getTabTitle(tab)
            }
        ]);
    }, []);

    if (!isAdmin()) {
        return null;
    }

    // Get title based on tab key
    function getTabTitle(tabKey: string): string {
        switch (tabKey) {
            case 'general':
                return __('General Settings', 'quillbooking');
            case 'team':
                return __('Team Members', 'quillbooking');
            case 'integrations':
                return __('Integrations', 'quillbooking');
            case 'payments':
                return __('Payment Gateways', 'quillbooking');
            default:
                return __('Settings', 'quillbooking');
        }
    }

    // Handle tab change
    const handleTabChange = (key: string) => {
        navigate(`settings/${key}`);
    };

    // Define tabs
    const items = [
        {
            key: 'general',
            label: (
                <Flex align="center" gap={8}>
                    <SettingOutlined />
                    <span>{__('General', 'quillbooking')}</span>
                </Flex>
            ),
            children: <GeneralSettingsTab />
        },
        {
            key: 'payments',
            label: (
                <Flex align="center" gap={8}>
                    <DollarOutlined />
                    <span>{__('Payments', 'quillbooking')}</span>
                </Flex>
            ),
            children: <PaymentsTab />
        },
        {
            key: 'team',
            label: (
                <Flex align="center" gap={8}>
                    <TeamOutlined />
                    <span>{__('Team', 'quillbooking')}</span>
                </Flex>
            ),
            children: <TeamTab />
        },
        {
            key: 'integrations',
            label: (
                <Flex align="center" gap={8}>
                    <ApiOutlined />
                    <span>{__('Integrations', 'quillbooking')}</span>
                </Flex>
            ),
            children: <IntegrationsTab />
        }
    ];

    return (
        <div className="quillbooking-global-settings">
            <div className="settings-container">
                <Tabs
                    activeKey={tab}
                    defaultActiveKey="general"
                    items={items}
                    onChange={handleTabChange}
                    type="card"
                    className="settings-tabs"
                    tabPosition="left"
                    tabBarStyle={{
                        width: '240px',
                        background: '#f9f9f9',
                        padding: '20px 0',
                        borderRight: '1px solid #eee'
                    }}
                />
            </div>
        </div>
    );
};

export default GlobalSettings;