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
import { useApi, useNotice } from '@quillbooking/hooks';
import {
	Availability,
	AvailabilityRange,
	CustomAvailability,
	DateOverrides,
	Host,
	TimeSlot,
} from 'client/types';
import { useEventContext } from '../../../state/context';
import AvailabilityType from './availability-type';
import SelectSchedule from './select-schedule';

interface AvailabilitySectionProps {
	availabilityType: 'existing' | 'custom';
	setAvailabilityType: (type: 'existing' | 'custom') => void;
	customAvailability: Availability | CustomAvailability;
	setAvailability: (availability: Availability | CustomAvailability) => void;
	setReservetimes: (value: boolean) => void;
	setRange: (range: AvailabilityRange) => void;
	setDateOverrides: (overrides: DateOverrides) => void;
	availability: Availability | CustomAvailability;
	range: AvailabilityRange;
	dateOverrides: DateOverrides;
	reservetimes: boolean;
	setDisabled: (value: boolean) => void;
	setCommonSchedule: (value: boolean) => void;
	commonSchedule: boolean;
}
const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({
	availabilityType,
	setAvailabilityType,
	customAvailability,
	setAvailability,
	setReservetimes,
	setRange,
	setDateOverrides,
	availability,
	range,
	dateOverrides,
	reservetimes,
	setDisabled,
	setCommonSchedule,
	commonSchedule,
	teamAvailability,
	setTeamAvailability,
}) => {
	const [lastAvailability, setLastAvailability] = useState<
		Availability | CustomAvailability
	>(customAvailability);
	const storedAvailabilities = ConfigAPI.getAvailabilities();
	const { state: event } = useEventContext();
	const { callApi, loading } = useApi();
	const { errorNotice } = useNotice();
	const [selectedCard, setSelectedCard] = useState<number | null>(null);
	// const [isCustomAvailability, setIsCustomAvailability] = useState(false);

	const fetchAvailability = () => {
		if (!event) return;

		callApi({
			path: `events/${event.id}/availability`,
			method: 'GET',
			onSuccess(response: {
				availability: Availability | CustomAvailability;
				range: AvailabilityRange;
			}) {
				setCommonSchedule(
					!!(
						event?.calendar.type === 'team' &&
						response.availability.is_common
					)
				);
				setAvailabilityType(
					response.availability.type === 'custom'
						? 'custom'
						: 'existing'
				);

				if (
					event?.calendar.type === 'team' &&
					response.availability.is_common
				) {
					const teamAvailabilityMap = {};
					event.hosts?.forEach((host) => {
						const defaultAvailability = Object.values(
							storedAvailabilities
						).find((a) => a.user_id === host.id && a.is_default);
						if (defaultAvailability) {
							teamAvailabilityMap[host.id] = defaultAvailability;
						}
					});

					setTeamAvailability(teamAvailabilityMap);
				}

				if (
					event?.calendar.type === 'team' &&
					!response.availability.is_common
				) {
					setSelectedCard(event.hosts?.[0]?.id ?? null);

					setAvailability(
						response.availability.users_availability[1]
					);
					setLastAvailability(
						response.availability.users_availability[1]
					);
					setTeamAvailability(
						response.availability.users_availability
					);
				} else {
					setAvailability(response.availability);
					setLastAvailability(response.availability);
					setDateOverrides(response.availability.override ?? {});
				}
				setRange(response.range);
			},
			onError(error) {
				errorNotice(error.message);
			},
		});
	};

	const handleToggle = (value: boolean) => {
		setReservetimes(value);
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

	const onCustomAvailabilityChange = (day, field, value) => {
		setDisabled(false);
		const updatedAvailability = { ...availability };
		if (field === 'off') {
			updatedAvailability.weekly_hours[day].off = value;
		} else {
			updatedAvailability.weekly_hours[day].times = value;
		}
		setAvailability(updatedAvailability);
	};

	const onTeamAvailabilityChange = (day, field, value) => {
		setDisabled(false);

		const updatedAvailability = { ...availability };
		if (field === 'off') {
			updatedAvailability.weekly_hours[day].off = value;
		} else {
			updatedAvailability.weekly_hours[day].times = value;
		}
		setAvailability(updatedAvailability);

		setTeamAvailability((prev) => {
			const updatedTeamAvailability = { ...prev };
			updatedTeamAvailability[selectedCard] = updatedAvailability;
			return updatedTeamAvailability;
		});

		console.log('asdfasdf', teamAvailability);
	};

	const onAvailabilityChange = (id) => {
		setDisabled(false);
		const selected = Object.values(storedAvailabilities).find(
			(a) => a.id === id
		);
		if (selected) {
			setAvailability(selected);
			setDateOverrides(selected.override);
			setLastAvailability(selected);
		}
	};
	useEffect(fetchAvailability, [event]);

	const onAvailabilityTypeChange = (value) => {
		setAvailabilityType(value);
		if (value === 'custom') {
			const source =
				event?.availability_data?.type === 'custom'
					? event?.availability_data
					: customAvailability;
			const override =
				event?.availability_data?.type === 'custom'
					? event?.availability_data.override
					: {};

			setAvailability(source);
			setDateOverrides(override);
		} else {
			const existing = event?.hosts?.[0]?.availabilities
				? Object.values(event.hosts[0].availabilities)[0]
				: lastAvailability;

			setAvailability(existing);
			setDateOverrides(existing.override);
		}
		setDisabled(false);
	};

	const handleCardChange = (id: number) => {
		setDisabled(false);
		setSelectedCard(id);
		const selected = Object.values(
			event?.availability_data.users_availability
		).find((a) => a.user_id === id);
		console.log('selected', selected);
		if (selected) {
			setAvailability(selected);
			setDateOverrides(selected.override);
			setLastAvailability(selected);
		}
	};

	if (loading) {
		return (
			<Card className="rounded-lg">
				<div className="animate-pulse">
					{/* Header shimmer */}
					<Flex gap={12} className="items-center mb-6">
						<div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
						<Flex vertical gap={2}>
							<div className="h-5 bg-gray-200 rounded w-32"></div>
							<div className="h-4 bg-gray-200 rounded w-64"></div>
						</Flex>
					</Flex>

					{/* Team toggle shimmer */}
					<Flex className="items-center justify-between mb-6">
						<Flex vertical gap={2}>
							<div className="h-5 bg-gray-200 rounded w-48"></div>
							<div className="h-4 bg-gray-200 rounded w-96"></div>
						</Flex>
						<div className="w-12 h-6 bg-gray-200 rounded-full"></div>
					</Flex>

					{/* Schedule blocks shimmer */}
					<div className="space-y-4 mb-6">
						{[...Array(7)].map((_, index) => (
							<Flex key={index} className="items-center gap-4">
								<div className="w-24 h-6 bg-gray-200 rounded"></div>
								<div className="flex-1 h-12 bg-gray-200 rounded"></div>
							</Flex>
						))}
					</div>

					{/* Range section shimmer */}
					<div className="space-y-4 mb-6">
						<div className="h-6 bg-gray-200 rounded w-40"></div>
						<div className="h-12 bg-gray-200 rounded"></div>
					</div>

					{/* Reserve times section shimmer */}
					<Flex className="items-center justify-between">
						<Flex vertical gap={2}>
							<div className="h-5 bg-gray-200 rounded w-36"></div>
							<div className="h-4 bg-gray-200 rounded w-80"></div>
						</Flex>
						<div className="w-12 h-6 bg-gray-200 rounded-full"></div>
					</Flex>
				</div>
			</Card>
		);
	}
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

			{event?.calendar.type === 'team' && (
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
						checked={commonSchedule}
						onChange={(value) => {
							setDisabled(false);
							setCommonSchedule(value);
						}}
						className={
							commonSchedule ? 'bg-color-primary' : 'bg-gray-400'
						}
					/>
				</Flex>
			)}

			{event?.calendar.type === 'team' && !commonSchedule && (
				<Flex vertical gap={10} className="mt-4">
					<div className="text-[#09090B] text-[16px]">
						{__('Add Availability Per Users', 'quillbooking')}
						<span className="text-red-500">*</span>
					</div>
					<Flex gap={20} wrap>
						{event?.hosts?.map((host) => (
							<Card
								key={host.id}
								onClick={() => handleCardChange(host.id)}
								className={`cursor-pointer transition-all rounded-lg border w-[200px] h-[93px] ${
									selectedCard === host.id
										? 'border-color-primary bg-color-secondary'
										: ''
								}`}
							>
								<img
									src={host.image}
									alt="admin.png"
									className="size-8 rounded-lg"
								/>
								<div className="text-[#1E2125] font-[700] pt-1">
									{host.name}
								</div>
							</Card>
						))}
					</Flex>
				</Flex>
			)}

			{(commonSchedule || event?.calendar.type === 'host') && (
				<AvailabilityType
					availabilityType={availabilityType}
					handleAvailabilityTypeChange={onAvailabilityTypeChange}
				/>
			)}

			{availabilityType === 'existing' &&
				(event?.calendar.type == 'host' || commonSchedule) && (
					<>
						<SelectSchedule
							availability={availability as Availability}
							hosts={event?.hosts || []}
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

			{event?.calendar.type == 'team' && !commonSchedule && (
				<>
					<SelectSchedule
						availability={availability as Availability}
						hosts={[event?.hosts?.[selectedCard! - 1]].filter(
							(h): h is Host => h !== undefined
						)}
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

			{event?.calendar.type == 'team' && !commonSchedule ? (
				<Card className="mt-4 pt-4">
					<Schedule
						availability={availability}
						onCustomAvailabilityChange={onTeamAvailabilityChange}
					/>
				</Card>
			) : (
				<Card className="mt-4 pt-4">
					<Schedule
						availability={availability}
						onCustomAvailabilityChange={onCustomAvailabilityChange}
					/>
				</Card>
			)}
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

			{/* <Card className="mt-6">
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
			</Card> */}
		</Card>
	);
};

export default AvailabilitySection;
