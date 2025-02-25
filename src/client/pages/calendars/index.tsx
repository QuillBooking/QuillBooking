/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Card, Flex, Button, Typography, Avatar, Popover, Skeleton, Input, Select, Popconfirm } from 'antd';
import { SettingOutlined, UserOutlined, CopyOutlined, LinkOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { map, filter } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CalendarResponse, Calendar } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import CalendarEvents from './calendar-events';
import AddCalendarModal from './add-calendar-modal';
import CloneEventModal from './clone-event-modal';
import { useApi, useNotice, useCopyToClipboard, useNavigate } from '@quillbooking/hooks';

/**
 * Main Calendars Component.
 */
const Calendars: React.FC = () => {
    const { callApi, loading } = useApi();
    const { callApi: deleteApi } = useApi();
    const [calendars, setCalendars] = useState<Calendar[] | null>(null);
    const [search, setSearch] = useState<string>('');
    const [filters, setFilters] = useState<{ [key: string]: string }>({});
    const [type, setType] = useState<string | null>(null);
    const [cloneCalendar, setCloneCalendar] = useState<Calendar | null>(null);
    const { errorNotice } = useNotice();
    const copyToClipboard = useCopyToClipboard();
    const navigate = useNavigate();
    const siteUrl = ConfigAPI.getSiteUrl();
    const typesLabels = {
        "one-to-one": __('One to One', 'quillbooking'),
        "group": __('Group', 'quillbooking'),
        "round-robin": __('Round Robin', 'quillbooking'),
    };

    const fetchCalendars = async () => {
        if (loading) return;

        callApi({
            path: addQueryArgs(`calendars`, {
                per_page: 99,
                keyword: search,
                filters,
            }),
            onSuccess: (response: CalendarResponse) => {
                setCalendars(response.data);
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };

    const deleteCalendar = async (calendar: Calendar) => {
        await deleteApi({
            path: `calendars/${calendar.id}`,
            method: 'DELETE',
            onSuccess: () => {
                const updatedCalendars = filter(calendars, (c) => c.id !== calendar.id);
                setCalendars(updatedCalendars);
            },
            onError: (error) => {
                errorNotice(error.message);
            },
        });
    };


    useEffect(() => {
        fetchCalendars();
    }, [search, filters]);

    const handleSaved = () => {
        fetchCalendars();
    };

    const onDeleteEvent = (id: number, calendarId: number) => {
        if (!calendars) return;
        const updatedCalendars = calendars.map((calendar) => {
            if (calendar.id === calendarId) {
                calendar.events = filter(calendar.events, (event) => event.id !== id);
            }
            return calendar;
        });

        setCalendars(updatedCalendars);
    };

    const onDuplicateEvent = (event, calendarId) => {
        if (!calendars) return;
        const updatedCalendars = calendars.map((calendar) => {
            if (calendar.id === calendarId) {
                calendar.events.push(event);
            }
            return calendar;
        });

        setCalendars(updatedCalendars);
    };

    const hostEventsTypes = {
        "one-to-one": __('One to One', 'quillbooking'),
        "group": __('Group', 'quillbooking'),
    };

    const teamEventsTypes = {
        "round-robin": __('Round Robin', 'quillbooking'),
    };

    return (
        <div className="quillbooking-calendars">
            <Card className='quillbooking-calendars-action'>
                <Flex justify="space-between">
                    <Flex gap={10}>
                        <Select
                            defaultValue={'all'}
                            placeholder={__('Filter by type', 'quillbooking')}
                            options={[
                                { label: __('All Calendars', 'quillbooking'), value: 'all' },
                                { label: __('Hosts', 'quillbooking'), value: 'host' },
                                { label: __('Teams', 'quillbooking'), value: 'team' },
                                { label: __('One Off', 'quillbooking'), value: 'one-off' },
                            ]}
                            onChange={(value) => setFilters({ ...filters, type: value })}
                            size='large'
                        />
                        <Input.Search
                            placeholder={__('Search Calendars', 'quillbooking')}
                            onSearch={(_value, _e, source) => {
                                if ('clear' === source?.source) {
                                    setSearch('');
                                    return;
                                }
                                setSearch(_value);
                            }}
                            size='large'
                            allowClear
                        />
                    </Flex>
                    <Popover
                        trigger={['click']}
                        content={(
                            <Flex vertical gap={10}>
                                <Button type="text" onClick={() => setType('host')}>
                                    {__('Add Host', 'quillbooking')}
                                </Button>
                                <Button type="text" onClick={() => setType('team')}>
                                    {__('Add Team', 'quillbooking')}
                                </Button>
                                <Button type="text" onClick={() => setType('one-off')}>
                                    {__('Add One Off', 'quillbooking')}
                                </Button>
                            </Flex>
                        )}
                    >
                        <Button type="primary" icon={<PlusOutlined />} size='large'>
                            {__('Add New', 'quillbooking')}
                        </Button>
                    </Popover>
                </Flex>
            </Card>
            {loading || !calendars ? <Skeleton active /> : (
                <Flex gap={20} vertical>
                    {calendars.map((calendar) => (
                        <Card key={calendar.id}>
                            <Flex vertical gap={20}>
                                <Flex justify="space-between" align="center">
                                    <Flex gap={10}>
                                        <Avatar size="large" icon={<UserOutlined />} />
                                        <Flex vertical gap={0}>
                                            <Typography.Title level={5} style={{ margin: 0 }}>{calendar.name}</Typography.Title>
                                            <Typography.Link href={`${siteUrl}?quillbooking_calendar=${calendar.slug}`} target="_blank">
                                                {`${siteUrl}?quillbooking_calendar=${calendar.slug}`}
                                            </Typography.Link>
                                        </Flex>
                                    </Flex>
                                    <Flex gap={10}>
                                        <Popover
                                            trigger={['click']}
                                            content={(
                                                <Flex vertical gap={10}>
                                                    {calendar.type === 'host' && (
                                                        <>
                                                            {map(hostEventsTypes, (label, type) => (
                                                                <Button
                                                                    type="text"
                                                                    key={type}
                                                                    onClick={() => {
                                                                        navigate(`calendars/${calendar.id}/create-event/${type}`);
                                                                    }}
                                                                >
                                                                    {label}
                                                                </Button>
                                                            ))}
                                                        </>
                                                    )}
                                                    {calendar.type === 'team' && (
                                                        <>
                                                            {map(teamEventsTypes, (label, type) => (
                                                                <Button
                                                                    type="text"
                                                                    key={type}
                                                                    onClick={() => {
                                                                        navigate(`calendars/${calendar.id}/create-event/${type}`);
                                                                    }}
                                                                >
                                                                    {label}
                                                                </Button>
                                                            ))}
                                                        </>
                                                    )}
                                                </Flex>
                                            )}
                                        >
                                            <Button icon={<PlusOutlined />}>{__('Add New Event', 'quillbooking')}</Button>
                                        </Popover>
                                        <Popover
                                            trigger={['click']}
                                            content={(
                                                <Flex vertical gap={10}>
                                                    <Button
                                                        type="text"
                                                        icon={<SettingOutlined />}
                                                        onClick={() => navigate(`calendars/${calendar.id}/general`)}
                                                    >
                                                        {__('Edit', 'quillbooking')}
                                                    </Button>
                                                    <Button
                                                        type="text"
                                                        icon={<CopyOutlined />}
                                                        onClick={() => setCloneCalendar(calendar)}
                                                    >{__('Clone Events', 'quillbooking')}
                                                    </Button>
                                                    <Button
                                                        type="text"
                                                        onClick={() => copyToClipboard(`${siteUrl}?quillbooking_calendar=${calendar.slug}`, __('Link copied', 'quillbooking'))}
                                                        icon={<LinkOutlined />}
                                                    >
                                                        {__('Copy Link', 'quillbooking')}
                                                    </Button>
                                                    <Popconfirm
                                                        title={__('Are you sure to delete this calendar?', 'quillbooking')}
                                                        onConfirm={() => deleteCalendar(calendar)}
                                                        okText={__('Yes', 'quillbooking')}
                                                        cancelText={__('No', 'quillbooking')}
                                                    >
                                                        <Button type="text" icon={<DeleteOutlined />}>{__('Delete', 'quillbooking')}</Button>
                                                    </Popconfirm>
                                                </Flex>
                                            )}
                                        >
                                            <Button icon={<SettingOutlined />} />
                                        </Popover>
                                    </Flex>
                                </Flex>
                                <CalendarEvents calendar={calendar} typesLabels={typesLabels} onDeleted={onDeleteEvent} onDuplicated={onDuplicateEvent} />
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}
            {type && (
                <AddCalendarModal
                    open={!!type}
                    type={type}
                    onClose={() => setType(null)}
                    excludedUsers={map(calendars, 'user_id')}
                    onSaved={handleSaved}
                />
            )}
            {cloneCalendar && (
                <CloneEventModal
                    open={!!cloneCalendar}
                    calendar={cloneCalendar}
                    onClose={() => setCloneCalendar(null)}
                    excludedEvents={map(cloneCalendar.events, 'id')}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default Calendars;
