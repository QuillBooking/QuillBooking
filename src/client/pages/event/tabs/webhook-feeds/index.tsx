/**
 * WordPress dependencies
 */
import { useState, useEffect, forwardRef, useImperativeHandle } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Button, Typography, Skeleton, Flex, Popconfirm, Switch, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import WebhookFeedComponent from './webhook-feed-modal';
import { AddWebhookIcon, CardHeader, EditIcon, NoWebhookIcon, TrashIcon, VerifyIcon, WebhookListIcon } from '@quillbooking/components';

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

interface EventWebhookProps {
    disabled: boolean;
    setDisabled: (disabled: boolean) => void;
}

interface EventWebhookHandle {
    saveSettings: () => Promise<void>;
}

const WebhookFeedsTab = forwardRef<EventWebhookHandle, EventWebhookProps>((props, ref) => {
    const { state: event } = useEventContext();
    const { callApi, loading } = useApi();
    const { callApi: saveApi, loading: saveLoading } = useApi();
    const { callApi: deleteApi } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const [webhookFeeds, setWebhookFeeds] = useState<WebhookFeedType[] | null>(null);
    const [editingWebhookFeed, setEditingWebhookFeed] = useState<WebhookFeedType | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    // Expose saveSettings method to parent component
    useImperativeHandle(ref, () => ({
        saveSettings: async () => {
            if (webhookFeeds) {
                return saveWebhookFeeds(webhookFeeds);
            }
        },
    }));

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

    console.log(webhookFeeds)

    const handleSave = (values: WebhookFeedType) => {
        const updatedWebhookFeeds = editingWebhookFeed
            ? webhookFeeds?.map((feed) =>
                feed.name === editingWebhookFeed.name ? { ...feed, ...values } : feed
            )
            : [...(webhookFeeds || []), values];

        if (!updatedWebhookFeeds) return;

        setWebhookFeeds(updatedWebhookFeeds);
        props.setDisabled(false); // Enable the Save Changes button
        setEditingWebhookFeed(null);
        setShowEditor(false);
    };

    const saveWebhookFeeds = (feeds: WebhookFeedType[]) => {
        if (!event) return;

        return saveApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                webhook_feeds: feeds,
            },
            onSuccess() {
                successNotice(__('Webhook Feeds saved successfully', 'quillbooking'));
                props.setDisabled(true);
            },
            onError(error) {
                errorNotice(error.message);
                throw error;
            },
        });
    };



    const toggleWebhookStatus = async (feed: WebhookFeedType) => {
        if (!event || !webhookFeeds) return;

        const updatedFeed = { ...feed, enabled: !feed.enabled };
        const updatedWebhookFeeds = webhookFeeds.map(f =>
            f.name === feed.name ? updatedFeed : f
        );

        setWebhookFeeds(updatedWebhookFeeds);

        await saveApi({
            path: `events/${event.id}`,
            method: 'POST',
            data: {
                webhookFeeds: updatedWebhookFeeds,
            },
            onSuccess() {
                successNotice(
                    updatedFeed.enabled
                        ? __('Webhook enabled successfully', 'quillbooking')
                        : __('Webhook disabled successfully', 'quillbooking')
                );
            },
            onError(error) {
                errorNotice(error.message);
                setWebhookFeeds(webhookFeeds);
            },
        });
        props.setDisabled(false);
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
        props.setDisabled(false)
    };

    const handleAddNew = () => {
        setEditingWebhookFeed(null);
        setShowEditor(true);
    };

    const handleEditClick = (feed: WebhookFeedType) => {
        setEditingWebhookFeed(feed);
        setShowEditor(true);
    };

    if (loading || !webhookFeeds) {
        return <Skeleton active />;
    }

    return (
        <Flex gap={20} className="webhook-feeds-tab w-full px-9">
            <Card className='w-full'>
                <Flex justify='space-between' align='center' className='border-b'>
                    <CardHeader
                        title={__('Webhooks Feeds', 'quillbooking')}
                        description={__('Manage your webhook integrations', 'quillbooking')}
                        icon={<WebhookListIcon />}
                        border={false}
                    />
                    {webhookFeeds.length > 0 && (
                    <Button
                        onClick={handleAddNew}
                        icon={<PlusOutlined />}
                        className='bg-color-primary text-white border-none shadow-none mb-4'
                    >
                        {__('Add Webhook', 'quillbooking')}
                    </Button>
                )}
                </Flex>

                <Flex vertical gap={30} className="w-full mt-6">
                    {webhookFeeds.map((feed) => (
                        <Card
                            key={feed.name}
                            className={`webhook-feed-card ${feed.enabled ? '' : 'webhook-feed-disabled'}`}
                        >
                            <Flex vertical gap={30}>
                                <Flex justify='space-between' align='center'>
                                    <Flex vertical gap={2}>
                                        <div className="text-[#09090B] font-medium text-[24px]">
                                            {feed.name}
                                        </div>
                                        <div className="text-[#71717A] font-normal text-[18px]">
                                            {feed.url}
                                        </div>
                                    </Flex>
                                    <Flex gap={25} align='center'>
                                        <Switch
                                            key="switch"
                                            checked={feed.enabled}
                                            onChange={() => toggleWebhookStatus(feed)}
                                            className='custom-check'
                                        />
                                        <Button
                                            key="edit"
                                            onClick={() => handleEditClick(feed)}
                                            className='border border-[#EDEBEB] rounded-md shadow-none p-3'
                                        >
                                            <EditIcon />
                                        </Button>

                                        <Button 
                                        onClick={() => removeWebhookFeed(feed.name)} 
                                        className='border border-[#EDEBEB] rounded-md shadow-none p-3 text-[#B3261E]'>
                                            <TrashIcon width={20} height={20} />
                                        </Button>
                                    </Flex>
                                </Flex>

                                <Flex gap={15} wrap>
                                    {feed.triggers.map(trigger => (
                                        <Flex gap={5} align='center' key={trigger} className="trigger-tag text-[#232323] text-[12px] font-semibold bg-[#EEE7F4] py-1 px-4 rounded-full">
                                            <div>
                                                <VerifyIcon />
                                            </div>
                                            <div>
                                                {trigger}
                                            </div>
                                        </Flex>
                                    ))}
                                </Flex>
                            </Flex>
                        </Card>
                    ))}

                    {webhookFeeds.length === 0 && (
                        <Card className='py-12'>
                            <Flex align='center' justify='center' vertical gap={20} className='text-[#71717A]'>
                              <div className='bg-color-secondary text-color-primary rounded-xl p-4 cursor-pointer' onClick={handleAddNew}>
                                <AddWebhookIcon/>
                              </div>
                              <div className='text-[22px] text-[#777777] text-center font-medium px-28'>
                                {__("You don't have any feeds configured. Let's go Create one From here! ",'quillbooking')}
                              </div>
                               <NoWebhookIcon/>
                            </Flex>
                        </Card>
                    )}
                </Flex>
            </Card>
            {showEditor&&(

            <Card>
                <CardHeader
                    title={editingWebhookFeed ? `Edit ${editingWebhookFeed.name}` : __('Add Webhook Feed', 'quillbooking')}
                    description={__('Configure your webhook settings', 'quillbooking')}
                    icon={<WebhookListIcon />}
                />
                <WebhookFeedComponent
                    onSave={handleSave}
                    webhookFeed={editingWebhookFeed}
                />
            </Card>
            )}
        </Flex>
    );
});

export default WebhookFeedsTab;