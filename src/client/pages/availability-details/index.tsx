/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Flex, Card, Input, Switch, Button } from 'antd';

/**
 * Internal dependencies
 */
import { useParams } from '@quillbooking/navigation';
import { useApi, useNotice } from '@quillbooking/hooks';
import type { Availability, DateOverrides } from '@quillbooking/client';
import { Schedule, SelectTimezone } from '@quillbooking/components';
import { OverrideSection } from '@quillbooking/components';
import InfoComponent from './info';

/**
 * Main Calendars Component.
 */

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
	const [dateOverrides, setDateOverrides] = useState<DateOverrides | {}>({});

	const { callApi } = useApi();
	const { errorNotice, successNotice } = useNotice();

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
	const { id: availabilityId } = useParams<{ id: string }>();
	if (!availabilityId) return null;

	const handleNameUpdate = (availabilityName: string) => {
		if (availabilityName === availabilityDetails.name) return;
		if (!availabilityName) {
			errorNotice(
				__('Please enter a name for the availability', 'quillbooking')
			);
			return;
		}
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				name: availabilityName,
			},
			onSuccess: () => {
				setAvailabilityName(availabilityName);
				successNotice(
					__('Availability name updated successfully', 'quillbooking')
				);
			},
			onError: () => {
				errorNotice(
					__('Failed to update availability name', 'quillbooking')
				);
			},
		});
	};

	const handleAvailabilitySave = () => {
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'PUT',
			data: {
				name: availabilityName,
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

	const onCustomAvailabilityChange = (
		day: string,
		field: string,
		value: boolean | { start: string; end: string }[]
	) => {
		const updatedAvailability = { ...availabilityDetails };
		if (updatedAvailability.weekly_hours) {
			if (field === 'off' && typeof value === 'boolean') {
				updatedAvailability.weekly_hours[day].off = value;
			} else if (field === 'times' && Array.isArray(value)) {
				updatedAvailability.weekly_hours[day].times = value;
			} else {
				return;
			}
		}
		setAvailabilityDetails(updatedAvailability);
	};

	const setDefault = async (availability: Availability) => {
		await callApi({
			path: `availabilities/${availability.id}/set-default`,
			method: 'POST',
			onSuccess: () => {
				successNotice(__('Default calendar updated', 'quillbooking'));
			},
			onError: () => {
				errorNotice(
					__('Failed to update default calendar', 'quillbooking')
				);
			},
		});
	};

	return (
		<>
			<Flex gap={20}>
				<Card className="w-2/3">
					<Flex gap={20} vertical>
						{(availabilityDetails.events_count ?? 0) > 0 && (
							<InfoComponent
								eventsNumber={
									availabilityDetails.events_count ?? 0
								}
							/>
						)}
						<Card>
							<label className="font-normal text-sm">
								<div className="pb-1">
									{__('Availability Name', 'quillbooking')}
									<span className="text-[#EF4444]">*</span>
								</div>
								<Input
									size="large"
									value={availabilityName}
									onChange={(e) =>
										setAvailabilityName(e.target.value)
									}
									onBlur={() =>
										handleNameUpdate(availabilityName)
									}
									placeholder={__(
										'Enter a name for the availability',
										'quillbooking'
									)}
								/>
							</label>

							<div className="flex justify-end">
								<div className="flex gap-2 items-center pt-4">
									<Switch
										checked={isDefault}
										onChange={async () => {
											setIsDefault(!isDefault);
											await setDefault(
												availabilityDetails as Availability
											);
										}}
										className={
											isDefault
												? 'bg-color-primary'
												: 'bg-gray-400'
										}
									/>
									<p className="text-color-primary-text font-bold">
										{__('Set as Default', 'quillbooking')}
									</p>
								</div>
							</div>
						</Card>

						<Card>
							<Schedule
								availability={
									availabilityDetails as Availability
								}
								onCustomAvailabilityChange={
									onCustomAvailabilityChange
								}
							/>
						</Card>

						<Card>
							<SelectTimezone
								timezone={availabilityTimezone}
								handleChange={(value) =>
									setAvailabilityTimezone(value)
								}
							/>
						</Card>
					</Flex>
				</Card>
				<div className="w-1/3">
					<OverrideSection
						dateOverrides={dateOverrides || {}}
						setDateOverrides={setDateOverrides}
						setDisabled={() => {}}
					/>
				</div>
			</Flex>

			<Button onClick={handleAvailabilitySave} className="mt-4">
				{__('Save Availability', 'quillbooking')}
			</Button>
		</>
	);
};

export default AvailabilityDetails;
