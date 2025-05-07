/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex } from 'antd';
import { IoCloseSharp } from 'react-icons/io5';
import { Box, Dialog, DialogActions, DialogTitle } from '@mui/material';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Calendar as CalendarType } from '@quillbooking/client';
import { useApi, useNotice, useBreadcrumbs, useNavigate } from '@quillbooking/hooks';
import { useParams } from '@quillbooking/navigation';
import { Provider } from './state/context';
import { GeneralSettings } from './tabs';
import { ShareIcon } from '@quillbooking/components';

/**
 * Main Calendars Component.
 */
const Calendar: React.FC = () => {
    const { id, tab } = useParams<{ id: string; tab: string }>();
    const { callApi, loading } = useApi();
    const { errorNotice, successNotice } = useNotice();
    const [calendar, setCalendar] = useState<CalendarType | null>(null);
    const [open, setOpen] = useState(!!id);
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

    const handleClose = () => {
        setOpen(false);
        navigate('calendars');
    };

    const saveSettings = () => {
        if (!calendar) return;

        // Validate
        if (!calendar.name) {
            errorNotice(__('Please enter a name for the calendar.', 'quillbooking'));
            return;
        }

        if (!calendar.timezone) {
            errorNotice(__('Please select a timezone.', 'quillbooking'));
            return;
        }

        // Save settings
        callApi({
            path: `calendars/${id}`,
            method: 'PUT',
            data: calendar,
            onSuccess: () => {
                successNotice(__('Settings saved successfully', 'quillbooking'));
            },
            onError: (error) => {
                errorNotice(error);
            }
        });
    };

    return (
        <Provider
            value={{
                state: calendar,
                actions: {
                    setCalendar
                }
            }}
        >
            <Dialog
                open={open}
                onClose={handleClose}
                fullScreen
                className="z-[120000]"
            >
                <DialogTitle className="border-b" sx={{ padding: '10px 16px' }}>
                    <Flex className="justify-between items-center">
                        <Flex gap={10}>
                            <DialogActions>
                                <DialogActions
                                    className="cursor-pointer"
                                    onClick={handleClose}
                                    color="primary"
                                >
                                    <IoCloseSharp />
                                </DialogActions>
                                <div className="text-[#09090B] text-[24px] font-[500]">
                                    {__('Team Settings', 'quillbooking')}
                                </div>
                            </DialogActions>
                        </Flex>
                        <Flex gap={20} className="items-center">
                            <Button
                                type="text"
                                icon={<ShareIcon />}
                                className='p-0'
                            >
                                {__('View', 'quillbooking')}
                            </Button>
                            <Button
                                type="primary"
                                size="middle"
                                onClick={saveSettings}
                                loading={loading}
                            >
                                {__('Save Setting Changes', 'quillbooking')}
                            </Button>
                        </Flex>
                    </Flex>
                </DialogTitle>
                <div className="quillbooking-event">
                    <Box className="px-14 py-5">
                        <GeneralSettings />
                    </Box>
                </div>
            </Dialog>
        </Provider>
    );
};

export default Calendar;