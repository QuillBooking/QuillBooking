import { Flex, Switch, TimePicker, Typography } from 'antd';
import { map } from 'lodash';
import dayjs from 'dayjs';
import { __ } from '@wordpress/i18n';


const { Text } = Typography;
interface ScheduleComponentProps {
  availability: {
    weekly_hours: {
      [key: string]: {
        off: boolean;
        times: { start: string; end: string }[];
      };
    };
  };
  onCustomAvailabilityChange: (
    dayKey: string,
    field: string,
    value: boolean | { start: string; end: string }[]
  ) => void;
}

const ScheduleComponent: React.FC<ScheduleComponentProps> = ({ availability, onCustomAvailabilityChange }) => {
  return (
    <>
      {(
        map(availability.weekly_hours, (day, key) => (
          <Flex key={key} align="center" gap={15} className='mb-5'>
            <Flex gap={10} className='items-center w-[145px]'>
              <Switch
                checked={!day.off}
                onChange={(checked) => onCustomAvailabilityChange(key, "off", !checked)}
                className={`${!day.off ? "bg-color-primary" : "bg-gray-400"}`}
              />
              <Text className='capitalize text-[#1E2125] text-[16px] font-[700] flex-1'>{key}</Text>
            </Flex>
            <TimePicker
              value={dayjs(day.times[0].start, "hh:mm")}
              onChange={(time) => {
                if (time) {
                  onCustomAvailabilityChange(key, "times", [
                    { start: time.format("hh:mm"), end: day.times[0].end }
                  ]);
                }
              }}
              format="hh:mm A"
              placeholder="Start Time"
              prefix={<span className='text-[#9BA7B7]'>{__("From", "quillbooking")}</span>}
              className='h-[48px] rounded-lg flex-1 custom-timepicker'
              disabled={day.off}
              suffixIcon={null}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />

            <TimePicker
              value={dayjs(day.times[0].end, "hh:mm")}
              onChange={(time) => {
                if (time) {
                  onCustomAvailabilityChange(key, "times", [
                    { start: day.times[0].start, end: time.format("hh:mm") }
                  ]);
                }
              }}
              format="hh:mm A"
              placeholder="End Time"
              suffixIcon={null}
              prefix={<span className='text-[#9BA7B7]'>{__("To", "quillbooking")}</span>}
              className='h-[48px] rounded-lg flex-1 custom-timepicker'
              disabled={day.off}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
          </Flex>
        ))
      )}
    </>
  )
}

export default ScheduleComponent;