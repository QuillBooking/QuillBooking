/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Tabs } from 'antd';
import { SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Event as EventType } from '@quillbooking/client';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import { Provider } from './state/context';
import Calendar from '../calendar';
import { EventDetails, Availability, Limits, Fields, Notifications } from './tabs';

const Event: React.FC = () => {
    const { id: calendarId, tab: id, subtab: tab } = useParams<{ id: string; tab: string; subtab: string }>();
    if (!id?.match(/^\d+$/)) {
        return <Calendar />;
    }

    const { callApi } = useApi();
    const { errorNotice } = useNotice();
    const [event, setEvent] = useState<EventType | null>(null);
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbs();
    if (!id) {
        return null;
    }

    const fetchEvent = async () => {
        callApi({
            path: `events/${id}`,
            method: 'GET',
            onSuccess(response: EventType) {
                setEvent(response);
                setBreadcrumbs([
                    {
                        path: `calendars/${calendarId}`,
                        title: response.calendar.name
                    },
                    {
                        path: `calendars/${calendarId}/${id}`,
                        title: response.name
                    }
                ]);
            },
            onError(error) {
                errorNotice(error.message);
            }
        });
    };

    useEffect(() => {
        fetchEvent();
    }, []);

    const tabs = [
        {
            key: 'details',
            label: __('Event Details', 'quillbooking'),
            children: <EventDetails />,
            icon: <SettingOutlined />
        },
        {
            key: 'availability',
            label: __('Availability', 'quillbooking'),
            children: <Availability />,
            icon: <ClockCircleOutlined />
        },
        {
            key: 'limits',
            label: __('Limits', 'quillbooking'),
            children: <Limits />,
            icon: <ClockCircleOutlined />
        },
        {
            key: 'fields',
            label: __('Fields', 'quillbooking'),
            children: <Fields />,
            icon: <ClockCircleOutlined />
        },
        {
            key: 'email-notifications',
            label: __('Email Notifications', 'quillbooking'),
            children: <Notifications notificationType='email' />,
            icon: <ClockCircleOutlined />
        },
        {
            key: 'sms-notifications',
            label: __('SMS Notifications', 'quillbooking'),
            children: <Notifications notificationType='sms' />,
            icon: <ClockCircleOutlined />
        }
    ];

    
    return (
        <Provider
            value={{
                state: event,
                actions: {
                    setEvent
                }
            }}
        >
            <div className="quillbooking-event">
                <Tabs
                    defaultActiveKey={tab || 'details'}
                    activeKey={tab || 'details'}
                    items={tabs}
                    tabPosition="left"
                    tabBarStyle={{ width: 200 }}
                    onChange={(key) => {
                        if (event) {
                            navigate(`calendars/${event.calendar.id}/${event.id}/${key}`);
                        }
                    }}
                />
            </div>
        </Provider>
    );
};

export default Event;