/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Button, Card, Typography, List, Flex, Modal, Popconfirm, Tooltip, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { filter, isEmpty, map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Integration } from '@quillbooking/config';
import { TextField } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';

const { Title, Text } = Typography;

interface Props {
    integration: Integration;
    calendarId: string;
    slug: string;
}

interface Account {
    id: string;
    name: string;
    config: any;
    calendars: any[];
}

const IntegrationDetailsPage: React.FC<Props> = ({ integration, calendarId, slug }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [visible, setVisible] = useState(false);
    const { callApi, loading } = useApi();
    const { callApi: connectApi, loading: connectLoading } = useApi();
    const { callApi: toggleCalendarApi, loading: toggleCalendarLoading } = useApi();
    const { callApi: deleteApi } = useApi();
    const { errorNotice, successNotice } = useNotice();
    const setBreadcrumbs = useBreadcrumbs();
    const navigate = useNavigate();

    useEffect(() => {
        setBreadcrumbs([
            {
                path: `calendars/${calendarId}/integrations/${slug}`,
                title: integration.name,
            },
        ]);

        fetchAccounts();
    }, []);

    const fetchAccounts = () => {
        callApi({
            path: `integrations/${slug}/${calendarId}/accounts`,
            method: 'GET',
            onSuccess(response) {
                const accounts = map(response, (account, id) => ({
                    ...account,
                    id,
                })) as Account[];
                setAccounts(accounts);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const handleDeleteAccount = async (accountId: string) => {
        await deleteApi({
            path: `integrations/${slug}/${calendarId}/accounts/${accountId}`,
            method: 'DELETE',
            onSuccess() {
                successNotice(__('Account deleted', 'quillbooking'));
                setAccounts((prev) => prev.filter((account) => account.id !== accountId));
            },
            onError() {
                errorNotice(__('Failed to delete account', 'quillbooking'));
            }
        })
    };

    const handleConnectOAuth = () => {
        connectApi({
            path: addQueryArgs(`integrations/${slug}/auth`, {
                host_id: calendarId,
            }),
            method: 'GET',
            onSuccess(response) {
                window.location.href = response.auth_uri;
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const handleConnectBasic = () => {
        if (!validate()) return;

        connectApi({
            path: `integrations/${slug}/${calendarId}/accounts`,
            method: 'POST',
            data: {
                app_credentials: formValues,
                config: []
            },
            onSuccess() {
                setVisible(false);
                fetchAccounts();
                successNotice(__('Account connected', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const validate = () => {
        const requiredFields = filter(Object.keys(integration.fields), (field) => integration.fields[field].required);

        for (const field of requiredFields) {
            if (!formValues[field]) {
                errorNotice(sprintf(__('Please enter a value for %s.', 'quillbooking'), __(integration.fields[field].label || field, 'quillbooking')));
                return false;
            }
        }

        return true;
    };

    const handleFieldChange = (fieldName: string, value: string) => {
        setFormValues((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const handleCalendarSelection = (accountId: string, calId: string, checked: boolean) => {
        const newAccounts = accounts.map((account) => {
            if (account.id === accountId) {
                return {
                    ...account,
                    config: {
                        ...account.config,
                        calendars: checked
                            ? [...account.config.calendars, calId]
                            : filter(account.config.calendars, (id) => id !== calId),
                    },
                };
            }

            return account;
        });

        toggleCalendarApi({
            path: `integrations/${slug}/${calendarId}/accounts/${accountId}`,
            method: 'PUT',
            data: {
                config: {
                    calendars: newAccounts.find((account) => account.id === accountId)?.config.calendars || [],
                },
            },
            onSuccess() {
                setAccounts(newAccounts);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const canAddAccount = () => (!integration.has_accounts && accounts.length === 0) || integration.has_accounts;

    return (
        <div className="integration-details-page">
            <Flex vertical gap={20} style={{ width: '100%' }}>
                <Flex>
                    <Button onClick={() => navigate(`calendars/${calendarId}/integrations`)}>{__('Back', 'quillbooking')}</Button>
                </Flex>
                <Flex vertical gap={10} style={{ alignItems: 'center' }}>
                    <div className="quillbooking-integration-icon">
                        <img src={integration.icon} alt={integration.name} width={40} />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>{integration.name}</Title>
                    <Text type="secondary">{integration.description}</Text>
                </Flex>
                <Card
                    title={integration.has_accounts ? __(
                        'My Calendar Accounts',
                        'quillbooking'
                    ) : __('My Account', 'quillbooking')}
                    extra={
                        <>
                            {canAddAccount() && (
                                <Button
                                    onClick={() =>
                                        integration.auth_type === 'oauth' ? handleConnectOAuth() : setVisible(true)
                                    }
                                    icon={<PlusOutlined />}
                                    loading={connectLoading}
                                >
                                    {!integration.has_accounts ? __('Connect Account', 'quillbooking') : integration.auth_type === 'oauth' ? __('Connect New Account', 'quillbooking') : __('Add New Account', 'quillbooking')}
                                </Button>
                            )}
                        </>
                    }
                >
                    <List
                        dataSource={accounts}
                        loading={loading}
                        renderItem={(account) => (
                            <List.Item
                                actions={[
                                    <Popconfirm
                                        title={__('Are you sure you want to delete this account?', 'quillbooking')}
                                        onConfirm={() => handleDeleteAccount(account.id)}
                                        okText={__('Yes', 'quillbooking')}
                                        cancelText={__('No', 'quillbooking')}
                                    >
                                        <Tooltip title={__('Delete Account', 'quillbooking')}>
                                            <Button danger icon={<DeleteOutlined />} />
                                        </Tooltip>
                                    </Popconfirm>,
                                ]}
                            >
                                <Flex vertical gap={10} style={{ width: '100%' }}>
                                    <Text strong>{account.name}</Text>
                                    {integration.is_calendar && (
                                        <>
                                            <Text type="secondary">{__('Enable the calendars you want to check for conflicts to prevent double bookings.', 'quillbooking')}</Text>
                                            {!isEmpty(account.calendars) ? (
                                                <List
                                                    loading={toggleCalendarLoading}
                                                    dataSource={account.calendars}
                                                    renderItem={(calendar) => (
                                                        <Checkbox
                                                            checked={!isEmpty(account.config) ? account.config.calendars.includes(calendar.id) : false}
                                                            onChange={(e) =>
                                                                handleCalendarSelection(account.id, calendar.id, e.target.checked)
                                                            }
                                                        >
                                                            {calendar.name}
                                                        </Checkbox>
                                                    )}
                                                />
                                            ) : __('No calendars found.', 'quillbooking')}
                                        </>
                                    )}
                                </Flex>
                            </List.Item>
                        )}
                    />
                </Card>
                <Modal
                    open={visible}
                    onCancel={() => setVisible(false)}
                    title={__('Add Account', 'quillbooking')}
                    footer={null}
                >
                    <Flex vertical gap={20}>
                        <Flex vertical gap={20}>
                            {map(integration.fields, (field, fieldKey) => (
                                <TextField
                                    key={fieldKey}
                                    label={__(field.label || fieldKey, 'quillbooking')}
                                    description={__(field.description || '', 'quillbooking')}
                                    type={field.type || 'text'}
                                    value={formValues[fieldKey] || ''}
                                    onChange={(value) => handleFieldChange(fieldKey, value)}
                                    required={field.required}
                                    placeholder={field.placeholder || ''}
                                />
                            ))}
                        </Flex>
                        <Button
                            type="primary"
                            onClick={handleConnectBasic}
                            loading={connectLoading}
                            style={{ marginTop: '10px' }}
                        >
                            {connectLoading ? __('Connecting...', 'quillbooking') : __('Connect Account', 'quillbooking')}
                        </Button>
                    </Flex>
                </Modal>
            </Flex>
        </div>
    );
};

export default IntegrationDetailsPage;
