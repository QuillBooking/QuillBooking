/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex } from 'antd';

/**
 * Internal dependencies
 */
import type { LimitBaseProps, UnitOptions } from '@quillbooking/client';
import LimitCard from '../limit-card';
import LimitRow from '../limit-row';

interface BookingFrequencyProps extends LimitBaseProps {
    addLimit: (section: 'frequency' | 'duration') => void;
    removeLimit: (section: 'frequency' | 'duration', index: number) => void;
    unitOptions: UnitOptions;
    setBookingFrequency: (val: any) => void;
}

const BookingFrequency: React.FC<BookingFrequencyProps> = ({ settings, handleChange, addLimit, removeLimit, unitOptions, setBookingFrequency }) => {

    console.log('settings,', settings);
    return (
        <Card className='mt-4'>
            <Flex vertical gap={20}>
                <LimitCard
                    handleChange={handleChange}
                    settings={settings}
                    title={__("Limit Booking Frequency", "quillbooking")}
                    description={__("Limit how many times this event can be booked.", "quillbooking")}
                    type='frequency'
                />
                <LimitRow
                    addLimit={addLimit}
                    removeLimit={removeLimit}
                    settings={settings}
                    handleChange={handleChange}
                    unitOptions={unitOptions}
                    setBookingState={setBookingFrequency}
                    type='frequency'
                />
            </Flex>
        </Card>
    );
};

export default BookingFrequency;