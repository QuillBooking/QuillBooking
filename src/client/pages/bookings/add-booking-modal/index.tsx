/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Button,
	Checkbox,
	DatePicker,
	Flex,
	Form,
	Input,
	Modal,
	Select,
} from 'antd';
import { Dayjs } from 'dayjs';

/**
 * Internal dependencies
 */
import {
	AddCalendarOutlinedIcon,
	TimezoneSelect,
} from '@quillbooking/components';
import {
	fetchAjax,
	get_location,
	getCurrentTimezone,
	getFields,
} from '@quillbooking/utils';
import {
	Booking,
	Calendar,
	Event,
	EventAvailability,
	Fields,
} from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import { CurrentTimeInTimezone } from '@quillbooking/components';
import QuestionsComponents from './questions';

interface AddBookingModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	booking?: Booking;
}

/**
 * Add Booking Modal Component
 */

const { Option } = Select;

const AddBookingModal: React.FC<AddBookingModalProps> = ({
	open,
	onClose,
	onSaved,
	booking,
}) => {
	const [form] = Form.useForm();
	const [currentTimezone, setCurrentTimezone] = useState<string | null>(
		getCurrentTimezone()
	);
	const [calendars, setCalendars] = useState<Calendar[]>([]);
	const [allTimeSlots, setAllTimeSlots] = useState<string[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [selectedAvailability, setSelectedAvailability] =
		useState<EventAvailability>();
	const [timeOptions, setTimeOptions] = useState<
		{ time: string; slot: any }[]
	>([]);
	const [showAllTimes, setShowAllTimes] = useState<boolean>(false);
	const [ignoreAvailability, setIgnoreAvailability] =
		useState<boolean>(false);
	const [fields, setFields] = useState<Fields>();
	const [isMultipleDuration, setIsMultipleDuration] =
		useState<boolean>(false);
	const [defaultDuration, setDefaultDuration] = useState<number | null>(null);
	const [selectedTimeSlotHostsIds, setSelectedTimeSlotHostsIds] = useState<
		number[]
	>([]);

	const { callApi, loading } = useApi();
	const { errorNotice } = useNotice();

	const fetchCalendar = () => {
		callApi({
			path: 'calendars',
			method: 'GET',
			onSuccess: (res) => {
				setCalendars(res.data);
			},
			onError: () => {
				errorNotice('error fetching calendars');
			},
		});
	};

	const handleEventChange = (value: number) => {
		callApi({
			path: `events/${value}`,
			method: 'GET',
			onSuccess: (event: Event) => {
				setSelectedEvent(event);
				form.setFieldsValue({
					location: event.location[0]?.type || '',
				});
				form.resetFields(['selectDate', 'selectTime']);
				setTimeOptions([]);
				fetchAvailability(event.id);
				fetchFields(event.id);
				setIsMultipleDuration(
					event.additional_settings.allow_attendees_to_select_duration
				);
				if (
					event.additional_settings.allow_attendees_to_select_duration
				) {
					setDefaultDuration(
						event.additional_settings.default_duration
					);
					form.setFieldsValue({
						duration: event.additional_settings.default_duration,
					});
				} else {
					setDefaultDuration(event.duration);
					form.setFieldsValue({
						duration: event.duration,
					});
				}
			},
			onError: (error) => {
				const errorMessage =
					error?.message ||
					__('Error fetching event details', 'quillbooking');
				errorNotice(errorMessage);
				setSelectedEvent(null);
				form.resetFields([
					'selectDate',
					'selectTime',
					'duration',
					'location',
				]);
				setTimeOptions([]);
			},
		});
	};

	const fetchFields = (eventId: number) => {
		callApi({
			path: `events/${eventId}/fields`,
			method: 'GET',
			onSuccess: (res) => {
				setFields(res);
			},
			onError: () => {
				errorNotice('error fetching fields');
			},
		});
	};

	const fetchAvailability = (value: number, user_id?: number) => {
		const formData = new FormData();
		formData.append('action', 'quillbooking_booking_slots');
		formData.append('id', value.toString());
		formData.append('timezone', currentTimezone || '');
		formData.append('start_date', new Date().toISOString());
		formData.append('duration', defaultDuration?.toString() || '30');
		formData.append('user_id', user_id?.toString() ?? '');

		fetchAjax('admin-ajax.php', {
			method: 'POST',
			body: formData,
		})
			.then((res) => {
				setSelectedAvailability(res.data.slots);
			})
			.catch(() => {
				errorNotice('error fetching availability');
			});
	};

	const disabledDate = (current: Dayjs): boolean => {
		if (showAllTimes) {
			return false;
		}
		if (!selectedAvailability) {
			return true;
		}
		return selectedAvailability[current.format('YYYY-MM-DD')] === undefined;
	};

	const generateTimeSlots = (date: Dayjs): { time: string; slot: any }[] => {
		if (showAllTimes) {
			return allTimeSlots.map((time) => ({ time, slot: null }));
		}
		return selectedAvailability
			? selectedAvailability[date.format('YYYY-MM-DD')].map(
					(slot: {
						start: string;
						end: string;
						hosts_ids: number[];
					}) => {
						const timeString = slot.start.split(' ')[1];
						const time = timeString.split(':');
						return {
							time: `${time[0]}:${time[1]}`,
							slot,
						};
					}
				)
			: [];
	};

	const handleDateChange = (date: Dayjs | null) => {
		setTimeOptions(date ? generateTimeSlots(date) : []);
		form.setFieldsValue({ selectTime: null });
		setSelectedTimeSlotHostsIds([]);
	};

	const handleTimeChange = (selectedTime: string) => {
		const selectedTimeOption = timeOptions.find(
			(option) => option.time === selectedTime
		);
		if (selectedTimeOption && selectedTimeOption.slot) {
			setSelectedTimeSlotHostsIds(
				selectedTimeOption.slot.hosts_ids || []
			);
		} else {
			setSelectedTimeSlotHostsIds([]);
		}
	};

	const handleSubmit = async (values: any) => {
		const {
			selectDate,
			selectTime,
			event,
			duration,
			name,
			email,
			status,
			hosts,
		} = values;

		const fields = getFields(values);
		const location = form.getFieldValue('location');
		const location_data = form.getFieldValue('location-data');
		const locationField = get_location(
			selectedEvent?.location || [],
			location,
			location_data
		);
		const startDateTime =
			selectDate.clone().format('YYYY-MM-DD') + ` ${selectTime}:00`;

		// Use selected host user_id if available, otherwise use hosts_ids from time slot
		const hostsToSend = hosts ? [hosts] : selectedTimeSlotHostsIds;

		try {
			await form.validateFields();
			await callApi({
				path: 'bookings',
				method: 'POST',
				data: {
					event_id: event,
					start_date: startDateTime,
					slot_time: duration,
					timezone: currentTimezone,
					fields,
					name,
					email,
					status,
					ignore_availability: ignoreAvailability,
					location: locationField,
					hosts_ids: hostsToSend,
				},
				onSuccess: () => {
					onSaved();
					onClose();
				},
				onError: () => {
					errorNotice('error adding booking');
				},
			});
		} catch (error) {
			errorNotice('Validation failed');
		}
	};

	useEffect(() => {
		if (!open) {
			form.resetFields();
			setSelectedEvent(null);
			setSelectedAvailability(undefined);
			setTimeOptions([]);
			setSelectedTimeSlotHostsIds([]);
		}
	}, [open, form]);

	useEffect(() => {
		fetchCalendar();
		if (booking) {
			handleEventChange(booking.event.id);
			setCurrentTimezone(booking.timezone);
			form.setFieldsValue({
				name: Array.isArray(booking.guest)
					? booking.guest[0]?.name
					: booking.guest?.name,
				email: Array.isArray(booking.guest)
					? booking.guest[0]?.email
					: booking.guest?.email,
				status: booking.status,
				timezone: booking.timezone,
			});
		}
	}, []);

	useEffect(() => {
		if (selectedEvent) {
			form.resetFields(['selectDate', 'selectTime']);
			setTimeOptions([]);
			setSelectedTimeSlotHostsIds([]);
			fetchAvailability(selectedEvent.id);
		}
	}, [currentTimezone]);

	useEffect(() => {
		if (ignoreAvailability && defaultDuration) {
			const duration = defaultDuration;
			const slots: string[] = [];
			for (
				let minutes = 0;
				minutes < 24 * 60;
				minutes += Number(duration)
			) {
				const hours = Math.floor(minutes / 60);
				const mins = minutes % 60;
				slots.push(
					`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
				);
			}
			setAllTimeSlots(slots);
		}
	}, [ignoreAvailability, defaultDuration]);

	useEffect(() => {
		fetchAvailability(selectedEvent?.id || 0);
		form.resetFields(['selectDate', 'selectTime']);
		setSelectedTimeSlotHostsIds([]);
	}, [defaultDuration]);

	return (
		<Modal
			getContainer={false}
			title={
				<div className="flex gap-4 items-center">
					<div className="rounded-lg p-2 bg-[#EDEDED] text-color-primary-text">
						<AddCalendarOutlinedIcon width={30} height={30} />
					</div>
					<div>
						<p className="text-2xl">
							{__('Add New Booking Manually', 'quillbooking')}
						</p>
						<p className="text-sm text-[#979797] font-thin">
							{__(
								'Add the following data to Add New Calendar Host.',
								'quillbooking'
							)}
						</p>
					</div>
				</div>
			}
			open={open}
			onCancel={onClose}
			width={950}
			footer={[
				<Button
					className="bg-color-primary text-white text-center w-full"
					loading={loading}
					size="large"
					key="submit"
					type="primary"
					onClick={form.submit}
				>
					{__('Create Booking', 'quillbooking')}
				</Button>,
			]}
		>
			<Form
				layout="vertical"
				form={form}
				initialValues={{
					status: 'scheduled',
					timezone: currentTimezone,
				}}
				onFinish={handleSubmit}
			>
				<Flex gap={20}>
					<Form.Item
						name="event"
						label={__('Select Event', 'quillbooking')}
						rules={[{ required: true }]}
						className="flex-1"
					>
						<Select
							placeholder={__('Select Event', 'quillbooking')}
							showSearch
							size="large"
							getPopupContainer={(trigger) =>
								trigger.parentElement
							}
							filterOption={(input, option) =>
								(typeof option?.children === 'string'
									? (option.children as string).toLowerCase()
									: ''
								).includes(input.toLowerCase())
							}
							onChange={(eventId: number) =>
								handleEventChange(eventId)
							}
						>
							{calendars.map((calendar) =>
								calendar.events.length > 0 ? (
									<Select.OptGroup
										label={calendar.name}
										key={calendar.name}
									>
										{calendar.events
											.filter(
												(event) => !event.is_disabled
											)
											.map((event) => (
												<Option
													value={event.id}
													key={event.id}
												>
													{event.name}
												</Option>
											))}
									</Select.OptGroup>
								) : null
							)}
						</Select>
					</Form.Item>

					{selectedEvent &&
						selectedEvent?.calendar.type != 'host' &&
						selectedEvent?.type != 'collective' && (
							<Form.Item
								name="hosts"
								label={
									<div>
										{__('Select Host', 'quillbooking')}{' '}
										<span className="text-[10px] text-[#949494]">
											{__(
												'(If not selected, the system will select one based on their availability)',
												'quillbooking'
											)}
										</span>
									</div>
								}
								className="flex-1"
							>
								<Select
									placeholder={__(
										'Select Host',
										'quillbooking'
									)}
									showSearch
									getPopupContainer={(trigger) =>
										trigger.parentElement
									}
									size="large"
									filterOption={(input, option) =>
										(typeof option?.children === 'string'
											? (
													option.children as string
												).toLowerCase()
											: ''
										).includes(input.toLowerCase())
									}
									onChange={(user_id: number) =>
										fetchAvailability(
											selectedEvent.id,
											user_id
										)
									}
								>
									{selectedEvent.hosts &&
										selectedEvent.hosts.map((host) => (
											<Option
												value={host.id}
												key={host.id}
											>
												{host.name}
											</Option>
										))}
								</Select>
							</Form.Item>
						)}
				</Flex>

				<Flex gap={20}>
					{currentTimezone && (
						<Form.Item
							name="timezone"
							className="flex-1 mb-1"
							label={__("Attendee's Timezone", 'quillbooking')}
							rules={[{ required: true }]}
						>
							<TimezoneSelect
								value={currentTimezone}
								onChange={setCurrentTimezone}
							/>
							<CurrentTimeInTimezone
								currentTimezone={currentTimezone}
								className="text-[#949494] text-[12px] mt-1"
							/>
						</Form.Item>
					)}
					<Form.Item
						name="duration"
						className="flex-1 mb-1"
						label={__('Meeting Duration', 'quillbooking')}
						rules={[{ required: true }]}
					>
						<Select
							placeholder={__('Select Duration', 'quillbooking')}
							disabled={!selectedEvent}
							size="large"
							getPopupContainer={(trigger) =>
								trigger.parentElement
							}
							onChange={(value) => {
								setDefaultDuration(value);
							}}
						>
							{selectedEvent ? (
								isMultipleDuration ? (
									selectedEvent?.additional_settings.selectable_durations.map(
										(duration) => (
											<Option
												key={duration}
												value={duration}
											>
												{duration}{' '}
												{__('minutes', 'quillbooking')}
											</Option>
										)
									)
								) : (
									<Option value={selectedEvent.duration}>
										{selectedEvent.duration}{' '}
										{__('minutes', 'quillbooking')}
									</Option>
								)
							) : null}
						</Select>
					</Form.Item>
				</Flex>

				{booking?.event.id && (
					<Form.Item
						name="event"
						initialValue={booking.event.id}
						hidden
					>
						<Input type="hidden" />
					</Form.Item>
				)}

				<Form.Item name="ignoreAvailability">
					<Checkbox
						checked={showAllTimes}
						disabled={!selectedEvent}
						onChange={(e) => {
							setShowAllTimes(e.target.checked);
							setIgnoreAvailability(e.target.checked);
							form.resetFields(['selectDate', 'selectTime']);
							setTimeOptions([]);
							if (form.getFieldValue('selectDate')) {
								setTimeOptions(
									generateTimeSlots(
										form.getFieldValue('selectDate')
									)
								);
							}
						}}
					>
						{__('Ignore Availability', 'quillbooking')}
					</Checkbox>
				</Form.Item>

				<Flex gap={20}>
					<Form.Item
						className="flex-1"
						name="selectDate"
						label={__('Select Date', 'quillbooking')}
						rules={[{ required: true }]}
					>
						<DatePicker
							className="w-full"
							size="large"
							disabled={!selectedEvent}
							disabledDate={disabledDate}
							onChange={handleDateChange}
							getPopupContainer={(trigger) =>
								trigger.parentElement || document.body
							}
						/>
					</Form.Item>
					<Form.Item
						className="flex-1"
						name="selectTime"
						label={__('Select Time', 'quillbooking')}
						rules={[{ required: true }]}
					>
						<Select
							size="large"
							disabled={!form.getFieldValue('selectDate')}
							placeholder={__('Select Time', 'quillbooking')}
							getPopupContainer={(trigger) =>
								trigger.parentElement
							}
							onChange={handleTimeChange}
						>
							{timeOptions.map((timeOption) => (
								<Select.Option
									key={timeOption.time}
									value={timeOption.time}
								>
									{timeOption.time}
								</Select.Option>
							))}
						</Select>
					</Form.Item>
				</Flex>

				<Form.Item
					name="status"
					label={__('Status', 'quillbooking')}
					rules={[{ required: true }]}
				>
					<Select
						disabled={!selectedEvent}
						size="large"
						getPopupContainer={(trigger) => trigger.parentElement}
					>
						<Option value="scheduled">
							{__('Scheduled', 'quillbooking')}
						</Option>
						<Option value="pending">
							{__('Pending', 'quillbooking')}
						</Option>
						<Option value="completed">
							{__('Completed', 'quillbooking')}
						</Option>
					</Select>
				</Form.Item>

				<Flex gap={20}>
					<Form.Item
						className="flex-1"
						name="name"
						label={__("Attendee's Name", 'quillbooking')}
						rules={[{ required: true }]}
					>
						<Input
							size="large"
							placeholder={__(
								"Type the attendee's name",
								'quillbooking'
							)}
						/>
					</Form.Item>

					<Form.Item
						className="flex-1"
						name="email"
						rules={[{ required: true }]}
						label={__("Attendee's Gmail", 'quillbooking')}
					>
						<Input
							size="large"
							placeholder={__(
								"Type the attendee's gmail",
								'quillbooking'
							)}
						/>
					</Form.Item>
				</Flex>
				{fields && <QuestionsComponents fields={fields} />}
			</Form>
		</Modal>
	);
};

export default AddBookingModal;
