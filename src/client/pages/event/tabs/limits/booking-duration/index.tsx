import { Card, Flex } from 'antd';
import { __ } from '@wordpress/i18n';
import type { EventLimits as EventLimitsType, UnitOptions } from '@quillbooking/client';
import LimitCard from '../limit-card';
import LimitRow from '../limit-row';

interface BookingDurationProps {
  settings: EventLimitsType;
  handleChange: (section: keyof EventLimitsType, key: string, value: any) => void;
  addLimit: (section: 'frequency' | 'duration') => void;
  removeLimit: (section: 'frequency' | 'duration', index: number) => void;
  unitOptions: UnitOptions;
  setBookingDuration: (val: any) => void;
}

const BookingDuration: React.FC<BookingDurationProps> = ({ settings, handleChange, addLimit, removeLimit, unitOptions, setBookingDuration }) => {

  return (
    <Card className='mt-4'>
      <Flex vertical gap={20}>
        <LimitCard
          handleChange={handleChange}
          settings={settings}
          title={__("Limit Booking Duration", "quillbooking")}
          description={__("Limit how long this event can be booked for.", "quillbooking")}
          type='duration'
        />

        <LimitRow
          addLimit={addLimit}
          removeLimit={removeLimit}
          settings={settings}
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