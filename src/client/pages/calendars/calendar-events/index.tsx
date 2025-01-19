/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button, Typography, Popover, Empty, Tooltip, Avatar, Popconfirm } from 'antd';
import { SettingOutlined, CopyOutlined, LinkOutlined, DeleteOutlined, ShareAltOutlined, UserOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import type { Calendar } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import { useCopyToClipboard, useApi, useNotice, useNavigate } from '@quillbooking/hooks';

/**
 * Calendar Events Component.
 */
const CalendarEvents: React.FC<{ calendar: Calendar; typesLabels: Record<string, string>; onDeleted: (id: number, calendarId: number) => void; onDuplicated: (event: Record<string, any>, calendarId: number) => void }> = ({ calendar, typesLabels, onDeleted, onDuplicated }) => {
    const siteUrl = ConfigAPI.getSiteUrl();
    const copyToClipboard = useCopyToClipboard();
    const { callApi: deleteApi } = useApi();
    const { callApi: duplicateApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const navigate = useNavigate();

    const handleDelete = async (event: number) => {
        await deleteApi({
            path: `events/${event}`,
            method: 'DELETE',
            onSuccess: () => {
                onDeleted(event, calendar.id);
                successNotice(__('Event deleted successfully', 'quillbooking'));
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };

    const handleDuplicate = (event: Record<string, any>) => {
        duplicateApi({
            path: `events/${event.id}/duplicate`,
            method: 'POST',
            onSuccess: () => {
                onDuplicated(event, calendar.id);
                successNotice(__('Event duplicated successfully', 'quillbooking'));
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };

    return (
        <>
            {calendar.events.length > 0 ? (
                <div className="quillbooking-calendar-events">
                    {calendar.events.map((event) => (
                        <Card
                            key={event.id}
                            className="quillbooking-calendar-event"
                            actions={[
                                <Button
                                    icon={<CopyOutlined />}
                                    type="link"
                                    onClick={() => copyToClipboard(`${siteUrl}?quillbooking_event=${event.slug}`, __('Link copied', 'quillbooking'))}
                                >
                                    {__('Copy Link', 'quillbooking')}
                                </Button>,
                                <Button
                                    icon={<ShareAltOutlined />}
                                    style={{ borderRadius: 20 }}
                                >
                                    {__('Share', 'quillbooking')}
                                </Button>,
                            ]}
                            onClick={() => navigate(`calendars/:calendarId/:eventId`, { calendarId: calendar.id, eventId: event.id })}
                        >
                            <Flex gap={20} vertical>
                                <Flex justify="space-between">
                                    <Flex vertical gap={0}>
                                        <Typography.Title level={5} style={{ margin: 0 }}>{event.name}</Typography.Title>
                                        <Typography.Text type="secondary">
                                            {event.duration} {__('Mins', 'quillbooking')}, {typesLabels[event.type]}
                                        </Typography.Text>
                                    </Flex>
                                    <Popover
                                        trigger={['click']}
                                        content={(
                                            <Flex vertical gap={10}>
                                                <Button type="text" icon={<CopyOutlined />}>{__('Clone', 'quillbooking')}</Button>
                                                <Button
                                                    type="text"
                                                    icon={<LinkOutlined />}
                                                    loading={loading}
                                                    onClick={() => handleDuplicate(event)}
                                                >
                                                    {__('Copy Link', 'quillbooking')}
                                                </Button>
                                                <Popconfirm
                                                    title={__('Are you sure to delete this event?', 'quillbooking')}
                                                    onConfirm={() => handleDelete(event.id)}
                                                    okText={__('Yes', 'quillbooking')}
                                                    cancelText={__('No', 'quillbooking')}
                                                >
                                                    <Button
                                                        type="text"
                                                        icon={<DeleteOutlined />

                                                        }>
                                                        {__('Delete', 'quillbooking')}
                                                    </Button>
                                                </Popconfirm>
                                            </Flex>
                                        )}
                                    >
                                        <Button icon={<SettingOutlined />} />
                                    </Popover>
                                </Flex>
                                <Tooltip title={calendar.name}>
                                    <Avatar icon={<UserOutlined />} />
                                </Tooltip>
                                <Typography.Link href={`${siteUrl}?quillbooking_event=${event.slug}`} target='_blank'>
                                    {__('View Booking Page', 'quillbooking')}
                                </Typography.Link>
                            </Flex>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="quillbooking-calendar-no-events">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={__('No events found', 'quillbooking')} />
                </div>
            )}
        </>
    );
};

export default CalendarEvents;
