/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Checkbox, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
// import './style.scss';
import { getHistory } from '@quillbooking/navigation';
import { useApi, useNotice } from '@quillbooking/hooks';
import { Availability } from 'client/types';
import { TimezoneSelect } from '@quillbooking/components';

/**
 * Main Calendars Component.
 */
const { Text } = Typography;

const AvailabilityDetails: React.FC = () => {
	const [availabilityDetails, setAvailabilityDetails] = useState<
		Partial<Availability>
	>({
		weekly_hours: {},
		name: '',
	});
	const [availabilityName, setAvailabilityName] = useState('');
	const [availabilityTimezone, setAvailabilityTimezone] = useState('');

	const { callApi } = useApi();
	const { errorNotice, successNotice } = useNotice();
	const history = getHistory();
	const availabilityId = history.location.pathname.split('/')[2];

	const fetchAvailabilityDetails = () => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'GET',
			onSuccess: (data) => {
				setAvailabilityDetails(data);
				setAvailabilityName(data.name);
				setAvailabilityTimezone(data.timezone);
			},
			onError: () => {
				errorNotice(
					__('Failed to load availabilities', 'quillbooking')
				);
			},
		});
	};

	const handleNameUpdate = () => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				name: availabilityName,
			},
			onSuccess: () => {
				successNotice(
					__('Availability name updated successfully', 'quillbooking')
				);
			},
			onError: (err) => {
				errorNotice(`Failed to update schedule name ${err.message}`);
			},
		});
	};

	const handleAvailabilityUpdate = () => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				weekly_hours: availabilityDetails.weekly_hours,
				timezone: availabilityTimezone,
			},
			onSuccess: () => {
				successNotice(
					__('Availability updated successfully', 'quillbooking')
				);
			},
		});
	};

	const onCustomAvailabilityChange = (day, field, value) => {
		const updatedAvailability = { ...availabilityDetails };
		if (updatedAvailability.weekly_hours) {
			if (field === 'off') {
				updatedAvailability.weekly_hours[day].off = value;
			} else {
				updatedAvailability.weekly_hours[day].times = value;
			}
		}
		setAvailabilityDetails(updatedAvailability);
	};

	useEffect(fetchAvailabilityDetails, []);

	return (
		<>
			<div>
				<Flex justify="space-between" vertical gap={20}>
					<div>
						<h3>
							<span>{availabilityName}</span>
							<i></i>
						</h3>

						<div>
							<input
								type="text"
								name="name"
								id="name"
								value={availabilityName}
								onChange={(e) =>
									setAvailabilityName(e.target.value)
								}
							/>

							<Button onClick={handleNameUpdate}>Update</Button>
						</div>

						<p>
							{__(
								'Edit the schedule below so that you can apply to your event/booking types',
								'quillbooking'
							)}
						</p>
					</div>

					<div>
						{map(availabilityDetails.weekly_hours, (day, key) => (
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
										style={{ textTransform: 'capitalize' }}
									>
										{key}
									</Text>
								</Flex>
								{!day.off && (
									<TimePicker.RangePicker
										value={[
											dayjs(day.times[0].start, 'HH:mm'),
											dayjs(day.times[0].end, 'HH:mm'),
										]}
										onChange={(times) => {
											if (times) {
												onCustomAvailabilityChange(
													key,
													'times',
													[
														{
															start: times[0]?.format(
																'HH:mm'
															),
															end: times[1]?.format(
																'HH:mm'
															),
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
						))}
					</div>

					<Button onClick={handleAvailabilityUpdate}>Update</Button>
				</Flex>
			</div>
			<div>
				<Flex justify="space-between" align="center">
					<div>
						<TimezoneSelect
							value={availabilityTimezone || null}
							onChange={(value) => setAvailabilityTimezone(value)}
						/>
					</div>
				</Flex>
			</div>
		</>
	);
};

export default AvailabilityDetails;
