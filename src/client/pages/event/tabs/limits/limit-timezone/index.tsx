import { Card, Flex, Switch } from 'antd';
import SelectTimezone from './select-timezone';
import type { EventLimits as EventLimitsType } from '@quillbooking/client';
import { __ } from '@wordpress/i18n';

interface SelectTimezoneProps {
  settings: EventLimitsType;
  handleChange: (section: keyof EventLimitsType, key: string, value: any) => void;
}

const TimezoneSection: React.FC<SelectTimezoneProps> = ({ settings, handleChange }) => {
  return (
    <Card className='mt-4'>
      <Flex className='items-center justify-between px-[20px]'>
        <Flex vertical gap={1}>
          <div className="text-[#09090B] text-[20px] font-semibold">
            {__("Lock time zone on booking page", "quillbooking")}
          </div>
          <div className='text-[#71717A] text-[14px]'>
            {__("To lock the timezone on booking page, useful for in-person events", "quillbooking")}
          </div>
        </Flex>
        <Switch
          checked={settings.timezone_lock.enable}
          onChange={(checked) => handleChange('timezone_lock', 'enable', checked)}
          className={settings.timezone_lock.enable ? "bg-color-primary" : "bg-gray-400"}
        />
      </Flex>
      {settings.timezone_lock.enable && (
        <SelectTimezone settings={settings} handleChange={handleChange} />
      )}
    </Card>
  )
};

export default TimezoneSection;