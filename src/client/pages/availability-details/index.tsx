/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';

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
// import './style.scss';
import {
	getToLink,
	NavLink as Link,
	useNavigate,
	useParams,
} from '@quillbooking/navigation';
import { useApi, useNotice } from '@quillbooking/hooks';
import type {
	Availability,
	TimeSlot,
	DateOverrides,
} from '@quillbooking/client';
import { TimezoneSelect } from '@quillbooking/components';
import OverridesSection from '../../../components/override-section';
import OverrideModal from '../../../components/override-modal';

/**
 * Main Calendars Component.
 */
const { Title, Text } = Typography;

const AvailabilityDetails: React.FC = () => {
	const [availabilityDetails, setAvailabilityDetails] = useState<
		Partial<Availability>
	>({
		weekly_hours: {},
		name: '',
	});
	const [availabilityName, setAvailabilityName] = useState('');
	const [availabilityTimezone, setAvailabilityTimezone] = useState('');
	const [isDefault, setIsDefault] = useState(false);
	const [dateOverrides, setDateOverrides] = useState<DateOverrides | null>(
		null
	);

	const { callApi } = useApi();
	const { callApi: deleteApi } = useApi();
	const navigate = useNavigate();
	const { errorNotice, successNotice } = useNotice();

	const { id: availabilityId } = useParams();
	if (!availabilityId) return null;

	// State for the date override modal
	const [isOverrideModalVisible, setIsOverrideModalVisible] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [overrideTimes, setOverrideTimes] = useState<TimeSlot[]>([]);
	const [isUnavailable, setIsUnavailable] = useState(false);

	const fetchAvailabilityDetails = useCallback(() => {
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
				errorNotice(__('Failed to load availabilities', 'quillbooking'));
			},
		});
	}, [availabilityId, callApi, errorNotice]);

	useEffect(() => {
		fetchAvailabilityDetails();
	}, [fetchAvailabilityDetails]);

	const handleNameUpdate = useCallback(
		(val: string) => {
			callApi({
				path: `availabilities/${availabilityId}`,
				method: 'PUT',
				data: { name: val },
				onSuccess: () => {
					setAvailabilityName(val);
					successNotice(__('Availability name updated successfully', 'quillbooking'));
				},
				onError: (err) => {
					errorNotice(`Failed to update schedule name ${err.message}`);
				},
			});
		},
		[availabilityId, callApi, errorNotice, successNotice]
	);

// Update the entire availability.
	const handleAvailabilityUpdate = useCallback(() => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				weekly_hours: availabilityDetails.weekly_hours,
				override: dateOverrides,
				timezone: availabilityTimezone,
			},
			onSuccess: () => {
				successNotice(__('Availability updated successfully', 'quillbooking'));
			},
		});
	}, [
		availabilityId,
		availabilityDetails.weekly_hours,
		dateOverrides,
		availabilityTimezone,
		callApi,
		successNotice,
	]);

	// Update weekly hours.
	const onCustomAvailabilityChange = useCallback(
		(day, field, value) => {
			const updatedAvailability = { ...availabilityDetails };
			if (updatedAvailability.weekly_hours) {
				if (field === 'off') {
					updatedAvailability.weekly_hours[day].off = value;
				} else {
					updatedAvailability.weekly_hours[day].times = value;
				}
			}
			setAvailabilityDetails(updatedAvailability);
		},
		[availabilityDetails]
	);

	// Open the date override modal
const openOverrideModal = useCallback(() => {
		setSelectedDate(null);
		setOverrideTimes([]);
		setIsUnavailable(false);
		setIsOverrideModalVisible(true);
	}, []);

	// Close the date override modal
	const closeOverrideModal = useCallback(() => {
		setIsOverrideModalVisible(false);
	}, []);

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

		// Delete the availability.
	const deleteAvailability = useCallback(
		async (availability: Availability) => {
			await deleteApi({
				path: `availabilities/${availability.id}`,
				method: 'DELETE',
				onSuccess: () => {
					const path = getToLink('availability');
					navigate(path);
				},
				onError: (error) => {
					errorNotice(error.message);
				},
			});
		},
		[deleteApi, navigate, errorNotice]
	);

	// Set as default calendar.
	const setDefaultCalendar = useCallback(
		async (availability: Availability) => {
			await callApi({
				path: `availabilities/${availability.id}/set-default`,
				method: 'POST',
				onSuccess: () => {
					setIsDefault(availability.is_default ?? false);
					successNotice(__('Default calendar updated', 'quillbooking'));
				},
				onError: (error) => {
					errorNotice(error.message);
				},
			});
		},
		[callApi, errorNotice, successNotice]
	);

	// Memoize the weekly hours list.
	const weeklyHoursList = useMemo(() => {
		return map(availabilityDetails.weekly_hours, (day, key) => (
			<Flex key={key} align="center" gap={10}>
				<Flex gap={10} flex={1}>
					<Checkbox
						checked={!day.off}
						onChange={(e) =>
							onCustomAvailabilityChange(key, 'off', !e.target.checked)
						}
					/>
					<Text style={{ textTransform: 'capitalize' }}>{key}</Text>
				</Flex>
				{!day.off && (
					<TimePicker.RangePicker
						value={[
							dayjs(day.times[0].start, 'HH:mm'),
							dayjs(day.times[0].end, 'HH:mm'),
						]}
						onChange={(times) => {
							if (times) {
								onCustomAvailabilityChange(key, 'times', [
									{
										start: times[0]?.format('HH:mm'),
										end: times[1]?.format('HH:mm'),
									},
								]);
							}
						}}
						format="HH:mm"
						style={{ flex: 2 }}
					/>
				)}
			</Flex>
		));
	}, [availabilityDetails.weekly_hours, onCustomAvailabilityChange]);

	return (
		<>
		<Flex justify="space-between" gap={30}>
			<Card style={{ flex: 1.5 }}>
				<Flex gap={20}>
					{isDefault && <Text strong>{__('Default Schedule', 'quillbooking')}</Text>}
				</Flex>

				<Flex justify="space-between">
					<Space>
						<Space.Compact>
							<Title
								level={5}
								editable={{
									onChange: (val) => handleNameUpdate(val),
								}}
							>
								{availabilityName}
							</Title>
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
										setDefaultCalendar(availabilityDetails as Availability)
									}
								>
									{__('Set As Default', 'quillbooking')}
								</Button>
								<Popconfirm
									title={__(
										'Are you sure to delete this calendar?',
										'quillbooking'
									)}
									onConfirm={() =>
										deleteAvailability(availabilityDetails as Availability)
									}
									okText={__('Yes', 'quillbooking')}
									cancelText={__('No', 'quillbooking')}
								>
									<Button type="text" icon={<DeleteOutlined />}>
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
				<Title level={3}>{__('Timezone:', 'quillbooking')}</Title>
				<TimezoneSelect
					value={availabilityTimezone || null}
					onChange={(value) => setAvailabilityTimezone(value)}
				/>
			</Card>
		</Flex>
		<section>
			<Title level={3}>{__('Weekly Hours', 'quillbooking')}</Title>

			<Flex justify="space-between" gap={30}>
				<div style={{ flex: 1.5 }}>
					<Card>
						<Flex vertical gap={10}>
							{weeklyHoursList}
						</Flex>
					</Card>
				</div>

				<OverridesSection
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
				onToggleUnavailable={() => setIsUnavailable((prev) => !prev)}
			/>
			<Button onClick={handleAvailabilityUpdate} style={{ margin: '2em 0', width: '100%' }}>
				{__('Update', 'quillbooking')}
			</Button>
		</section>

		<Title level={3}>{__('Usages List', 'quillbooking')}</Title>

		<Card>
			<List
				dataSource={availabilityDetails.events}
				renderItem={(event) => (
					<List.Item key={event.id}>
						<List.Item.Meta
							title={<Title level={4}>{event.event.name}</Title>}
							description={
								<Flex justify="space-between">
									<div>
										<Text>
											<span>{availabilityDetails.timezone}</span>
										</Text>
									</div>
									<Link to={`calendars/${event.event.calendar_id}/${event.event_id}`}>
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