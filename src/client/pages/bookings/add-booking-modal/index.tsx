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
import { fetchAjax, getCurrentTimezone, getFields } from '@quillbooking/utils';
import { Booking, Calendar, Event, EventAvailability } from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import { CurrentTimeInTimezone } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { find, map } from 'lodash';
import { DynamicFormField } from '@quillbooking/components';

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
	const [timeOptions, setTimeOptions] = useState<string[]>([]);
	const [showAllTimes, setShowAllTimes] = useState(false);
	const locationTypes = ConfigAPI.getLocations();
	const [ignoreAvailability, setIgnoreAvailability] = useState(false);

	const { callApi } = useApi();
	const { errorNotice, successNotice } = useNotice();

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
					duration: event.duration,
					location: event.location[0]?.type || '',
				});
				form.resetFields(['selectDate', 'selectTime']);
				setTimeOptions([]);
				fetchAvailability(event.id);
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

	const fetchAvailability = (value: number, calendar_id?: number) => {
		const formData = new FormData();
		formData.append('action', 'quillbooking_booking_slots');
		formData.append('id', value.toString());
		formData.append('timezone', currentTimezone || '');
		formData.append('start_date', new Date().toISOString());
		formData.append('duration', selectedEvent?.duration.toString() || '30');
		if (calendar_id) {
			formData.append('calendar_id', calendar_id.toString());
		}
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

	const generateTimeSlots = (date: Dayjs): string[] => {
		if (showAllTimes) {
			return allTimeSlots;
		}
		return selectedAvailability
			? selectedAvailability[date.format('YYYY-MM-DD')].map(
					(slot: { start: string; end: string }) => {
						const timeString = slot.start.split(' ')[1];
						const time = timeString.split(':');
						return `${time[0]}:${time[1]}`;
					}
				)
			: [];
	};

	const handleDateChange = (date: Dayjs | null) => {
		setTimeOptions(date ? generateTimeSlots(date) : []);
		form.setFieldsValue({ selectTime: null });
	};

	const handleSubmit = async (values: any) => {
		const { selectDate, selectTime, event, duration, name, email, status } =
			values;

		const fields = getFields(values);
		const startDateTime =
			selectDate.clone().format('YYYY-MM-DD') + ` ${selectTime}:00`;

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
				},
				onSuccess: () => {
					successNotice('Booking added successfully');
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
			fetchAvailability(selectedEvent.id);
		}
	}, [currentTimezone]);

	useEffect(() => {
		if (selectedEvent?.duration) {
			const duration = selectedEvent.duration;
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
	}, [selectedEvent?.duration]);

	return (
		<Modal
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
			width={900}
			footer={[
				<Button
					className="bg-color-primary text-white text-center w-full"
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
										{calendar.events.map((event) => (
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

					{selectedEvent?.hosts && (
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
								placeholder={__('Select Host', 'quillbooking')}
								showSearch
								size="large"
								filterOption={(input, option) =>
									(typeof option?.children === 'string'
										? (
												option.children as string
											).toLowerCase()
										: ''
									).includes(input.toLowerCase())
								}
								onChange={(calendar_id: number) =>
									fetchAvailability(
										selectedEvent.id,
										calendar_id
									)
								}
							>
								{selectedEvent.hosts.map((host) => (
									<Option value={host.id} key={host.id}>
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
						>
							{selectedEvent && (
								<Option value={selectedEvent.duration}>
									{selectedEvent.duration}{' '}
									{__('minutes', 'quillbooking')}
								</Option>
							)}
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
						>
							{timeOptions.map((time) => (
								<Select.Option key={time} value={time}>
									{time}
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
					<Select disabled={!selectedEvent} size="large">
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
					name="email"
					rules={[{ required: true }]}
					label={__("Attendee's Gmail", 'quillbooking')}
				>
					<Input />
				</Form.Item>
				{selectedEvent && selectedEvent.location.length > 1 && (
					<Form.Item
						name="location"
						label={__('Location', 'quillbooking')}
						rules={[{ required: true }]}
					>
						<Select
							placeholder={__('Select Location', 'quillbooking')}
							options={
								selectedEvent.location.map((location) => ({
									label: locationTypes[location.type].title,
									value: location.type,
								})) || []
							}
						/>
					</Form.Item>
				)}
				</Flex>
				<Form.Item shouldUpdate>
					{({ getFieldValue }) => {
						const locationType = getFieldValue('location');
						const location = find(locationTypes, (_, key) => {
							return key === locationType;
						});

						if (!location) return null;

						return (
							<>
								{map(location.frontend_fields, (field, key) => (
									<DynamicFormField
										key={key}
										field={field}
										fieldKey={key}
									/>
								))}
							</>
						);
					}}
				</Form.Item>
				{/* hidden input, appear depedning on the event info */}
			</Form>
		</Modal>
	);
};

export default AddBookingModal;
