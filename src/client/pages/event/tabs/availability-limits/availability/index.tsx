/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Switch } from 'antd';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { CalendarTickIcon, CardHeader } from '@quillbooking/components';
import { RangeSection } from './sections';
import { Availability, CustomAvailability } from 'client/types';

// Team availability extends the base availability with users_availability
interface TeamAvailability extends Availability {
	users_availability: Record<number, Availability | CustomAvailability>;
}
import SingleAvailability from './components/single-availability';
import TeamAvailability from './components/team-availability';

const AvailabilitySection: React.FC<any> = ({
	event,
	availability,
	availabilityMeta,
	eventAvailability,
	availabilityType,
	setAvailability,
	setAvailabilityMeta,
	setEventAvailability,
	setAvailabilityType,
	setReservetimes,
	setDisabled,
	reservetimes,
	setRange,
	range,
	dateOverrides,
	setDateOverrides,
	timeFormat,
	startDay,
	teamAvailability,
	setTeamAvailability,
	selectedUser,
	setSelectedUser,
}) => {
	const onAvailabilityChange = (id: string) => {
		setDisabled(false);

		// Find the selected availability across all hosts
		const selected = event.hosts
			.flatMap((host) => host.availabilities)
			.find((availability) => availability.id === id);

		if (selected) {
			setEventAvailability(selected);
			setAvailability(selected);
			setDateOverrides(selected.value.override || {});
		}
	};

	const onAvailabilityTypeChange = (value) => {
		setAvailabilityType(value);
		if (value === 'custom') {
			setAvailability(availabilityMeta.custom_availability);
			setDateOverrides(
				availabilityMeta.custom_availability.value.override
			);
		}
		if (value === 'existing') {
			setAvailability(eventAvailability);
			setDateOverrides(eventAvailability.value.override);
		}
		setDisabled(false);
	};

	const onRangeTypeChange = (type) => {
		setDisabled(false);
		setRange({
			type,
			days: type === 'days' ? (range.days ? range.days : 60) : undefined,
			start_date:
				type === 'date_range'
					? range.start_date
						? range.start_date
						: dayjs().format('YYYY-MM-DD')
					: undefined,
			end_date:
				type === 'date_range'
					? range.end_date
						? range.end_date
						: dayjs().add(90, 'days').format('YYYY-MM-DD')
					: undefined,
		});
	};

	const onDaysChange = (days) => {
		setDisabled(false);
		setRange({ ...range, days });
	};

	const onDateRangeChange = (start_date, end_date) => {
		setDisabled(false);
		setRange({ ...range, start_date, end_date });
	};

	const handleToggle = (value: boolean) => {
		setReservetimes(value);
		setDisabled(false);
	};
	return (
		<Card className="rounded-lg">
			<CardHeader
				title={__('Availability', 'quillbooking')}
				description={__(
					'Control your availability and work time at different time of days',
					'quillbooking'
				)}
				icon={<CalendarTickIcon />}
			/>

			{event.calendar.type === 'team' && (
				<Flex className="items-center mt-4">
					<Flex vertical gap={1}>
						<div className="text-[#09090B] text-[16px] font-semibold">
							{__('Choose a common schedule', 'quillbooking')}
						</div>
						<div className="text-[#71717A]">
							{__(
								'Enable this if you want to use a common schedule between hosts. When disabled, each host will be booked based on their default or chosen schedule.',
								'quillbooking'
							)}
						</div>
					</Flex>
					<Switch
						checked={availabilityMeta.is_common}
						onChange={(value) => {
							setDisabled(false);
							setAvailabilityMeta({
								...availabilityMeta,
								is_common: value,
							});
							if (!value) {
								setAvailability(
									teamAvailability[selectedUser.id]
								);
								setDateOverrides(
									teamAvailability[selectedUser.id]?.value
										.override || {}
								);
							}
							if (value) {
								setAvailability(eventAvailability);
								setDateOverrides(
									eventAvailability.value.override
								);
							}
						}}
						className={
							availabilityMeta.is_common
								? 'bg-color-primary'
								: 'bg-gray-400'
						}
					/>
				</Flex>
			)}

			{(event.calendar.type === 'host' ||
				(event.calendar.type === 'team' &&
					availabilityMeta.is_common)) && (
				<SingleAvailability
					availabilityType={availabilityType}
					onAvailabilityTypeChange={onAvailabilityTypeChange}
					availability={availability}
					hosts={event.hosts || []}
					onAvailabilityChange={onAvailabilityChange}
					timeFormat={timeFormat}
					startDay={startDay}
					setDisabled={setDisabled}
					setAvailability={setAvailability}
					setAvailabilityMeta={setAvailabilityMeta}
					setEventAvailability={setEventAvailability}
					availabilityMeta={availabilityMeta}
					dateOverrides={dateOverrides}
					setDateOverrides={setDateOverrides}
					eventAvailability={eventAvailability}
				/>
			)}

			{event.calendar.type === 'team' && !availabilityMeta.is_common && (
				<TeamAvailability
					availability={availability}
					event={event}
					timeFormat={timeFormat}
					startDay={startDay}
					dateOverrides={dateOverrides}
					availabilityType={availabilityType}
					availabilityMeta={availabilityMeta}
					setAvailabilityMeta={setAvailabilityMeta}
					setEventAvailability={setEventAvailability}
					setDisabled={setDisabled}
					setAvailability={setAvailability}
					setDateOverrides={setDateOverrides}
					teamAvailability={teamAvailability}
					setTeamAvailability={setTeamAvailability}
					selectedUser={selectedUser}
					setSelectedUser={setSelectedUser}
					eventAvailability={eventAvailability}
				/>
			)}

			<Card className="border-none">
				<RangeSection
					range={range}
					onRangeTypeChange={onRangeTypeChange}
					onDaysChange={onDaysChange}
					onDateRangeChange={onDateRangeChange}
				/>
			</Card>

			<Card className="mt-6">
				<Flex className="items-center">
					<Flex vertical gap={1}>
						<div className="text-[#09090B] text-[20px]">
							{__('Reserve Times', 'quillbooking')}
						</div>
						<div className="text-[#232325] text-[16px]">
							{__(
								'Enable to reserve selected times for this event only. When disabled, times remain available and may disappear if booked by others.',
								'quillbooking'
							)}
						</div>
					</Flex>
					<Switch
						checked={reservetimes}
						onChange={handleToggle}
						className={
							reservetimes ? 'bg-color-primary' : 'bg-gray-400'
						}
					/>
				</Flex>
			</Card>
		</Card>
	);
};

export default AvailabilitySection;
