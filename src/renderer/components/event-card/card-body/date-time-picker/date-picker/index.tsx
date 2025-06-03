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
import { css } from '@emotion/css';

dayjs.extend(isBetween);
dayjs.extend(isToday);

interface DatePickerProps {
	event: Event;
	selectedDate: Dayjs | null;
	setSelectedDate: (date: Dayjs | null) => void;
	timeZone: string;
	selectedAvailability?: any;
	setSelectedAvailability: (availability: any) => void;
	ajax_url: string;
	selectedDuration: number;
	setSelectedTime: (time: string | null) => void;
	baseColor: string;
	lightColor: string;
	setIsLoading: (isLoading: boolean) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
	event,
	selectedDate,
	setSelectedDate,
	timeZone,
	selectedAvailability,
	setSelectedAvailability,
	ajax_url,
	selectedDuration,
	setSelectedTime,
	baseColor,
	lightColor,
	setIsLoading,
}) => {
	const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
	const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
	const [reachedEndDate, setReachedEndDate] = useState<boolean>(false);

	useEffect(() => {
		if (selectedDate) {
			setCurrentMonth(selectedDate);
		}
	}, [selectedDate]);

	const fetchAvailability = async (date: Dayjs, calendar_id?: number) => {
		const formData = new FormData();
		formData.append('action', 'quillbooking_booking_slots');
		formData.append('id', event.id.toString());
		formData.append('timezone', timeZone || '');
		formData.append('start_date', date.format('YYYY-MM-DD HH:mm:ss'));
		formData.append('duration', selectedDuration.toString());

		if (calendar_id) {
			formData.append('calendar_id', calendar_id.toString());
		}

		try {
			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});
			if (response.ok) {
				const data = await response.json();
				if (data && data.success && data.data && data.data.slots) {
					setSelectedAvailability((prevAvailability) => ({
						...prevAvailability,
						...data.data.slots,
					}));
					setLoadedMonths((prev) => [
						...prev,
						date.format('YYYY-MM'),
					]);
					setIsLoading(false);
					console.log('hey');
					setReachedEndDate(false);
				} else {
					if (
						data &&
						!data.success &&
						data.data &&
						data.data.message === 'Event is not available'
					) {
						setReachedEndDate(true);
					} else {
						console.error('Invalid slots data received:', data);
						console.error(
							'start_date:',
							date.format('YYYY-MM-DD HH:mm:ss')
						);
					}
				}
			} else {
				console.error(
					'Error fetching availability: Server returned',
					response.status
				);
			}
		} catch (error) {
			console.error('Error fetching availability:', error);
		}
	};

	useEffect(() => {
		setLoadedMonths([]);
		setSelectedAvailability({});
		setReachedEndDate(false);

		fetchAvailability(dayjs(), event.calendar_id);
		setSelectedDate(null);
		setSelectedTime(null);
	}, [timeZone, selectedDuration]);

	useEffect(() => {
		const monthKey = currentMonth.format('YYYY-MM');
		if (!loadedMonths.includes(monthKey) && !reachedEndDate) {
			fetchAvailability(currentMonth, event.calendar_id);
		}
	}, [currentMonth]);

	const renderDateCell = (value) => {
		const isSameDay =
			selectedDate &&
			value.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
		const availableSlots =
			selectedAvailability &&
			selectedAvailability[value.format('YYYY-MM-DD')];
		const isAvailable = availableSlots !== undefined;
		const isCurrentDay = value.isSame(dayjs(), 'day');

		const className = isSameDay
			? `calendar-date selected-date ${css`
					background-color: ${baseColor};
				`}`
			: isAvailable
				? `calendar-date highlight-date ${css`
						background-color: ${lightColor};
						color: ${baseColor};
					`}`
				: 'calendar-date';

		return (
			<div className={className}>
				<div className="date-number">{value.date()}</div>
				{isCurrentDay && (
					<div
						className={`dot ${css`
							background-color: ${baseColor};
						`}`}
					/>
				)}
			</div>
		);
	};

	const renderHeader = ({ value }) => {
		const handlePrevMonth = () => {
			const newValue = value.clone().subtract(1, 'month');
			setCurrentMonth(newValue);
			setReachedEndDate(false);
		};

		const handleNextMonth = () => {
			if (!reachedEndDate) {
				const newValue = value.clone().add(1, 'month');
				setCurrentMonth(newValue);
			}
		};

		return (
			<div className="calendar-header">
				<button
					onClick={handlePrevMonth}
					className={`nav-arrow ${css`
						background-color: ${lightColor};
						color: ${baseColor};
					`}`}
				>
					<PreviousIcon />
				</button>
				<div className="month-label">{value.format('MMMM YYYY')}</div>
				<button
					onClick={handleNextMonth}
					className={`nav-arrow ${css`
						background-color: ${lightColor};
						color: ${baseColor};
					`}`}
					disabled={reachedEndDate}
					style={
						reachedEndDate
							? { opacity: 0.5, cursor: 'not-allowed' }
							: {}
					}
				>
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
