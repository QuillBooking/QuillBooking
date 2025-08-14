import { __ } from '@wordpress/i18n';
import { Card, Flex } from 'antd';
import SelectSchedule from '../../select-schedule';
import { Availability, DateOverrides } from '@quillbooking/types';
import { OverrideSection, Schedule } from '@quillbooking/components';

const TeamAvailability = ({
	event,
	setDisabled,
	availability,
	setAvailability,
	setDateOverrides,
	timeFormat,
	startDay,
	dateOverrides,
	availabilityType,
	availabilityMeta,
	setAvailabilityMeta,
	setEventAvailability,
	teamAvailability,
	setTeamAvailability,
	selectedUser,
	setSelectedUser,
	eventAvailability,
}: {
	event: any;
	setDisabled: (value: boolean) => void;
	setAvailability: (value: any) => void;
	setDateOverrides: (value: any) => void;
	availability: any;
	timeFormat: string;
	startDay: string;
	dateOverrides: any;
	availabilityType: 'custom' | 'existing';
	availabilityMeta: any;
	setAvailabilityMeta: (value: any) => void;
	setEventAvailability: (value: any) => void;
	teamAvailability: any;
	setTeamAvailability: (value: any) => void;
	selectedUser: any;
	setSelectedUser: (value: any) => void;
	eventAvailability: any;
}) => {
	const handleCardChange = (id: number) => {
		setDisabled(false);
		setSelectedUser(event?.hosts?.find((h) => h.id === id));
		setAvailability(teamAvailability[id]);
		setDateOverrides(teamAvailability[id].value.override || {});
	};

	const onAvailabilityChange = (availabilityId: string) => {
		setAvailabilityMeta({
			...availabilityMeta,
			hosts_schedules: {
				...availabilityMeta.hosts_schedules,
				[selectedUser.id]: availabilityId,
			},
		});

		setTeamAvailability({
			...teamAvailability,
			[selectedUser.id]:
				selectedUser.availabilities?.find(
					(availability) => availability.id === availabilityId
				) || null,
		});
		setDateOverrides(
			selectedUser.availabilities?.find(
				(availability) => availability.id === availabilityId
			)?.value.override || {}
		);
		setAvailability(
			selectedUser.availabilities?.find(
				(availability) => availability.id === availabilityId
			) || null
		);
	};

	const onCustomAvailabilityChange = (day, field, value) => {
		const updatedAvailability = { ...availability };
		if (field === 'off') {
			updatedAvailability.value.weekly_hours[day].off = value;
		} else {
			updatedAvailability.value.weekly_hours[day].times = value;
		}

		setTeamAvailability({
			...teamAvailability,
			[selectedUser.id]: updatedAvailability,
		});
		setAvailability(updatedAvailability);
	};

	const updatedAvailabilities = (newOverrides: DateOverrides) => {
		if (availabilityMeta.isCommon) {
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
		} else {
			setTeamAvailability({
				...teamAvailability,
				[selectedUser.id]: {
					...teamAvailability[selectedUser.id],
					value: {
						...teamAvailability[selectedUser.id].value,
						override: newOverrides,
					},
				},
			});
		}
	};

	return (
		<>
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
								selectedUser.id === host.id
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

			<SelectSchedule
				availability={availability as Availability}
				hosts={[selectedUser]}
				onAvailabilityChange={onAvailabilityChange}
				title={__('Which Schedule Do You Want to Use?', 'quillbooking')}
			/>
			<p className="text-[#71717A] text-[14px] py-2">
				{__(
					'Changing the availability here will affect the original availability settings. If you wish to set a separate schedule, please select the Custom Availability option.',
					'quillbooking'
				)}
			</p>

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
				/>
			</div>
		</>
	);
};

export default TeamAvailability;
