/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Button,
	Flex,
	Checkbox,
	TimePicker,
	Typography,
	Card,
	Space,
	List,
	Popover,
	Popconfirm,
} from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import { NavLink as Link, useParams } from '@quillbooking/navigation';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import type {
	Availability,
	TimeSlot,
	DateOverrides,
} from '@quillbooking/client';
import { TimezoneSelect } from '@quillbooking/components';
import { OverrideSection, OverrideModal } from '@quillbooking/components';

/**
 * Main Calendars Component.
 */
const { Text,Title  } = Typography;

const AvailabilityDetails: React.FC = () => {
	const [availabilityDetails, setAvailabilityDetails] = useState<
		Partial<Availability>
	>({
		weekly_hours: {},
		name: '',
	});
	const [availabilityName, setAvailabilityName] = useState<string>('');
	const [availabilityTimezone, setAvailabilityTimezone] =
		useState<string>('');
	const [isDefault, setIsDefault] = useState<boolean>(false);
	const [dateOverrides, setDateOverrides] = useState<DateOverrides | {}>(
		{}
	);

	const { callApi } = useApi();
	const navigate = useNavigate();
	const { errorNotice, successNotice } = useNotice();

	// State for the date override modal
	const [isOverrideModalVisible, setIsOverrideModalVisible] = useState<boolean>(false);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [overrideTimes, setOverrideTimes] = useState<TimeSlot[]>([]);
	const [isUnavailable, setIsUnavailable] = useState<boolean>(false);

	const fetchAvailabilityDetails = () => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'GET',
			onSuccess: (data: Availability) => {
				setAvailabilityDetails(data);
				setAvailabilityName(data.name);
				setAvailabilityTimezone(data.timezone);
				setDateOverrides(data.override);
				setIsDefault(data.is_default ?? false);
			},
			onError: () => {
				errorNotice(
					__('Failed to load availabilities', 'quillbooking')
				);
			},
		});
	};

	useEffect(fetchAvailabilityDetails, []);
	const {id: availabilityId} = useParams<{id:string} >();
	if (!availabilityId) return null;

	const handleNameUpdate = (val: string) => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				name: val,
			},
			onSuccess: () => {
				successNotice(
					__('Availability name updated successfully', 'quillbooking')
				);
			},
			onError: () => {
				errorNotice(__('Failed to update availability name', 'quillbooking'));
			},
		});
	};

	const handleAvailabilityUpdate = () => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				weekly_hours: availabilityDetails.weekly_hours,
				override: dateOverrides,
				timezone: availabilityTimezone,
			},
			onSuccess: () => {
				successNotice(
					__('Availability updated successfully', 'quillbooking')
				);
			},
		});
	};

	const onCustomAvailabilityChange = ( day: keyof Availability['weekly_hours'],
		field: 'off' | 'times',
		value: boolean | TimeSlot[]) => {
		const updatedAvailability = { ...availabilityDetails };
		if (updatedAvailability.weekly_hours) {
			if (field === 'off' && typeof value === 'boolean') {
				updatedAvailability.weekly_hours[day].off = value;
			} else if(field === 'times' && Array.isArray(value)) {
				updatedAvailability.weekly_hours[day].times = value;
			} else {
				return;
			}
		}
		setAvailabilityDetails(updatedAvailability);
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

		if(!overrideTimes.length && !isUnavailable) {
			errorNotice(__('Please add a time slot or mark as unavailable', 'quillbooking'));
			return;
		}

		const times = isUnavailable
			? [{ start: '22:00', end: '22:00' }]
			: overrideTimes;
		const updatedOverrides = { ...dateOverrides, [selectedDate]: times };
		setDateOverrides(updatedOverrides);
		closeOverrideModal();
	};

	const deleteAvailability = async (availability: Availability) => {
		await callApi({
			path: `availabilities/${availability.id}`,
			method: 'DELETE',
			onSuccess: () => {
				navigate('availability');
				successNotice(__('Availability deleted', 'quillbooking'));
			},
			onError: () => {
				errorNotice(
					__('Failed to delete availability', 'quillbooking')
				);
			},
		});
	};

	const setDefault = async (availability: Availability) => {
		await callApi({
			path: `availabilities/${availability.id}/set-default`,
			method: 'POST',
			onSuccess: () => {
				setIsDefault(availability.is_default ?? false);
				successNotice(__('Default calendar updated', 'quillbooking'));
			},
			onError: () => {
				errorNotice(__('Failed to update default calendar', 'quillbooking'));
			},
		});
	};

	return (
		<>
			<Flex justify="space-between" gap={30}>
				<Card style={{ flex: 1.5 }}>
					<Flex gap={20}>
						{isDefault && (
							<Text type="secondary">
								{__('Default Schedule', 'quillbooking')}
							</Text>
						)}
					</Flex>

					<Flex justify="space-between">
						<Space>
							<Space.Compact>
								<Typography.Title
									level={5}
									editable={{
										onChange: (val) =>
											handleNameUpdate(val),
									}}
								>
									{availabilityName}
								</Typography.Title>
							</Space.Compact>
						</Space>

						<Popover
							trigger={['click']}
							content={
								<Flex vertical gap={10}>
									<Button
										type="text"
										icon={<SettingOutlined />}
										onClick={() =>
											setDefault(
												availabilityDetails as Availability
											)
										}
									>
										{__('Set As Defaut', 'quillbooking')}
									</Button>
									<Popconfirm
										title={__(
											'Are you sure to delete this calendar?',
											'quillbooking'
										)}
										onConfirm={() =>
											deleteAvailability(
												availabilityDetails as Availability
											)
										}
										okText={__('Yes', 'quillbooking')}
										cancelText={__('No', 'quillbooking')}
									>
										<Button
											type="text"
											icon={<DeleteOutlined />}
										>
											{__('Delete', 'quillbooking')}
										</Button>
									</Popconfirm>
								</Flex>
							}
						>
							<Button icon={<SettingOutlined />} />
						</Popover>
					</Flex>
					<Text>
						{__(
							'Edit the schedule below so that you can apply to your event/booking types',
							'quillbooking'
						)}
					</Text>
				</Card>

				<Card style={{ flex: 1 }}>
					<Title level={5}>
						{__('Timezone:', 'quillbooking')}
					</Title>
					<TimezoneSelect
						value={availabilityTimezone || null}
						onChange={(value) => setAvailabilityTimezone(value)}
					/>
				</Card>
			</Flex>
			<section>
				<Title level={5}>{__('Weekly Hours', 'quillbooking')}</Title>

				<Flex justify="space-between" gap={30}>
					<div style={{ flex: 1.5 }}>
						<Card>
							<Flex vertical gap={10}>
								{map(
									availabilityDetails.weekly_hours,
									(day, key) => (
										<Flex key={key} align="center" gap={10}>
											<Flex gap={10} flex={1}>
												<Checkbox
													checked={!day.off}
													onChange={(e) =>
														onCustomAvailabilityChange(
															key,
															'off',
															!e.target.checked
														)
													}
												/>
												<Text
													style={{
														textTransform:
															'capitalize',
													}}
												>
													{key}
												</Text>
											</Flex>
											{!day.off && (
												<TimePicker.RangePicker
													value={[
														dayjs(
															day.times[0].start,
															'HH:mm'
														),
														dayjs(
															day.times[0].end,
															'HH:mm'
														),
													]}
													onChange={(times) => {
														if (times) {
															onCustomAvailabilityChange(
																key,
																'times',
																[
																	{
																		start: times[0]?.format('HH:mm') || '',
																		end: times[1]?.format('HH:mm') || '',
																	},
																]
															);
														}
													}}
													format="HH:mm"
													style={{ flex: 2 }}
												/>
											)}
										</Flex>
									)
								)}
							</Flex>
						</Card>
					</div>

					<OverrideSection
						dateOverrides={dateOverrides || {}}
						onAddOverride={openOverrideModal}
						onRemoveOverride={(date) => {
							const updatedOverrides = { ...dateOverrides };
							delete updatedOverrides[date];
							setDateOverrides(updatedOverrides);
						}}
					/>
				</Flex>
				<OverrideModal
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
				/>
				<Button
					onClick={handleAvailabilityUpdate}
					style={{ margin: '2em 0', width: '100%' }}
				>
					{__('Update', 'quillbooking')}
				</Button>
			</section>

			<Title level={5}>{__('Usages List')}</Title>

			<Card>
				<List
					dataSource={availabilityDetails.events}
					renderItem={(event) => (
						<List.Item key={event.id}>
							<List.Item.Meta
								title={<h4>{event.event.name}</h4>}
								description={
									<Flex justify="space-between">
										<>
											<div>
												<Text>
													{availabilityDetails.timezone}
												</Text>
											</div>
										</>
										<Link
											to={`calendars/${event.event.calendar_id}/${event.event_id}`}
										>
											<Button type="primary">
												{__('View', 'quillbooking')}
											</Button>
										</Link>
									</Flex>
								}
							/>
						</List.Item>
					)}
				/>
			</Card>
		</>
	);
};

export default AvailabilityDetails;
