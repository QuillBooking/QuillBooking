import { __ } from '@wordpress/i18n';
import SelectSchedule from '../../select-schedule';
import AvailabilityType from '../../availability-type';
import { Card } from 'antd';
import { OverrideSection, Schedule } from '@quillbooking/components';
import { DateOverrides } from '@quillbooking/types';

const SingleAvailability = ({
	availability,
	hosts,
	onAvailabilityChange,
	availabilityType,
	onAvailabilityTypeChange,
	timeFormat,
	startDay,
	setDisabled,
	setAvailability,
	setAvailabilityMeta,
	setEventAvailability,
	availabilityMeta,
	dateOverrides,
	setDateOverrides,
	eventAvailability,
}) => {
	const onCustomAvailabilityChange = (day, field, value) => {
		setDisabled(false);
		const updatedAvailability = { ...availability };
		if (field === 'off') {
			updatedAvailability.value.weekly_hours[day].off = value;
		} else {
			updatedAvailability.value.weekly_hours[day].times = value;
		}
		setAvailability(updatedAvailability);

		if (availabilityType === 'custom') {
			setAvailabilityMeta({
				...availabilityMeta,
				custom_availability: updatedAvailability,
			});
		}

		if (availabilityType === 'existing') {
			setEventAvailability(updatedAvailability);
		}
	};

	const updatedAvailabilities = (newOverrides: DateOverrides) => {
		if (availabilityType === 'custom') {
			setAvailabilityMeta?.({
				...availabilityMeta,
				custom_availability: {
					...availabilityMeta.custom_availability,
					value: {
						...availabilityMeta.custom_availability.value,
						override: newOverrides,
					},
				},
			});
		}

		if (availabilityType === 'existing') {
			setEventAvailability?.({
				...eventAvailability,
				value: {
					...eventAvailability.value,
					override: newOverrides,
				},
			});
		}
	};
	return (
		<>
			<AvailabilityType
				availabilityType={availabilityType}
				handleAvailabilityTypeChange={onAvailabilityTypeChange}
			/>

			{availabilityType === 'existing' && (
				<>
					<SelectSchedule
						availability={availability}
						hosts={hosts || []}
						onAvailabilityChange={onAvailabilityChange}
						title={__(
							'Which Schedule Do You Want to Use?',
							'quillbooking'
						)}
					/>
					<p className="text-[#71717A] text-[14px] py-2">
						{__(
							'Changing the availability here will affect the original availability settings. If you wish to set a separate schedule, please select the Custom Availability option.',
							'quillbooking'
						)}
					</p>
				</>
			)}

			<Card className="mt-4 pt-4">
				<Schedule
					availability={availability.value}
					onCustomAvailabilityChange={onCustomAvailabilityChange}
					timeFormat={timeFormat}
					startDay={startDay}
				/>
			</Card>

			<div className="mt-4">
				<OverrideSection
					dateOverrides={dateOverrides}
					setDateOverrides={setDateOverrides}
					setDisabled={setDisabled}
					updatedAvailabilities={updatedAvailabilities}
					timeFormat={timeFormat}
				/>
			</div>
		</>
	);
};

export default SingleAvailability;
