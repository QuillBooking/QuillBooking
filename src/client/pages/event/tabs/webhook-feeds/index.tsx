/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Button, Typography, List, Skeleton, Flex, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import WebhookFeedModal from './webhook-feed-modal';
// import './style.scss';

const { Title } = Typography;

export type WebhookFeedType = {
    name: string;
    url: string;
    method: string;
    format: string;
    hasHeaders: boolean;
    headers: { header: string; value: string }[];
    hasBodyFields: boolean;
    bodyFields: { field: string; value: string }[];
    triggers: string[];
    enabled: boolean;
};

const WebhookFeedsTab: React.FC = () => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { callApi: saveApi, loading: saveLoading } = useApi();
    const { callApi: deleteApi } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [webhookFeeds, setWebhookFeeds] = useState<WebhookFeedType[] | null>(null);
    const [editingWebhookFeed, setEditingWebhookFeed] = useState<WebhookFeedType | null>(null);
    const [isAddWebhookFeedModalVisible, setIsAddWebhookFeedModalVisible] = useState(false);

    useEffect(() => {
        if (event) {
            fetchWebhookFeeds();
        }
    }, [event]);

    const fetchWebhookFeeds = () => {
        if (!event) return;
        callApi({
            path: `events/${event.id}/meta/webhook_feeds`,
            method: 'GET',
            onSuccess(response: WebhookFeedType[]) {
                setWebhookFeeds(response);
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const handleSave = (values: WebhookFeedType) => {
        const updatedWebhookFeeds = editingWebhookFeed
            ? webhookFeeds?.map((feed) =>
                feed.name === editingWebhookFeed.name ? { ...feed, ...values } : feed
            )
            : [...(webhookFeeds || []), values];
        
        if (!updatedWebhookFeeds) return;

        setWebhookFeeds(updatedWebhookFeeds);
        saveWebhookFeeds(updatedWebhookFeeds);
        setIsAddWebhookFeedModalVisible(false);
        setEditingWebhookFeed(null);
    };

    const saveWebhookFeeds = (feeds: WebhookFeedType[]) => {
        if (!event) return;
        saveApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                webhookFeeds: feeds,
            },
            onSuccess() {
                successNotice(__('Webhook Feeds saved successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    const removeWebhookFeed = async (name: string) => {
        if (!event || !webhookFeeds) return;

        const updatedWebhookFeeds = webhookFeeds.filter((feed) => feed.name !== name);

        await deleteApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                webhookFeeds: updatedWebhookFeeds,
            },
            onSuccess() {
                setWebhookFeeds(updatedWebhookFeeds);
                successNotice(__('Webhook Feed deleted successfully', 'quillbooking'));
            },
            onError(error) {
                errorNotice(error.message);
            },
        });
    };

    if (loading || !webhookFeeds) {
        return <Skeleton active />;
    }

    return (
        <div className="webhook-feeds-tab">
            <Title level={4}>{__('Webhook Feeds', 'quillbooking')}</Title>
            <Card>
                <List
                    bordered
                    dataSource={webhookFeeds}
                    renderItem={(feed) => (
                        <List.Item
                            style={{
                                color: feed.enabled ? 'inherit' : '#888',
                            }}
                        >
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Typography.Title level={5} style={{ margin: 0 }}>
                                    {feed.name}
                                </Typography.Title>
                                <div className="quillbooking-webhook-feed-badge">
                                    {feed.enabled ? __('Enabled', 'quillbooking') : __('Disabled', 'quillbooking')}
                                </div>
                            </div>
                            <Flex gap={5} className="webhook-feed-actions" align="center">
                                <Button
                                    onClick={() => {
                                        setEditingWebhookFeed(feed);
                                        setIsAddWebhookFeedModalVisible(true);
                                    }}
                                >
                                    {__('Edit', 'quillbooking')}
                                </Button>
                                <Popconfirm
                                    title={__('Are you sure to delete this webhook feed?', 'quillbooking')}
                                    onConfirm={() => removeWebhookFeed(feed.name)}
                                    okText={__('Yes', 'quillbooking')}
                                    cancelText={__('No', 'quillbooking')}
                                >
                                    <Button danger>{__('Delete', 'quillbooking')}</Button>
                                </Popconfirm>
                            </Flex>
                        </List.Item>
                    )}
                />
                <Flex justify="space-between" style={{ marginTop: 16 }}>
                    <Button
                        type="dashed"
                        onClick={() => {
                            setIsAddWebhookFeedModalVisible(true);
                            setEditingWebhookFeed(null);
                        }}
                        icon={<PlusOutlined />}
                    >
                        {__('Add Webhook Feed', 'quillbooking')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => saveWebhookFeeds(webhookFeeds)}
                        loading={saveLoading}
                    >
                        {__('Save', 'quillbooking')}
                    </Button>
                </Flex>
            </Card>
            <WebhookFeedModal
                visible={isAddWebhookFeedModalVisible}
                onCancel={() => setIsAddWebhookFeedModalVisible(false)}
                onSave={handleSave}
                webhookFeed={editingWebhookFeed}
            />
        </div>
    );
};

export default WebhookFeedsTab;