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
import { OverrideModal, OverrideSection } from '@quillbooking/components';
import EventLimits from '../limits';

const AvailabilityTab: React.FC = () => {
	const [range, setRange] = useState<AvailabilityRange | null>(null);
	const [availability, setAvailability] = useState<Availability | null>(null);
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
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [overrideTimes, setOverrideTimes] = useState<TimeSlot[]>([]);
	const [isUnavailable, setIsUnavailable] = useState(false);

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

	// Open the date override modal
	const openOverrideModal = () => {
		setSelectedDate(null);
		setOverrideTimes([]);
		setIsUnavailable(false);
		setIsOverrideModalVisible(true);
	};

	// Close the date override modal
	const closeOverrideModal = () => {
		setIsOverrideModalVisible(false);
	};

	// Apply the date override
	const applyOverride = () => {
		if (!selectedDate) {
			errorNotice(__('Please select a date', 'quillbooking'));
			return;
		}

		const times = isUnavailable
			? [{ start: '22:00', end: '22:00' }]
			: overrideTimes;
		const updatedOverrides = { ...dateOverrides, [selectedDate]: times };
		setDateOverrides(updatedOverrides);
		closeOverrideModal();
	};

	if (loading || !availability || !dateOverrides || !range) {
		return <Card title={__('Availability', 'quillbooking')} loading />;
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
					<EventLimits/>
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
					/>
					

					{/* Date Overrides Section */}
					{/* <OverrideSection
						dateOverrides={dateOverrides}
						onAddOverride={openOverrideModal}
						onRemoveOverride={(date) => {
							const updatedOverrides = { ...dateOverrides };
							delete updatedOverrides[date];
							setDateOverrides(updatedOverrides);
						}}
					/> */}

				{/* Save Button */}
				{/* <Button type="primary" onClick={handleSave}>
					{__('Save Changes', 'quillbooking')}
				</Button> */}

				{/* Date Override Modal */}
				{/* <OverrideModal
					isVisible={isOverrideModalVisible}
					onClose={closeOverrideModal}
					onApply={applyOverride}
					selectedDate={selectedDate}
					overrideTimes={overrideTimes}
					isUnavailable={isUnavailable}
					onDateChange={(date) => setSelectedDate(date)}
					onAddTimeSlot={() =>
						setOverrideTimes([
							...overrideTimes,
							{ start: '09:00', end: '17:00' },
						])
					}
					onRemoveTimeSlot={(index) => {
						const updatedTimes = [...overrideTimes];
						updatedTimes.splice(index, 1);
						setOverrideTimes(updatedTimes);
					}}
					onUpdateTimeSlot={(index, field, value) => {
						const updatedTimes = [...overrideTimes];
						updatedTimes[index][field] = value;
						setOverrideTimes(updatedTimes);
					}}
					onToggleUnavailable={() => setIsUnavailable(!isUnavailable)}
				/> */}
			</div>
	);
};

export default AvailabilityTab;
