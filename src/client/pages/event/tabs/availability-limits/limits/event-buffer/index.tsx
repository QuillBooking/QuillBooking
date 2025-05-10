/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex } from 'antd';
import { Slider } from '@mui/material';

/**
 * Internal dependencies
 */
import type { LimitBaseProps } from '@quillbooking/client';


interface EventBufferProps extends LimitBaseProps {
  type: 'buffer_before' | 'buffer_after';
  title: string;
}
const EventBuffer: React.FC<EventBufferProps> = ({ limits, handleChange, type, title }) => {
  const marks = [
    { value: 0, label: <span className='absolute left-0'>{__("0 Minutes", "quillbooking")}</span> },
    { value: 120, label: <span className='absolute right-0'>{__("120 Minutes", "quillbooking")}</span> },
  ];


  return (
    <Flex gap={10} vertical className='mt-4'>
      <div className="text-[#09090B] text-[16px]">
        {title}
        <span className='text-red-500'>*</span>
      </div>
      <Card className='rounded-lg py-2'>
        <Slider
          value={limits.general[type]}
          onChange={(_, newValue) => handleChange("general", type, newValue)}
          step={5}
          min={0}
          max={120}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => (value === 0 || value === 120 ? '' : `${value} Minutes`)}
          marks={marks}
          sx={{
            '& .MuiSlider-track': {
              backgroundColor: 'transparent',
              border: "none",

            },
            '& .MuiSlider-rail': {
              backgroundColor: '#DEE1E6',
              height: "10px",
            },
            '& .MuiSlider-thumb': {
              backgroundColor: '#953AE4',
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                boxShadow: '0 0 0 5px rgba(149, 58, 228, 0.3)',
                border: '3px solid white',
              }
            },
            '& .MuiSlider-mark': {
              backgroundColor: "transparent",
            },
            '& .MuiSlider-markLabel': {
              color: 'black',
              fontSize: '16px',
            },
            '& .MuiSlider-valueLabel': {
              backgroundColor: 'transparent',
              position: "absolute",
              top: "0",
              left: "-38px",
              outline: "none",
              appearance: "none",
              color: 'black',
              fontSize: '16px',
              transform: 'translateY(-10px)',
            },
          }}
        />
      </Card>
    </Flex>
  )
};

export default EventBuffer;