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
import { TimezoneSelect } from '@quillbooking/components';
import { fetchAjax, getCurrentTimezone, getFields } from '@quillbooking/utils';
import { Booking, Calendar, Event, EventAvailability } from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import { CurrentTimeInTimezone } from '@quillbooking/components';
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
	const [fields, setFields] = useState<{
		[key: string]: string;
	}>();

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
				console.log(event);
				setSelectedEvent(event);
				form.setFieldsValue({
					duration: event.duration,
					location: event.location[0].type,
				});
				form.resetFields(['selectDate', 'selectTime']);
				setTimeOptions([]);
				fetchAvailability(event.id);
				getEventFields(event);
			},
			onError: () => {
				errorNotice('error fetching events');
			},
		});
	};

	const getEventFields = (event: Event) => {
		callApi({
			path: `events/${event.id}/fields`,
			method: 'GET',
			onSuccess: (fields) => {
				setFields(fields);
			},
			onError: () => {
				errorNotice('error fetching event fields');
			},
		});
	};

	const fetchAvailability = (value: number) => {
		const formData = new FormData();
		formData.append('action', 'quillbooking_booking_slots');
		formData.append('id', value.toString());
		formData.append('timezone', currentTimezone || '');
		formData.append('start_date', new Date().toISOString());
		formData.append('duration', selectedEvent?.duration.toString() || '30');
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
		const {
			selectDate,
			selectTime,
			event,
			duration,
			name,
			email,
			status,
		} = values;

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
					slot_time:duration,
					timezone: currentTimezone,
					fields,
					name,
					email,
					status,
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
			title={__('Add Booking')}
			open={open}
			onCancel={onClose}
			footer={[
				<Button key="back" onClick={onClose}>
					{__('Cancel')}
				</Button>,
				<Button key="submit" type="primary" onClick={form.submit}>
					{__('Save')}
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
				<Form.Item
					name="event"
					label={__('Select Event', 'quillbooking')}
					rules={[{ required: true }]}
				>
					<Select
						placeholder={__('Select Event', 'quillbooking')}
						showSearch
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
										<Option value={event.id} key={event.id}>
											{event.name}
										</Option>
									))}
								</Select.OptGroup>
							) : null
						)}
					</Select>
				</Form.Item>

				{currentTimezone && (
					<>
						<Form.Item
							name="timezone"
							label={__("Attendee's Timezone", 'quillbooking')}
							rules={[{ required: true }]}
						>
							<TimezoneSelect
								value={currentTimezone}
								onChange={setCurrentTimezone}
							/>
						</Form.Item>
						<CurrentTimeInTimezone
							currentTimezone={currentTimezone}
						/>
					</>
				)}

				<Form.Item
					name="duration"
					label={__('Meeting Duration', 'quillbooking')}
					rules={[{ required: true }]}
				>
					<Select
						placeholder={__('Select Duration', 'quillbooking')}
						disabled={!selectedEvent}
					>
						{selectedEvent && (
							<Option value={selectedEvent.duration}>
								{selectedEvent.duration}{' '}
								{__('minutes', 'quillbooking')}
							</Option>
						)}
					</Select>
				</Form.Item>

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
						name="selectDate"
						label={__('Select Date', 'quillbooking')}
						rules={[{ required: true }]}
					>
						<DatePicker
							disabled={!selectedEvent}
							disabledDate={disabledDate}
							onChange={handleDateChange}
						/>
					</Form.Item>
					<Form.Item
						name="selectTime"
						label={__('Select Time', 'quillbooking')}
						rules={[{ required: true }]}
					>
						<Select
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
					<Select disabled={!selectedEvent}>
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

				<Form.Item
					name="name"
					label={__("Attendee's Name", 'quillbooking')}
					rules={[{ required: true }]}
				>
					<Input />
				</Form.Item>

				<Form.Item
					name="email"
					rules={[{ required: true }]}
					label={__("Attendee's Gmail", 'quillbooking')}
				>
					<Input />
				</Form.Item>

				{fields && (
					<>
						{fields.system &&
							Object.entries(fields.system)
								.slice(2)
								.map(([key, field]) => (
									<DynamicFormField key={key} field={field} />
								))}
						{fields.custom &&
							Object.entries(fields.custom).map(
								([key, field]) => (
									<DynamicFormField key={key} field={field} />
								)
							)}
					</>
				)}
			</Form>
		</Modal>
	);
};

export default AddBookingModal;
