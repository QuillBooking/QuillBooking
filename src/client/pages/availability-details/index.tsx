/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { Flex, Card, Input, Switch, Button, Skeleton } from 'antd';
import { Dialog, DialogActions, DialogTitle } from '@mui/material';
import { IoCloseSharp } from 'react-icons/io5';

/**
 * Internal dependencies
 */
import { useParams } from '@quillbooking/navigation';
import { useApi, useNavigate } from '@quillbooking/hooks';
import type {
	Availability,
	DateOverrides,
	NoticeMessage,
} from '@quillbooking/client';
import {
	NoticeBanner,
	Schedule,
	SelectTimezone,
} from '@quillbooking/components';
import { OverrideSection } from '@quillbooking/components';
import InfoComponent from './info';
import { isValidDateOverrides } from '@quillbooking/utils';

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
	const [initialLoading, setInitialLoading] = useState<boolean>(true);
	const [savingChanges, setSavingChanges] = useState<boolean>(false);
	const [isSaveBtnDisabled, setIsSaveBtnDisabled] = useState<boolean>(true);
	const [showNotice, setShowNotice] = useState<boolean>(false);
	const [noticeMessage, setNoticeMessage] = useState<NoticeMessage>({
		type: 'success',
		title: __('Success', 'quillbooking'),
		message: __('Availability updated successfully', 'quillbooking'),
	});

	const { callApi } = useApi();
	const navigate = useNavigate();
	const { state } = useNavigate();

	const fetchAvailabilityDetails = () => {
		setInitialLoading(true);
		callApi({
			path: `availabilities/${availabilityId}`,
			method: 'GET',
			onSuccess: (data: Availability) => {
				setAvailabilityDetails(data);
				setAvailabilityName(data.name);
				setAvailabilityTimezone(data.timezone);
				setDateOverrides(data.override);
				setIsDefault(data.is_default ?? false);
				setInitialLoading(false);
			},
			onError: () => {
				setNoticeMessage({
					type: 'error',
					title: __('Error', 'quillbooking'),
					message: __(
						'Failed to load availabilities',
						'quillbooking'
					),
				});
				setShowNotice(true);
				setInitialLoading(false);
			},
		});
	};

	useEffect(fetchAvailabilityDetails, []);
	useEffect(() => {
		// Show success notice if redirected from creation
		const showSuccessNotice = sessionStorage.getItem('showNewScheduleNotice');
		if (showSuccessNotice) {
			setNoticeMessage({
				type: 'success',
				title: __('Success', 'quillbooking'),
				message: __('New availability schedule created successfully', 'quillbooking'),
			});
			setShowNotice(true);
			sessionStorage.removeItem('showNewScheduleNotice');
		}
	}, []);

	const { id: availabilityId } = useParams<{ id: string }>();
	if (!availabilityId) return null;

	const setDefault = async (availability: Availability) => {
		try {
			await callApi({
				path: `availabilities/${availability.id}/set-default`,
				method: 'POST',
			});
		} catch (error) {
			console.log('Error setting default availability:', error);
		}
	};

	const handleAvailabilitySave = async () => {
		if (!availabilityName) {
			setNoticeMessage({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __(
					'Please enter a name for the availability',
					'quillbooking'
				),
			});
			setShowNotice(true);
			return;
		}

		if (!isValidDateOverrides(dateOverrides)) {
			setNoticeMessage({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __(
					'Please enter valid date overrides',
					'quillbooking'
				),
			});
			setShowNotice(true);
			return;
		}
		setSavingChanges(true);
		try {
			if (isDefault) {
				await setDefault(availabilityDetails as Availability);
			}

			await callApi({
				path: `availabilities/${availabilityId}`,
				method: 'PUT',
				data: {
					name: availabilityName,
					weekly_hours: availabilityDetails.weekly_hours,
					override: dateOverrides,
					timezone: availabilityTimezone,
				},
				onSuccess: () => {
					setNoticeMessage({
						type: 'success',
						title: __('Success', 'quillbooking'),
						message: __(
							'Availability updated successfully',
							'quillbooking'
						),
					});
					setShowNotice(true);
				},
				onError: () => {
					setNoticeMessage({
						type: 'error',
						title: __('Error', 'quillbooking'),
						message: __(
							'Failed to update availability',
							'quillbooking'
						),
					});
					setShowNotice(true);
				},
			});
		} catch (error) {
			setNoticeMessage({
				type: 'error',
				title: __('Error', 'quillbooking'),
				message: __('Failed to update availability', 'quillbooking'),
			});
			setShowNotice(true);
		} finally {
			setSavingChanges(false);
			setIsSaveBtnDisabled(true);
		}
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
		setIsSaveBtnDisabled(false);
	};

	const handleClose = () => {
		navigate('availability');
	};

	return (
		<Dialog open={true} fullScreen className="z-[160000]">
			<DialogTitle
				className="border-b mb-4"
				sx={{ padding: '10px 16px' }}
			>
				<Flex className="justify-between items-center">
					<Flex gap={10}>
						<DialogActions>
							<DialogActions
								className="cursor-pointer"
								onClick={handleClose}
								color="primary"
							>
								<IoCloseSharp />
							</DialogActions>
							<div className="text-[#09090B] text-[24px] font-[500]">
								{__('Working hours', 'quillbooking')}
							</div>
						</DialogActions>
					</Flex>
					<Flex gap={24} className="items-center">
						<Button
							type="primary"
							size="middle"
							onClick={handleAvailabilitySave}
							loading={savingChanges}
							disabled={isSaveBtnDisabled}
							className={`rounded-lg font-[500] text-white ${
								isSaveBtnDisabled
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-color-primary '
							}`}
						>
							{__('Save Changes', 'quillbooking')}
						</Button>
					</Flex>
				</Flex>
			</DialogTitle>

			{showNotice && (
				<div className="py-4 px-9">
					<NoticeBanner
						closeNotice={() => setShowNotice(false)}
						notice={noticeMessage}
					/>
				</div>
			)}
			<Flex gap={20} className='px-9 mb-4'>
				{initialLoading ? (
					<>
						<Card className="w-2/3">
							<Flex gap={20} vertical>
								<Card>
									<Skeleton active paragraph={{ rows: 1 }} />
								</Card>
								<Card>
									<Skeleton active paragraph={{ rows: 4 }} />
								</Card>
								<Card>
									<Skeleton active paragraph={{ rows: 8 }} />
								</Card>
							</Flex>
						</Card>
						<Card className="w-1/3">
							<Skeleton active paragraph={{ rows: 6 }} />
						</Card>
					</>
				) : (
					<>
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
											onChange={(e) => {
												setAvailabilityName(e.target.value);
												setIsSaveBtnDisabled(false);
											}}
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
													setIsSaveBtnDisabled(false);
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
										handleChange={(value) => {
											setAvailabilityTimezone(value);
											setIsSaveBtnDisabled(false);
										}}
									/>
								</Card>
							</Flex>
						</Card>
						<div className="w-1/3">
							<OverrideSection
								dateOverrides={dateOverrides || {}}
								setDateOverrides={setDateOverrides}
								setDisabled={() => setIsSaveBtnDisabled(false)}
							/>
						</div>
					</>
				)}
			</Flex>
		</Dialog>
	);
};

export default AvailabilityDetails;
