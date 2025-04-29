import { Button, Flex, InputNumber, Select } from 'antd';
import { LimitsAddIcon, TrashIcon } from '@quillbooking/components';
import { __ } from '@wordpress/i18n';
import type { LimitBaseProps, LimitUnit, UnitOptions } from '@quillbooking/client';


interface LimitRowProps extends LimitBaseProps {
  addLimit: (section: 'frequency' | 'duration') => void;
  removeLimit: (section: 'frequency' | 'duration', index: number) => void;
  unitOptions: UnitOptions;
  setBookingState: (val: any) => void;
  type: 'frequency' | 'duration';
}

const LimitRow: React.FC<LimitRowProps> = ({ limits, handleChange, addLimit, removeLimit, unitOptions, setBookingState, type }) => {
  return (
    <>
      {limits[type].enable && (
        <div className='border-t pt-4'>
          {limits[type].limits.map((limit, index) => (
            <Flex align="center" gap={10} className='w-full mb-4'>
              <InputNumber
                controls={false}
                value={limit.limit}
                min={1}
                onChange={(value) => {
                  const updatedLimits = [...limits[type].limits];
                  updatedLimits[index].limit = Number(value) || (type == 'frequency' ? 1 : 120);
                  handleChange(type, 'limits', updatedLimits);
                }}
                className='w-3/5 rounded-lg h-[48px]'
                suffix={<span className='text-[#9BA7B7] border-l pl-5'>
                  {type === 'frequency' ? __("Bookings", "quillbooking") : __("Minutes", "quillbooking")}</span>}
              />
              <Select
                value={limit.unit}
                options={Object.entries(unitOptions).map(([key, option]) => ({ value: key, label: option.label, disabled: option.disabled }))}
                getPopupContainer={(trigger) => trigger.parentElement}
                onChange={(value) => {
                  const previousUnit = limits[type].limits[index].unit;
                  const newUnit = value as LimitUnit;
                  const updatedLimits = [...limits[type].limits];
                  updatedLimits[index].unit = newUnit;

                  handleChange(type, 'limits', updatedLimits);

                  // Enable the previously selected unit
                  setBookingState((prev) => ({
                    ...prev,
                    [previousUnit]: {
                      ...prev[previousUnit],
                      disabled: false
                    }
                  }));

                  // Disable the newly selected unit
                  setBookingState(prev => ({
                    ...prev,
                    [newUnit]: {
                      ...prev[newUnit],
                      disabled: true
                    }
                  }));
                }}
                className='w-2/5 rounded-lg h-[48px]'
              />

              {index === 0 && (<Button onClick={() => addLimit(type)} className='border-none shadow-none p-0'>
                <LimitsAddIcon />
              </Button>)}

              {index !== 0 && (
                <Button
                  danger
                  size="small"
                  onClick={() => removeLimit(type, index)}
                  className='border-none shadow-none p-0'
                >
                  <TrashIcon width={24} height={24} />
                </Button>
              )}
            </Flex>
          ))}
        </div>
      )}
    </>
  );
}

export default LimitRow;