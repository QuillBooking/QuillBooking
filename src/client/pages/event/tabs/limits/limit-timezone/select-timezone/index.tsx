/**
 * WordPress dependencies
*/
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
*/
import { Flex } from 'antd';

/**
 * Internal dependencies
*/
import { CurrentTimeInTimezone, TimezoneSelect } from '@quillbooking/components';
import type { EventLimits as EventLimitsType } from '@quillbooking/client';

interface SelectTimezoneProps {
  settings: EventLimitsType;
  handleChange: (section: keyof EventLimitsType, key: string, value: any) => void;
}
const SelectTimezone: React.FC<SelectTimezoneProps> = ({ settings, handleChange }) => {

  return (
    <Flex vertical gap={10} className='px-[20px]'>
      <div className="text-[#09090B] text-[16px]">
        {__("Select Time Zone", "quillbooking")}
        <span className='text-red-500'>*</span>
      </div>
      <TimezoneSelect
        value={settings.timezone_lock.timezone}
        onChange={(value) => handleChange('timezone_lock', 'timezone', value)}
        getPopupContainer={(trigger) => trigger.parentElement}
        className='h-[48px] w-full rounded-lg'
      />

      <CurrentTimeInTimezone className='text-[#71717A]' currentTimezone={settings.timezone_lock.timezone} />
    </Flex>
  )
};

export default SelectTimezone;