/**
 * Wordpress dependencies
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

interface BookingDurationProps extends LimitBaseProps {
  addLimit: (section: 'frequency' | 'duration') => void;
  removeLimit: (section: 'frequency' | 'duration', index: number) => void;
  unitOptions: UnitOptions;
  setBookingDuration: (val: any) => void;
}

const BookingDuration: React.FC<BookingDurationProps> = ({ limits, handleChange, addLimit, removeLimit, unitOptions, setBookingDuration }) => {

  return (
    <Card className='mt-4'>
      <Flex vertical gap={20}>
        <LimitCard
          handleChange={handleChange}
          limits={limits}
          title={__("Limit Booking Duration", "quillbooking")}
          description={__("Limit how long this event can be booked for.", "quillbooking")}
          type='duration'
        />

        <LimitRow
          addLimit={addLimit}
          removeLimit={removeLimit}
          limits={limits}
          handleChange={handleChange}
          unitOptions={unitOptions}
          setBookingState={setBookingDuration}
          type='duration'
        />
      </Flex>
    </Card>
  );
};

export default BookingDuration;