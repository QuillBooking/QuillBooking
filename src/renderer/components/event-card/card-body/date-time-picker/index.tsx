import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { RendererEvent } from '@quillbooking/types';
import DatePicker from './date-picker';
import { Dayjs } from 'dayjs';
import TimePicker from './time-picker';
import './style.scss';
import TimezoneSelect from '../../../timezone-select';
import CurrentTimeInTimezone from '../../../current-time';
import GlobalIcon from '../../../../icons/global-icon';

interface DateTimePickerProps {
	event: RendererEvent;
	selectedDate: Dayjs | null;
	setSelectedDate: (date: Dayjs | null) => void;
	timeZone: string;
	setTimeZone: (timezone: string) => void;
	selectedTime: string | null;
	setSelectedTime: (time: string | null) => void;
	ajax_url: string;
	selectedDuration: number;
	baseColor: string;
	lightColor: string;
	setIsLoading: (isLoading: boolean) => void;
	setHostIds: (hostIds: number[]) => void;
	timeFormat: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
	event,
	selectedDate,
	setSelectedDate,
	timeZone,
	setTimeZone,
	selectedTime,
	setSelectedTime,
	setHostIds,
	ajax_url,
	selectedDuration,
	baseColor,
	lightColor,
	setIsLoading,
	timeFormat,
}) => {
	const [selectedAvailability, setSelectedAvailability] = useState<
		string | null
	>(null);

	const isTimezoneLocked = event.limits_data?.timezone_lock?.enable ?? false;
	const showRemaining =
		event.type === 'group'
			? (event.group_settings?.show_remaining ?? true)
			: true;

	return (
		<div className="date-time-container">
			<div className="date-time-header">
				<p className="date-time-title">
					{__('Select a Date & Time', '@quillbooking')}
				</p>
			</div>
			<div className="date-time-picker">
				<DatePicker
					event={event}
					selectedDate={selectedDate}
					setSelectedDate={setSelectedDate}
					selectedDuration={selectedDuration}
					setSelectedTime={setSelectedTime}
					timeZone={timeZone}
					selectedAvailability={selectedAvailability}
					setSelectedAvailability={setSelectedAvailability}
					ajax_url={ajax_url}
					baseColor={baseColor}
					lightColor={lightColor}
					setIsLoading={setIsLoading}
				/>
				{selectedDate && (
					<TimePicker
						selectedTime={selectedTime}
						selectedAvailability={selectedAvailability}
						selectedDate={selectedDate}
						setSelectedTime={setSelectedTime}
						eventType={event.type}
						showRemaining={showRemaining}
						setHostIds={setHostIds}
						baseColor={baseColor}
						lightColor={lightColor}
						event={event}
						timeFormat={timeFormat}
					/>
				)}
			</div>
			<div>
				<p className="date-time-timezone">
					{__('Time zone', '@quillbooking')}
				</p>
				<div className="date-time-timezone-select">
					<GlobalIcon />
					{isTimezoneLocked ? (
						<p className="timezone">
							{event.limits_data.timezone_lock.timezone}
						</p>
					) : (
						<TimezoneSelect
							value={timeZone}
							onChange={(val) => {
								setTimeZone(val);
								setSelectedDate(null);
							}}
						/>
					)}

					<CurrentTimeInTimezone
						currentTimezone={
							isTimezoneLocked
								? event.limits_data.timezone_lock.timezone
								: timeZone
						}
						className="time-container"
						timeFormat={timeFormat}
					/>
				</div>
			</div>
		</div>
	);
};

export default DateTimePicker;
