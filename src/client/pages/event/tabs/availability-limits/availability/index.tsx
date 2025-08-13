/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Flex, Switch } from 'antd';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import {
	CalendarTickIcon,
	CardHeader,
	OverrideSection,
	Schedule,
} from '@quillbooking/components';
import { RangeSection } from './sections';
import ConfigAPI from '@quillbooking/config';
import { useApi, useEvent, useNotice } from '@quillbooking/hooks';
import {
	Availability,
	AvailabilityRange,
	CustomAvailability,
	DateOverrides,
	Host,
} from 'client/types';

// Team availability extends the base availability with users_availability
interface TeamAvailability extends Availability {
	users_availability: Record<number, Availability | CustomAvailability>;
}
import AvailabilityType from './availability-type';
import SelectSchedule from './select-schedule';
import SingleAvailability from './components/single-availability';

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
					'Control your availability nd Works time at different time of days',
					'quillbooking'
				)}
				icon={<CalendarTickIcon />}
			/>

			<SingleAvailability
				availabilityType={availabilityType}
				onAvailabilityTypeChange={onAvailabilityTypeChange}
				availability={availability}
				hosts={event.hosts || []}
				onAvailabilityChange={onAvailabilityChange}
			/>

			<Card className="mt-4 pt-4">
				<Schedule
					availability={availability.value}
					onCustomAvailabilityChange={() => {}}
					timeFormat={timeFormat}
					startDay={startDay}
				/>
			</Card>

			<div className="mt-4">
				<OverrideSection
					dateOverrides={dateOverrides}
					setDateOverrides={setDateOverrides}
					setDisabled={setDisabled}
				/>
			</div>

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
