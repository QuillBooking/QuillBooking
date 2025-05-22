import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { Event } from '../../../../types';
import DatePicker from './date-picker';
import { Dayjs } from 'dayjs';
import TimePicker from './time-picker';
import './style.scss';
import TimezoneSelect from '../../../timezone-select';
import CurrentTimeInTimezone from '../../../current-time';
import GlobalIcon from '../../../../icons/global-icon';

interface DateTimePickerProps {
	event: Event;
	selectedDate: Dayjs | null;
	setSelectedDate: (date: Dayjs | null) => void;
	timeZone: string;
	setTimeZone: (timezone: string) => void;
	selectedTime: string | null;
	setSelectedTime: (time: string | null) => void;
	ajax_url: string;
	selectedDuration: number;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
	event,
	selectedDate,
	setSelectedDate,
	timeZone,
	setTimeZone,
	selectedTime,
	setSelectedTime,
	ajax_url,
	selectedDuration,
}) => {
	const [selectedAvailability, setSelectedAvailability] = useState<
		string | null
	>(null);

	const isTimezoneLocked = event.limits_data.timezone_lock.enable;

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
				/>
				{selectedDate && (
					<TimePicker
						selectedTime={selectedTime}
						selectedAvailability={selectedAvailability}
						selectedDate={selectedDate}
						setSelectedTime={setSelectedTime}
						eventType={event.type}
					/>
				)}
			</div>
			<div>
				<p className="date-time-timezone">
					{__('Time Zone', '@quillbooking')}
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
					/>
				</div>
			</div>
		</div>
	);
};

export default DateTimePicker;
