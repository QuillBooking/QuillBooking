/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AvailabilitySection from './availability';
import EventLimits from './limits';
import {
	Availability,
	AvailabilityRange,
	DateOverrides,
	EventTabHandle,
	EventTabProps,
	UnitOptions as UnitOptionsType,
	EventLimits as EventLimitsType,
	LimitUnit,
	CustomAvailability,
} from 'client/types';
import { getCurrentTimezone } from '@quillbooking/utils';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { useApi, useEvent } from '@quillbooking/hooks';
import Shimmer from './shimmer';

const AvailabilityLimits = forwardRef<EventTabHandle, EventTabProps>(
	(props, ref) => {
		// Event state
		const [availabilityType, setAvailabilityType] =
			useState<string>('existing');
		const [availability, setAvailability] = useState(null);
		const [availabilityMeta, setAvailabilityMeta] = useState(null);
		const [eventAvailability, setEventAvailability] = useState(null);
		const [reservetimes, setReservetimes] = useState<boolean>(false);
		const [range, setRange] = useState<AvailabilityRange>({
			type: 'days',
			days: 5,
		});
		const [override, setDateOverrides] = useState<DateOverrides>({});
		// Global settings state
		const [startDay, setStartDay] = useState<string>('monday');
		const [timeFormat, setTimeFormat] = useState<string>('12');

		// Limits state
		const [bookingDurationOptions, setBookingDurationOptions] =
			useState<UnitOptionsType>({
				days: { label: __('Day', 'quillbooking'), disabled: false },
				weeks: { label: __('Week', 'quillbooking'), disabled: false },
				months: { label: __('Month', 'quillbooking'), disabled: false },
			});
		const [bookingFrequencyOptions, setBookingFrequencyOptions] =
			useState<UnitOptionsType>({
				days: { label: __('Day', 'quillbooking'), disabled: false },
				weeks: { label: __('Week', 'quillbooking'), disabled: false },
				months: { label: __('Month', 'quillbooking'), disabled: false },
			});
		const [limits, setLimits] = useState<EventLimitsType | null>(null);

		const { currentEvent: event, loading: eventLoading } = useEvent();
		const { callApi, loading } = useApi();

		const fetchRange = () => {
			if (!event) return;

			callApi({
				path: `events/${event.id}/range`,
				method: 'GET',
				onSuccess(response: { range: AvailabilityRange }) {
					setRange(response.range);
				},
				onError(error) {
					console.error('Error fetching range:', error);
				},
			});
		};

		const fetchLimits = () => {
			if (!event) return;

			callApi({
				path: `events/${event.id}/meta/limits`,
				method: 'GET',
				onSuccess(response: EventLimitsType) {
					setLimits(response);
					setBookingDurationOptions((prev) => {
						const updatedOptions = { ...prev };
						response.duration.limits.forEach((limit) => {
							if (updatedOptions[limit.unit as LimitUnit]) {
								updatedOptions[
									limit.unit as LimitUnit
								].disabled = true;
							}
						});
						return updatedOptions;
					});

					setBookingFrequencyOptions((prev) => {
						const updatedOptions = { ...prev };
						response.frequency.limits.forEach((limit) => {
							if (updatedOptions[limit.unit as LimitUnit]) {
								updatedOptions[
									limit.unit as LimitUnit
								].disabled = true;
							}
						});
						return updatedOptions;
					});
				},
				onError(error) {
					throw new Error(error.message);
				},
			});
		};

		const fetchGlobalSettings = () => {
			callApi({
				path: 'settings',
				method: 'GET',
				onSuccess: (data) => {
					setStartDay(data.general?.start_from || 'monday');
					setTimeFormat(data.general?.time_format || '12');
				},
				onError: (error) => {
					console.error('Error fetching start day:', error);
				},
			});
		};

		useEffect(() => {
			if (!event) {
				return;
			}
			fetchLimits();
			fetchRange();
			fetchGlobalSettings();
			setAvailability(event.availability);
			setEventAvailability(event.availability);
			setAvailabilityMeta(event.availability_meta);
			setAvailabilityType(event.availability_type);
			setDateOverrides(event.availability.value.override);
		}, [event]);

		if (!limits || loading || eventLoading) {
			return <Shimmer />;
		}

		return (
			<div className="grid grid-cols-2 gap-5 px-9">
				<AvailabilitySection
					event={event}
					eventAvailability={eventAvailability}
					availability={availability}
					availabilityMeta={availabilityMeta}
					availabilityType={availabilityType}
					setAvailability={setAvailability}
					setEventAvailability={setEventAvailability}
					setAvailabilityMeta={setAvailabilityMeta}
					setAvailabilityType={setAvailabilityType}
					setReservetimes={setReservetimes}
					reservetimes={reservetimes}
					setDisabled={props.setDisabled}
					setRange={setRange}
					range={range}
					dateOverrides={override}
					setDateOverrides={setDateOverrides}
					timeFormat={timeFormat}
					startDay={startDay}
				/>
				<EventLimits
					bookingDurationOptions={bookingDurationOptions}
					bookingFrequencyOptions={bookingFrequencyOptions}
					setBookingDurationOptions={setBookingDurationOptions}
					setBookingFrequencyOptions={setBookingFrequencyOptions}
					setLimits={setLimits}
					limits={limits}
					setDisabled={props.setDisabled}
				/>
			</div>
		);
	}
);

export default AvailabilityLimits;
