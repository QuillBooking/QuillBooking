/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Tabs } from 'antd';
import { SettingOutlined, ApartmentOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Calendar as CalendarType } from '@quillbooking/client';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import { Provider } from './state/context';
import { GeneralSettings, Integrations } from './tabs';
import Event from '../event';

/**
 * Main Calendars Component.
 */
const Calendar: React.FC = () => {
    const { id, tab } = useParams<{ id: string; tab: string }>();
    if (tab?.match(/^\d+$/)) {
        return <Event />;
    }
    const { callApi } = useApi();
    const { errorNotice } = useNotice();
    const [calendar, setCalendar] = useState<CalendarType | null>(null);
    const navigate = useNavigate();
    const setBreadcrumbs = useBreadcrumbs();
    if (!id) {
        return null;
    }

    const fetchCalendar = async () => {
        callApi({
            path: `calendars/${id}`,
            method: 'GET',
            onSuccess(response) {
                setCalendar(response);
                setBreadcrumbs([
                    {
                        path: `calendars/${id}`,
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
        fetchCalendar();
    }, []);

    const tabs = [
        {
            key: 'general',
            label: __('General', 'quillbooking'),
            children: <GeneralSettings />,
            icon: <SettingOutlined />,
        },
        {
            key: 'integrations',
            label: __('Integrations', 'quillbooking'),
            children: <Integrations />,
            icon: <ApartmentOutlined />,
        }
    ];

    return (
        <Provider
            value={{
                state: calendar,
                actions: {
                    setCalendar
                }
            }}
        >
            <div className="quillbooking-calendar">
                <Tabs
                    defaultActiveKey={tab || 'general'}
                    activeKey={tab || 'general'}
                    items={tabs}
                    tabPosition="left"
                    tabBarStyle={{ width: 200 }}
                    onChange={(key) => {
                        navigate(`calendars/${id}/${key}`);
                    }}
                />
            </div>
        </Provider>
    );
};

export default Calendar;