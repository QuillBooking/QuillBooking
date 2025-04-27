/**
 * Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/** 
 * External dependencies
 */
import { Flex, InputNumber, Select } from 'antd';

/** 
 * Internal dependencies
 */
import { LimitBaseProps } from 'client/types';


interface MinimumNoticeProps extends LimitBaseProps {
}

const unitOptions = [
  { label: __('Minutes', 'quillbooking'), value: 'minutes' },
  { label: __('Hours', 'quillbooking'), value: 'hours' },
  { label: __('Days', 'quillbooking'), value: 'days' },
];

const MinimunmNotice: React.FC<MinimumNoticeProps> = ({ settings, handleChange }) => {
  return (
    <Flex gap={10} vertical className='mt-4'>
      <div className="text-[#09090B] text-[16px]">
        {__("Minimum Notice", "quillbooking")}
        <span className='text-red-500'>*</span>
      </div>
      <Flex gap={5} className='w-full'>
        <InputNumber
          controls={false}
          value={settings.general.minimum_notices}
          onChange={(value) => handleChange('general', 'minimum_notices', value)}
          className='h-[48px] rounded-lg w-3/4 pt-2'
        />
        <Select
          value={settings.general.minimum_notice_unit}
          options={unitOptions}
          onChange={(value) => handleChange('general', 'minimum_notice_unit', value)}
          getPopupContainer={(trigger) => trigger.parentElement}
          className='h-[48px] rounded-lg w-1/4'
        />
      </Flex>
    </Flex>
  )
}

export default MinimunmNotice;