import { Calendar } from 'antd';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import './style.scss';
import isBetween from 'dayjs/plugin/isBetween';
import isToday from 'dayjs/plugin/isToday';
import { __ } from '@wordpress/i18n';
import { Event } from '../../../../../types';
import { Dayjs } from 'dayjs';
import PreviousIcon from '../../../../../icons/previous-icon';
import NextIcon from '../../../../../icons/next-icon';

dayjs.extend(isBetween);
dayjs.extend(isToday);

interface DatePickerProps {
	event: Event;
	selectedDate: Dayjs | null;
	setSelectedDate: (date: Dayjs) => void;
	timeZone: string;
	selectedAvailability?: any;
	setSelectedAvailability: (availability: any) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
	event,
	selectedDate,
	setSelectedDate,
	timeZone,
	selectedAvailability,
	setSelectedAvailability,
}) => {
	const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

	useEffect(() => {
		if (selectedDate) {
			setCurrentMonth(selectedDate);
		}
	}, [selectedDate]);

	const fetchAvailability = async (value: number, calendar_id?: number) => {
		const formData = new FormData();
		formData.append('action', 'quillbooking_booking_slots');
		formData.append('id', value.toString());
		formData.append('timezone', timeZone || '');
		formData.append('start_date', new Date().toISOString());
		formData.append('duration', event.duration.toString());

		if (calendar_id) {
			formData.append('calendar_id', calendar_id.toString());
		}

		try {
			const response = await fetch('/wp-admin/admin-ajax.php', {
				method: 'POST',
				body: formData,
			});
			if (response.ok) {
				const data = await response.json();
				setSelectedAvailability(data.data.slots);
			}
		} catch (error) {
			console.error('Error fetching availability:', error);
		}
	};

	useEffect(() => {
		fetchAvailability(event.id, event.calendar_id);
	}, [timeZone]);

	const renderDateCell = (value) => {
		const isSameDay =
			selectedDate &&
			value.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
		const isAvailable =
			selectedAvailability &&
			selectedAvailability[value.format('YYYY-MM-DD')] !== undefined;
		const isCurrentDay = value.isSame(dayjs(), 'day');

		const className = isSameDay
			? 'calendar-date selected-date'
			: isAvailable
				? 'calendar-date highlight-date'
				: 'calendar-date';

		return (
			<div className={className}>
				<div className="date-number">{value.date()}</div>
				{isCurrentDay && <div className="dot" />}
			</div>
		);
	};

	const renderHeader = ({ value }) => {
		const handlePrevMonth = () => {
			const newValue = value.clone().subtract(1, 'month');
			setCurrentMonth(newValue);
		};

		const handleNextMonth = () => {
			const newValue = value.clone().add(1, 'month');
			setCurrentMonth(newValue);
		};

		return (
			<div className="calendar-header">
				<button onClick={handlePrevMonth} className="nav-arrow">
					<PreviousIcon />
				</button>
				<div className="month-label">{value.format('MMMM YYYY')}</div>
				<button onClick={handleNextMonth} className="nav-arrow">
					<NextIcon />
				</button>
			</div>
		);
	};

	const disabledDate = (current: Dayjs): boolean => {
		if (!selectedAvailability) {
			return true;
		}
		return selectedAvailability[current.format('YYYY-MM-DD')] === undefined;
	};

	return (
		<Calendar
			fullscreen={false}
			value={currentMonth}
			onSelect={(date) => {
				setSelectedDate(date);
				setCurrentMonth(date);
			}}
			disabledDate={disabledDate}
			fullCellRender={renderDateCell}
			headerRender={renderHeader}
			className="custom-calendar"
		/>
	);
};

export default DatePicker;
