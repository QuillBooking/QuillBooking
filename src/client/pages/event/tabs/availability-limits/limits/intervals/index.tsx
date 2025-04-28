import { __ } from '@wordpress/i18n';
import { Flex, Select } from 'antd';
import { LimitBaseProps } from '@quillbooking/client';

interface TimeSlotIntervalsProps extends LimitBaseProps{
}

const timeOptions = [
  { value: 0, label: __('No buffer time', 'quillbooking') },
  ...Array.from({ length: 24 }, (_, i) => {
      const value = (i + 1) * 5;
      return { value, label: `${value} ${__('minutes', 'quillbooking')}` };
  }),
];

const TimeSlotIntervals: React.FC<TimeSlotIntervalsProps> = ({limits, handleChange}) => {
  return (
    <Flex gap={10} vertical className='mt-4'>
    <div className="text-[#09090B] text-[16px]">
        {__("Time Slot Intervals", "quillbooking")}
        <span className='text-red-500'>*</span>
    </div>
    <Select
        value={limits.general.time_slot}
        options={timeOptions}
        onChange={(value) => handleChange('general', 'time_slot', value)}
        getPopupContainer={(trigger) => trigger.parentElement}
        className='h-[48px] w-full rounded-lg'
    />
</Flex>
  )
}

export default TimeSlotIntervals;