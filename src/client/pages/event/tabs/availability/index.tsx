/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Button } from 'antd';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type {
	Availability,
	AvailabilityRange,
	TimeSlot,
	DateOverrides,
} from '@quillbooking/client';
import ConfigAPI from '@quillbooking/config';
import { useApi, useNotice } from '@quillbooking/hooks';
import { useEventContext } from '../../state/context';
import { RangeSection, AvailabilitySection } from './sections';
import EventLimits from '../limits';


const AvailabilityTab: React.FC = () => {
	const [range, setRange] = useState<AvailabilityRange | null>(null);
	const [availability, setAvailability] = useState<Availability | null>(null);
	const [lastAvailability, setLastAvailability] = useState<Availability | null>(null);
	const storedAvailabilities = ConfigAPI.getAvailabilities();
	const [isCustomAvailability, setIsCustomAvailability] = useState(false);
	const [dateOverrides, setDateOverrides] = useState<DateOverrides | null>(
		null
	);

	const { state: event } = useEventContext();
	const { callApi, loading } = useApi();
	const { successNotice, errorNotice } = useNotice();

	// State for the date override modal
	const [isOverrideModalVisible, setIsOverrideModalVisible] = useState(false);

	// Fetch availability data
	const fetchAvailability = () => {
		if (!event) return;

		callApi({
			path: `events/${event.id}/availability`,
			method: 'GET',
			onSuccess(response: {
				availability: Availability;
				range: AvailabilityRange;
			}) {
				setAvailability(response.availability);
				setLastAvailability(response.availability);
				setRange(response.range);
				setDateOverrides(response.availability.override);
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	useEffect(fetchAvailability, [event]);

	// Handle saving changes
	const handleSave = () => {
		if (!event) return;

		const updatedAvailability = {
			...availability,
			override: dateOverrides,
		};
		console.log(updatedAvailability);

		callApi({
			path: `events/${event.id}`,
			method: 'POST',
			data: {
				availability: updatedAvailability,
			},
			onSuccess() {
				successNotice(__('Settings saved successfully', 'quillbooking'));
			},
			onError(error) {
				errorNotice(error.message);
			},
		});

	};


	if (loading || !availability || !range) {
		return <Card loading />;
	}

	return (
		<div className='grid grid-cols-2 gap-5 px-9'>
			{/* Availability Range Section */}
			{/* <RangeSection
				range={range}
				onRangeTypeChange={(type) => {
					setRange({
						type,
						days: type === 'days' ? 90 : undefined,
						start_date:
							type === 'date_range'
								? dayjs().format('YYYY-MM-DD')
								: undefined,
						end_date:
							type === 'date_range'
								? dayjs()
									.add(90, 'days')
									.format('YYYY-MM-DD')
								: undefined,
					});
				}}
				onDaysChange={(days) => setRange({ ...range, days })}
				onDateRangeChange={(start_date, end_date) =>
					setRange({ ...range, start_date, end_date })
				}
			/> */}
			{/* Custom or Existing Availability Section */}
			<AvailabilitySection
				isCustomAvailability={isCustomAvailability}
				availability={availability}
				storedAvailabilities={storedAvailabilities}
				onAvailabilityChange={(id) => {
					const selected = storedAvailabilities.find(
						(a) => a.id === id
					);
					if (selected) {
						setAvailability(selected);
						setDateOverrides(selected.override);
						setIsCustomAvailability(false);
						setLastAvailability(selected);
					}
				}}
				onCustomAvailabilityChange={(day, field, value) => {
					const updatedAvailability = { ...availability };
					if (field === 'off') {
						updatedAvailability.weekly_hours[day].off =
							value;
					} else {
						updatedAvailability.weekly_hours[day].times =
							value;
					}
					setAvailability(updatedAvailability);
				}}
				onToggleCustomAvailability={() =>
					setIsCustomAvailability(!isCustomAvailability)
				}
				range={range}
				onRangeTypeChange={(type) => {
					setRange({
						type,
						days: type === 'days' ? (range.days ? range.days : 60) : undefined,
						start_date:
							type === 'date_range'
								?
								(range.start_date ? range.start_date : dayjs().format('YYYY-MM-DD'))
								: undefined,
						end_date:
							type === 'date_range'
								?
								(range.end_date ? range.end_date : dayjs()
									.add(90, 'days')
									.format('YYYY-MM-DD'))
								: undefined,
					});
				}}
				onDaysChange={(days) => setRange({ ...range, days })}
				onDateRangeChange={(start_date, end_date) =>
					setRange({ ...range, start_date, end_date })
				}
				dateOverrides={dateOverrides}
				lastPickedAvailability={lastAvailability}
				setAvailability={setAvailability}
				setDateOverrides={setDateOverrides}
			/>

			<EventLimits />

		</div>
	);
};

export default AvailabilityTab;
