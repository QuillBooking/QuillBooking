/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, Flex, Button, Typography, Input, Skeleton } from 'antd';

/**
 * Internal dependencies
 */
import { TimezoneSelect, FieldWrapper } from '@quillbooking/components';
import { useApi, useNotice, useBreadcrumbs } from '@quillbooking/hooks';
import { useCalendarContext } from '../../state/context';
import AvatarSelector from './avatar-selector';
import FeaturedImageSelector from './featured-image-selector';

/**
 * Main Calendars Component.
 */
const GeneralSettings: React.FC = () => {
    const { state, actions } = useCalendarContext();
    const { callApi, loading } = useApi();
    const { successNotice, errorNotice } = useNotice();
    const setBreadcrumbs = useBreadcrumbs();

    useEffect(() => {
        if (!state) {
            return;
        }

        setBreadcrumbs([
            {
                path: `calendars/${state.id}/general`,
                title: __('Settings', 'quillbooking')
            }
        ]);
    }, [state]);

    if (!state) {
        return <Skeleton active />;
    }

    const saveSettings = () => {
        if (!validate() || loading) return;
        callApi({
            path: `calendars/${state.id}`,
            method: 'PUT',
            data: state,
            onSuccess: () => {
                successNotice(__('Settings saved successfully', 'quillbooking'));
            },
            onError: (error: string) => {
                errorNotice(error);
            }
        });
    };

    const handleChange = (key: string, value: any) => {
        actions.setCalendar({ ...state, [key]: value });
    };

    const validate = () => {
        if (!state.name) {
            errorNotice(__('Please enter a name for the calendar.', 'quillbooking'));
            return false;
        }

        if (!state.timezone) {
            errorNotice(__('Please select a timezone.', 'quillbooking'));
            return false;
        }

        return true;
    };

    const getCurrentTimeInTimezone = (timezone) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        };

        const now = new Date();
        // @ts-ignore
        return now.toLocaleString('en-US', options)
    }

    return (
        <Card className="quillbooking-calendar-settings">
            <Flex>
                <Typography.Title className='quillbooking-tab-title' level={4}>{__('General Settings', 'quillbooking')}</Typography.Title>
            </Flex>
            <Flex vertical gap={20}>
                <Flex justify='space-between' align='center'>
                    <AvatarSelector
                        value={state.avatar}
                        onChange={(value) => handleChange('avatar', value)}
                    />
                    <FeaturedImageSelector
                        value={state.featured_image}
                        onChange={(value) => handleChange('featured_image', value)}
                    />
                </Flex>
                <FieldWrapper
                    label={__('Name', 'quillbooking')}
                    description={__('The name of the calendar', 'quillbooking')}
                >
                    <Input
                        value={state.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder={__('Enter a name for the calendar', 'quillbooking')}
                    />
                </FieldWrapper>
                <FieldWrapper
                    label={__('Description', 'quillbooking')}
                    description={__('A short description of the calendar', 'quillbooking')}
                >
                    <Input.TextArea
                        value={state.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder={__('Enter a description for the calendar', 'quillbooking')}
                    />
                </FieldWrapper>
                <FieldWrapper
                    label={__('Timezone', 'quillbooking')}
                    description={sprintf(__('Current time in %s is %s', 'quillbooking'), state.timezone, getCurrentTimeInTimezone(state.timezone))}
                >
                    <TimezoneSelect
                        value={state.timezone}
                        onChange={(value) => handleChange('timezone', value)}
                    />
                </FieldWrapper>
                <Button type="primary" onClick={saveSettings} loading={loading}>
                    {__('Save', 'quillbooking')}
                </Button>
            </Flex>
        </Card>
    );
};

export default GeneralSettings;