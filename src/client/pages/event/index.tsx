/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Tabs } from 'antd';
import { SettingOutlined, CloudSyncOutlined as IntegrationIcon } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Event as EventType } from '@quillbooking/client';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import { Provider } from './state/context';


const Event: React.FC = () => {
    const { eventId: id, calendarId, tab } = useParams<{ eventId: string; calendarId; tab: string }>();
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
            key: 'general',
            label: __('General', 'quillbooking'),
            children: <></>,
            icon: <SettingOutlined />,
        },
        {
            key: 'integrations',
            label: __('Integrations', 'quillbooking'),
            children: <></>,
            icon: <IntegrationIcon />,
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
                    defaultActiveKey={tab || 'general'}
                    activeKey={tab || 'general'}
                    items={tabs}
                    tabPosition="left"
                    tabBarStyle={{ width: 200 }}
                    onChange={(key) => {
                        if (event) {
                            navigate(`events/${id}/${key}`);
                        }
                    }}
                />
            </div>
        </Provider>
    );
};

export default Event;