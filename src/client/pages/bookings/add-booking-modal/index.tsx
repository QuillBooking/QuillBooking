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
import {
	getCurrentTimezone,
	getDisabledDates,
	getTimeSlots,
} from '@quillbooking/utils';
import { Calendar, Event, EventAvailability } from 'client/types';
import { useApi } from '@quillbooking/hooks';
import { CurrentTimeInTimezone } from '@quillbooking/components';
import ConfigAPI from '@quillbooking/config';
import { find, map } from 'lodash';

interface AddBookingModalProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
}

/**
 * Add Booking Modal Component
 */

const { Option } = Select;

const AddBookingModal: React.FC<AddBookingModalProps> = ({
	open,
	onClose,
	onSaved,
}) => {
	const [form] = Form.useForm();
	const [currentTimezone, setCurrentTimezone] = useState<string | null>(
		getCurrentTimezone()
	);
	const [calendars, setCalendars] = useState<Calendar[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [selectedAvailability, setSelectedAvailability] =
		useState<EventAvailability>();
	const [timeOptions, setTimeOptions] = useState<string[]>([]);
	const [showAllTimes, setShowAllTimes] = useState(false);
	const locationTypes = ConfigAPI.getLocations();
	
	const { callApi } = useApi();

	// Reset form when closing modal
	useEffect(() => {
		if (!open) {
			form.resetFields();
			setSelectedEvent(null);
			setSelectedAvailability(undefined);
			setTimeOptions([]);
		}
	}, [open, form]);

	const fetchCalendar = () => {
		callApi({
			path: 'calendars',
			method: 'GET',
			onSuccess: (res) => {
				setCalendars(res.data);
			},
			onError: () => {
				console.log('error fetching calendars');
			},
		});
	};

	const handleEventChange = (value: number) => {
		callApi({
			path: `events/${value}`,
			method: 'GET',
			onSuccess: (event: Event) => {
				setSelectedEvent(event);
				form.setFieldsValue({ duration: event.duration });
				fetchAvailability(event.id);
			},
			onError: () => {
				console.log('error fetching events');
			},
		});
	};

	const fetchAvailability = (value: number) => {
		callApi({
			path: `events/${value}/availability`,
			method: 'GET',
			onSuccess: (availability: EventAvailability) => {
				setSelectedAvailability(availability);
			},
			onError: () => {
				console.log('error fetching availability');
			},
		});
	};

	const disabledDate = (current: Dayjs): boolean => {
		if (showAllTimes) {
			return false;
		}
		return getDisabledDates(current, selectedAvailability || null);
	};

	const generateTimeSlots = (date: Dayjs): string[] => {
		return getTimeSlots(
			date,
			selectedAvailability || null,
			selectedEvent?.duration || 30,
			showAllTimes
		);
	};

	const handleDateChange = (date: Dayjs | null) => {
		setTimeOptions(date ? generateTimeSlots(date) : []);
		form.setFieldsValue({ selectTime: null });
	};

	useEffect(() => {
		fetchCalendar();
	}, []);

	return (
		<Modal
			title={__('Add Booking')}
			open={open}
			onCancel={onClose}
			footer={[
				<Button key="back" onClick={onClose}>
					{__('Cancel')}
				</Button>,
				<Button key="submit" type="primary" onClick={onSaved}>
					{__('Save')}
				</Button>,
			]}
		>
			<Form layout="vertical" form={form}>
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
					<Form.Item
						name="timezone"
						label={__("Attendee's Timezone", 'quillbooking')}
						rules={[{ required: true }]}
					>
						<TimezoneSelect
							value={currentTimezone}
							onChange={setCurrentTimezone}
						/>
						<CurrentTimeInTimezone
							currentTimezone={currentTimezone}
						/>
					</Form.Item>
				)}

				{/* meeting duration (disabled until the event is selected) */}
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

				{/* ignore availability checkbox */}
				<Form.Item name="ignoreAvailability">
					<Checkbox
						disabled={!selectedEvent}
						onChange={(e) => {
							setShowAllTimes(e.target.checked);
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

				{/* select data - selectTime both are disabled until event is selected */}
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

				{/* select status disabled (scheduled / pending / completed ) */}
				<Form.Item
					name="status"
					label={__('Status', 'quillbooking')}
					rules={[{ required: true }]}
				>
					<Select defaultValue="scheduled" disabled={!selectedEvent}>
						<Option value="scheduled">Scheduled</Option>
						<Option value="pending">Pending</Option>
						<Option value="completed">Completed</Option>
					</Select>
				</Form.Item>

				{/* attendee's name */}
				<Form.Item
					name="name"
					label={__("Attendee's Name", 'quillbooking')}
					rules={[{ required: true }]}
				>
					<Input />
				</Form.Item>

				{/* attendee's email  */}
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
				<Form.Item shouldUpdate>
					{({ getFieldValue }) => {
						const locationType = getFieldValue('location');
						const location = find(locationTypes, (_, key) => {
							return key === locationType;
						});

						if (!location) return null;

						// Return an array of Form.Items
						return (
							<>
								{map(location.frontend_fields, (field, key) => (
									<Form.Item
										key={key}
										name={['fields', key]}
										label={field.label}
										rules={[{ required: field.required }]}
									>
										{field.type === 'text' && (
											<Input placeholder={field.desc} />
										)}
										{field.type === 'checkbox' && (
											<Checkbox>{field.desc}</Checkbox>
										)}
										{field.type === 'url' && (
											<Input
												type="url"
												placeholder={field.desc}
											/>
										)}
									</Form.Item>
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
