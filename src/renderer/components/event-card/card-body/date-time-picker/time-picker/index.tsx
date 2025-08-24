import { Dayjs } from 'dayjs';
import { __ } from '@wordpress/i18n';
import { Event, EventTypes } from '../../../../../types';
import './style.scss';
import { css } from '@emotion/css';
import InfoIcon from '../../../../../icons/info-icon';
import { doAction } from '@wordpress/hooks';

interface TimeSlot {
	time: string;
	remaining: number;
	hosts_ids: number[];
	originalSlot: {
		start: string;
		end: string;
		remaining: number;
		hosts_ids: number[];
	};
}

interface TimePickerProps {
	selectedAvailability: string | null;
	selectedDate: Dayjs;
	selectedTime: string | null;
	setSelectedTime: (time: string) => void;
	setHostIds: (hostIds: number[]) => void;
	eventType?: EventTypes;
	showRemaining?: boolean;
	baseColor: string;
	lightColor: string;
	event: Event;
}

const TimePicker: React.FC<TimePickerProps> = ({
	selectedAvailability,
	selectedDate,
	selectedTime,
	setSelectedTime,
	setHostIds,
	eventType = 'one-to-one',
	showRemaining,
	baseColor,
	lightColor,
	event,
}) => {
	const getTimeSlots = (): TimeSlot[] => {
		if (!selectedAvailability) {
			return [];
		}

		const dateKey = selectedDate.format('YYYY-MM-DD');
		const slotsForDate = selectedAvailability[dateKey];

		if (!slotsForDate || !Array.isArray(slotsForDate)) {
			return [];
		}

		return slotsForDate
			.filter((slot: { remaining: number }) => slot && slot.remaining > 0)
			.map(
				(slot: {
					start: string;
					end: string;
					remaining: number;
					hosts_ids: number[];
				}) => {
					if (!slot || !slot.start) {
						return undefined;
					}
					const timeString = slot.start.split(' ')[1];
					const time = timeString.split(':');
					return {
						time: `${time[0]}:${time[1]}`,
						remaining: slot.remaining,
						hosts_ids: slot.hosts_ids,
						originalSlot: slot,
					};
				}
			)
			.filter((slot): slot is TimeSlot => slot !== undefined);
	};

	const timeSlots = getTimeSlots();
	const isGroupEvent = eventType === 'group';

	const formatSpotsBadge = (spots: number) => {
		if (spots === 1) {
			return (
				<span className="time-slot-spots time-slot-spots-single">
					<span>
						<InfoIcon />
					</span>
					<span>1</span>
					<span>{__('last spot', 'quillbooking')}</span>
				</span>
			);
		} else if (spots < 5) {
			return (
				<span className="time-slot-spots time-slot-spots-few">
					<span>
						<InfoIcon />
					</span>
					<span>{spots}</span>
					<span>{__('spots left', 'quillbooking')}</span>
				</span>
			);
		} else {
			return (
				<span className="time-slot-spots">
					<span>
						<InfoIcon />
					</span>
					<span>{spots}</span>
					<span>{__('spots available', 'quillbooking')}</span>
				</span>
			);
		}
	};

	return (
		<div
			className={`time-picker-container ${css`
				scrollbar-color: ${baseColor} #f5f5f5;
				&::-webkit-scrollbar-thumb {
					background: ${baseColor};
					border-radius: 8px;
				}
			`}`}
		>
			<p className="time-picker-title">
				{selectedDate.format('dddd, MMMM D')}
			</p>
			<div className="time-slots-container">
				{timeSlots.length > 0 ? (
					timeSlots.map((slot: TimeSlot, index: number) => (
						<div
							key={index}
							className={`time-slot ${!isGroupEvent ? 'time-slot-centered' : 'group-event-container'} ${selectedTime === slot.time ? 'active' : ''} ${css`
								&:hover {
									background-color: ${lightColor};
									color: ${baseColor};
									border-color: ${baseColor};
								}
							`}`}
							onClick={() => {
								setSelectedTime(slot.time);
								setHostIds(slot.hosts_ids);
								doAction('QuillBooking.BookingStarted', {
									data: {
										calendar_id: event.calendar_id,
										event_id: event.id,
									},
								});
							}}
						>
							<span className="time-slot-time">{slot.time}</span>
							{isGroupEvent &&
								showRemaining &&
								slot.remaining > 0 &&
								formatSpotsBadge(slot.remaining)}
						</div>
					))
				) : (
					<div className="no-time-slots">
						{__(
							'No available time slots for this day',
							'quillbooking'
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default TimePicker;
