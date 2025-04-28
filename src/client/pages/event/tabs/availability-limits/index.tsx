import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from '@wordpress/element';
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
} from 'client/types';
import { __ } from '@wordpress/i18n';
import { getCurrentTimezone } from '@quillbooking/utils';
import { DEFAULT_WEEKLY_HOURS } from '@quillbooking/constants';
import { useEventContext } from '../../state/context';
import { useApi, useNotice } from '@quillbooking/hooks';

const AvailabilityLimits = forwardRef<EventTabHandle, EventTabProps>(
	(props, ref) => {
		const customAvailability = {
			id: 'custom',
			user_id: 'custom',
			name: __('Custom', 'quillbooking'),
			timezone: getCurrentTimezone(),
			weekly_hours: DEFAULT_WEEKLY_HOURS,
			override: {},
		};

		const UnitOptions = {
			days: { label: __('Day', 'quillbooking'), disabled: false },
			weeks: { label: __('Week', 'quillbooking'), disabled: false },
			months: { label: __('Month', 'quillbooking'), disabled: false },
		};

		// Availability state
		const [availabilityType, setAvailabilityType] = useState<
			'existing' | 'custom'
		>('existing');
		const [reservetimes, setReservetimes] = useState<boolean>(false);
		const [availability, setAvailability] =
			useState<Availability>(customAvailability);
		const [range, setRange] = useState<AvailabilityRange>({
			type: 'days',
			days: 5,
		});
		const [dateOverrides, setDateOverrides] = useState<DateOverrides>({});

		// Limits state
		const [bookingDurationOptions, setBookingDurationOptions] =
			useState<UnitOptionsType>(UnitOptions);
		const [bookingFrequencyOptions, setBookingFrequencyOptions] =
			useState<UnitOptionsType>(UnitOptions);
		const [limits, setLimits] = useState<EventLimitsType | null>(null);

		const { state: event } = useEventContext();
		const { callApi } = useApi();
		const { errorNotice } = useNotice();

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
					errorNotice(error.message);
				},
			});
		};

		useEffect(() => {
			if (!event) {
				return;
			}

			fetchLimits();
			setReservetimes(event.reserve);
		}, [event]);

		useImperativeHandle(ref, () => ({
			saveSettings: async () => {
				saveEventDetails();
			},
		}));

		const saveEventDetails = () => {
			callApi({
				path: `events/${event?.id}`,
				method: 'PUT',
				data: {
					availability: {
						...availability,
						type: availabilityType,
						override: dateOverrides,
					},
					limits,
					event_range: range,
					reserve_times: reservetimes,
				},
				onSuccess() {
					props.setDisabled(true);
				},
				onError(error) {
					errorNotice(error.message);
				},
			});
		};
		return (
			<div className="grid grid-cols-2 gap-5 px-9">
				<AvailabilitySection
					availability={availability}
					availabilityType={availabilityType}
					customAvailability={customAvailability}
					dateOverrides={dateOverrides}
					range={range}
					setAvailability={setAvailability}
					setAvailabilityType={setAvailabilityType}
					setDateOverrides={setDateOverrides}
					setRange={setRange}
					setReservetimes={setReservetimes}
					reservetimes={reservetimes}
					setDisabled={props.setDisabled}
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
