/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Switch, Typography } from 'antd';
import { SettingOutlined, ClockCircleOutlined, BorderBottomOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Event as EventType } from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import { AvailabilityIcon, CalendarsIcon, EmailNotiIcon, IntegrationsIcon, PaymentSettingsIcon, QuestionIcon, SettingsIcon, ShareIcon, SmsNotiIcon, TrashRedIcon, WebhookIcon } from "@quillbooking/components";
import { Provider } from './state/context';
import Calendar from '../calendar';
import { EventDetails, Availability, Limits, Fields, Notifications, AdvancedSettings, Payments } from './tabs';
import { Box, Dialog, DialogActions, DialogTitle, Tab, Tabs } from '@mui/material';
import { IoCloseSharp } from 'react-icons/io5';
import ShareModal from '../calendars/share-modal';

const Event: React.FC = () => {
    const { id: calendarId, eventId: id, tab } = useParams<{ id: string; eventId: string; tab: string }>();
    if (!id?.match(/^\d+$/)) {
        return <Calendar />;
    }

    const siteUrl = ConfigAPI.getSiteUrl();
    const { callApi, loading } = useApi();
    const { errorNotice, successNotice } = useNotice();
    const [event, setEvent] = useState<EventType | null>(null);
    const [open, setOpen] = useState(!!id);
    const [checked, setChecked] = useState(true);
    const [modalShareId, setModalShareId] = useState<string | null>(null);
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

    const handleDeleteEvent = () => {
        if (!event?.id) return;
    
        if (!window.confirm(__('Are you sure you want to delete this event?', 'quillbooking'))) {
            return; // Exit if the user cancels
        }
    
        callApi({
            path: `events/${event.id}`,
            method: "DELETE",
            onSuccess: () => {
                successNotice(__('Event deleted successfully', 'quillbooking'));
                setOpen(false);
                navigate("calendars"); // Redirect after deletion
            },
            onError: (error: string) => {
                errorNotice(error);
            },
        });
    };

    const saveSettings = () => {
        //if (!validate() || loading) return;
        callApi({
            path: `events/${event.id}`,
            method: 'PUT',
            data: event,
            onSuccess: () => {
                successNotice(__('Event settings saved successfully', 'quillbooking'));
                setOpen(false);
                navigate("calendars");
            },
            onError: (error: string) => {
                errorNotice(error);
            },
        });
    };

    const handleClose = () => {
        setOpen(false);
        navigate("calendars");
    };

    const handleChange = (checked: boolean) => {
        setChecked(checked);
    };

    const tabs = [
        {
            key: 'details',
            label: __('Event Details', 'quillbooking'),
            children: <EventDetails onKeepDialogOpen={() => setOpen(true)}/>,
            icon: <CalendarsIcon />
        },
        {
            key: 'availability',
            label: __('Availability & Limits', 'quillbooking'),
            children: <Availability />,
            icon: <AvailabilityIcon />
        },
        {
            key: 'question',
            label: __('Question Settings', 'quillbooking'),
            children: <Limits />,
            icon: <QuestionIcon />
        },
        {
            key: 'email-notifications',
            label: __('Email Notification', 'quillbooking'),
            children: <Notifications notificationType='email' />,
            icon: <EmailNotiIcon />
        },
        {
            key: 'sms-notifications',
            label: __('SMS Notification', 'quillbooking'),
            children: <Notifications notificationType='sms' />,
            icon: <SmsNotiIcon />
        },
        {
            key: 'advanced-settings',
            label: __('Advanced Settings', 'quillbooking'),
            children: <AdvancedSettings />,
            icon: <SettingsIcon />
        },
        {
            key: 'payment-settings',
            label: __('Payment Settings', 'quillbooking'),
            children: <Payments />,
            icon: <PaymentSettingsIcon />
        },
        {
            key: 'webhooks-feeds',
            label: __('Webhooks Feeds', 'quillbooking'),
            children: <Payments />,
            icon: <WebhookIcon />
        },
        {
            key: 'integrations',
            label: __('Integrations', 'quillbooking'),
            children: <Fields />,
            icon: <IntegrationsIcon />
        },
    ];
    const [activeTab, setActiveTab] = useState(tab || "details");
    useEffect(() => {
        if (tab) {
            console.log("URL tab changed to:", tab); // Debugging log
            setActiveTab(tab);
        }
    }, [tab]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        console.log("Switching to tab:", newValue); // Debugging log
        setActiveTab(newValue);

        if (calendarId && id) {
            navigate(`calendars/${calendarId}/events/${id}/${newValue}`);
        }
    };



    return (
        <Provider
            value={{
                state: event,
                actions: {
                    setEvent
                }
            }}
        >
            <Dialog open={open} onClose={handleClose} fullScreen className='z-[1000000000]'>
                <DialogTitle className='border-b' sx={{ padding: "10px 16px" }}>
                    <Flex className="justify-between items-center">
                        <Flex gap={10}>
                            <DialogActions>
                                <DialogActions className='cursor-pointer' onClick={handleClose} color="primary">
                                    <IoCloseSharp />
                                </DialogActions>
                                <div className='text-[#09090B] text-[24px] font-[500]'>{__("Event Setup", "quillbooking")}</div>
                            </DialogActions>
                        </Flex>
                        <Flex gap={24} className='items-center'>
                            <Flex gap={16} className='items-center'>
                                <Switch
                                    checked={checked}
                                    onChange={handleChange}
                                    className={checked ? "bg-color-primary" : "bg-gray-400"}
                                />
                                <DialogActions className='cursor-pointer' color="primary" onClick={handleDeleteEvent}>
                                    <TrashRedIcon />
                                </DialogActions>
                                <Button
                                    type='text'
                                    icon={<ShareIcon />}
                                    style={{ paddingLeft: 0, paddingRight: 0 }}
                                    onClick={() => setModalShareId(id)}
                                >
                                    {__('Share', 'quillbooking')}
                                </Button>
                                {modalShareId !== null && (
                                    <ShareModal
                                        open={modalShareId !== null}
                                        onClose={() => setModalShareId(null)}
                                        url={`${siteUrl}?quillbooking_event=${event.slug}`}
                                    />
                                )}
                            </Flex>
                            <Button type="primary" onClick={saveSettings} loading={loading} className='bg-color-primary text-white rounded-lg px-4 py-2 font-[500]'>
                                {__('Save Changes', 'quillbooking')}
                            </Button>
                        </Flex>
                    </Flex>
                </DialogTitle>
                <div className="quillbooking-event">
                    <Box
                        sx={{
                            width: "100%",
                            bgcolor: "#FBFBFB",
                            display: "flex",
                            justifyContent: "center",
                            padding: "20px 16px"
                        }}
                    >
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            variant="scrollable"
                            //scrollButtons="auto"
                            sx={{
                                "& .MuiTabs-indicator": { display: "none" }
                            }}
                        >
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.key}
                                    label={tab.label}
                                    value={tab.key}
                                    icon={tab.icon}
                                    onClick={() => setActiveTab(tab.key)}
                                    iconPosition="start" // Ensures icon is placed before the label
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px", // Ensures spacing between icon & label
                                        bgcolor: activeTab === tab.key ? "#953AE4" : "transparent",
                                        color: "#292D32",
                                        borderRadius: "16px",
                                        textTransform: "capitalize",
                                        px: 3,
                                        minHeight: "48px", // Force tab height
                                        height: "48px", // Force height to override default
                                        mx: 1,
                                        fontWeight: "700",
                                        transition: "0.3s",
                                        "&.Mui-selected": { color: "white" }
                                    }}
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <div style={{ padding: "20px" }}>
                        {tabs.find((t) => t.key === activeTab)?.children || <p>No content available</p>}
                    </div>

                    {/* <Tabs
                        defaultActiveKey={tab || 'details'}
                        activeKey={tab || 'details'}
                        items={tabs}
                        tabPosition="top"
                        className="custom-tabs"
                        style={{borderBottom:"none", outline:"none"}}
                        //tabBarStyle={{ width: "100%", backgroundColor: "#FBFBFB", borderBottom: "none" }}
                        onChange={(key) => {
                            if (event) {
                                navigate(`calendars/${event.calendar.id}/events/${event.id}/${key}`);
                            }
                        }}
                    /> */}
                </div>
            </Dialog>
        </Provider>
    );
};

export default Event;