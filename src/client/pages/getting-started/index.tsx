/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Card, Flex, Button, message } from 'antd';
import { Dialog, DialogTitle, useMediaQuery, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Internal dependencies
 */
import { useApi, useNavigate, useCurrentUser } from '@quillbooking/hooks';
import CongratsIcon from './icons/congrats-icon';
import Stepper from './stepper';
import EventDetails from './event-details';
import LocationTimezone from './event-location-timezone';
import HostAvailability from './host-availability';
import { getCurrentTimezone } from '@quillbooking/utils';
import { Event } from '@quillbooking/client';

interface FormErrors {
	name?: string;
	timezone?: string;
	location?: string;
}

const GettingStarted: React.FC = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const totalSteps = 3;
	const { callApi } = useApi();
	const { getId: getCurrentUserId } = useCurrentUser();

	const [event, setEvent] = useState<Omit<Event, 'id'> & { id?: number }>({
		name: '',
		description: '',
		type: 'one-to-one',
		duration: 30,
		color: '',
		location: [],
		created_at: '',
		updated_at: '',
		hash_id: '',
		calendar_id: 0,
		user_id: 0,
		slug: '',
		status: 'active',
		booking_count: 0,
		is_disabled: false,
		visibility: 'public',
		dynamic_duration: false,
		payments_settings: {
			type: 'native',
			enable_payment: false,
			currency: 'USD',
			payment_methods: [],
			woo_product: null,
			enable_items_based_on_duration: false,
			items: [],
			multi_duration_items: {},
			enable_paypal: false,
			enable_stripe: false,
		},
		calendar: {
			id: 0,
			user_id: 0,
			name: '',
			description: '',
			slug: '',
			status: 'active',
			timezone: '',
			type: '',
			avatar: { id: 0, url: '' },
			featured_image: { id: 0, url: '' },
			events: [],
			created_at: '',
			updated_at: '',
			team_members: [],
		},
		additional_settings: {
			allow_attendees_to_select_duration: false,
			default_duration: 0,
			selectable_durations: [],
			allow_additional_guests: false,
			max_invitees: 0,
			show_remaining: false,
		},
		reserve: false,
		connected_integrations: {
			apple: {
				name: 'apple',
				connected: false,
				has_settings: true,
				has_accounts: false,
			},
			google: {
				name: 'google',
				connected: false,
				has_settings: true,
				has_accounts: false,
			},
			outlook: {
				name: 'outlook',
				connected: false,
				has_settings: true,
				has_accounts: false,
				teams_enabled: false,
			},
			twilio: {
				name: 'twilio',
				connected: false,
				has_settings: true,
				has_accounts: false,
			},
			zoom: {
				name: 'zoom',
				connected: false,
				has_settings: true,
				has_accounts: false,
			},
		},
		availability_data: {
			id: '',
			user_id: '',
			name: '',
			weekly_hours: {
				monday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: false,
				},
				tuesday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: false,
				},
				wednesday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: false,
				},
				thursday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: false,
				},
				friday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: false,
				},
				saturday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: true,
				},
				sunday: {
					times: [{ start: '09:00', end: '17:00' }],
					off: true,
				},
			},
			override: {},
			timezone: getCurrentTimezone(),
		},
	});

	const validateStep = useCallback(
		(step: number): boolean => {
			const newErrors: FormErrors = {};

			switch (step) {
				case 1:
					if (!event.name.trim()) {
						newErrors.name = __(
							'Event name is required',
							'quillbooking'
						);
					}
					break;
				case 2:
					if (!event.calendar.timezone) {
						newErrors.timezone = __(
							'Timezone is required',
							'quillbooking'
						);
					}
					if (event.location.length === 0) {
						newErrors.location = __(
							'At least one location is required',
							'quillbooking'
						);
					}
					break;
			}

			setErrors(newErrors);
			return Object.keys(newErrors).length === 0;
		},
		[event]
	);

	const handleEventChange = (field: keyof Event, value: any) => {
		setEvent((prev) => {
			const newEvent = {
				...prev,
				[field]: value,
			};
			return newEvent;
		});

		// Clear error for the field being changed
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field as keyof FormErrors];
				return newErrors;
			});
		}
	};

	useEffect(() => {
		console.log(event.availability_data);
	}, [event.availability_data]);

	const handleAvailabilityChange = (
		dayKey: string,
		field: string,
		value: boolean | { start: string; end: string }[]
	) => {
		setEvent((prev) => {
			if (!prev.availability_data) return prev;

			const newEvent = {
				...prev,
				availability_data: {
					...prev.availability_data,
					weekly_hours: {
						...prev.availability_data.weekly_hours,
						[dayKey]: {
							...prev.availability_data.weekly_hours[dayKey],
							[field]: value,
						},
					},
				},
			};
			return newEvent;
		});

		// Clear timezone error if it exists and we're changing timezone
		if (field === 'timezone' && errors.timezone) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors.timezone;
				return newErrors;
			});
		}
	};

	const handleNext = async () => {
		const isValid = validateStep(currentStep);
		if (!isValid) {
			return;
		}

		setLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (currentStep < totalSteps) {
				setCurrentStep(currentStep + 1);
				setErrors({});
			}
		} catch (error) {
			message.error(__('Failed to proceed to next step', 'quillbooking'));
			console.error('Error proceeding to next step:', error);
		} finally {
			setLoading(false);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
			setErrors({});
		}
	};

	const handleSubmit = async () => {
		if (!validateStep(currentStep)) {
			return;
		}

		setLoading(true);
		try {
			// First create a calendar
			const calendarData = {
				name: event.name,
				description: event.description || '',
				type: 'host',
				user_id: getCurrentUserId(),
				timezone: event.calendar?.timezone || getCurrentTimezone(),
				availability: event.availability_data,
			};

			// Create calendar
			const calendarResponse = await callApi({
				path: 'calendars',
				method: 'POST',
				data: calendarData,
				onSuccess: (response) => {
					// After calendar is created, create the event
					const eventData = {
						name: event.name,
						description: event.description || '',
						type: event.type,
						duration: event.duration,
						color: event.color,
						location: event.location,
						calendar_id: response.id,
						user_id: getCurrentUserId(),
						status: 'active',
						visibility: 'public',
						event_range: {
							type: 'days',
							days: 60,
						},
						// Use the availability data from the form
						availability_data: event.availability_data,
						// Set default values for required fields
						limits: {
							max_bookings: 0,
							max_bookings_per_day: 0,
							max_bookings_per_week: 0,
							max_bookings_per_month: 0,
							max_bookings_per_year: 0,
							max_bookings_per_user: 0,
							max_bookings_per_user_per_day: 0,
							max_bookings_per_user_per_week: 0,
							max_bookings_per_user_per_month: 0,
							max_bookings_per_user_per_year: 0,
						},
						email_notifications: {
							enabled: true,
							notify_host: true,
							notify_attendee: true,
							notify_admin: false,
							notify_custom: false,
							custom_emails: [],
						},
						sms_notifications: {
							enabled: true,
							notify_host: false,
							notify_attendee: false,
							notify_admin: false,
							notify_custom: false,
							custom_numbers: [],
						},
						advanced_settings: {
							allow_cancellation: true,
							cancellation_window: 24,
							allow_rescheduling: true,
							rescheduling_window: 24,
							allow_waitlist: false,
							waitlist_limit: 0,
						},
						// Use the connected integrations from the form
						connected_integrations: event.connected_integrations,
						// Use the additional settings from the form
						additional_settings: event.additional_settings,
						// Use the payments settings from the form
						payments_settings: event.payments_settings,
					};

					// Create event
					return callApi({
						path: 'events',
						method: 'POST',
						data: eventData,
						onSuccess: (eventResponse) => {
							message.success(
								__(
									'Event created successfully!',
									'quillbooking'
								)
							);
							navigate(`calendars`, {
								state: {
									notice: {
										title: __(
											'Complete Your Setup',
											'quillbooking'
										),
										message: __(
											'The event has been created successfully. Please complete your event setup and settings to finish.',
											'quillbooking'
										),
									},
								},
							});
						},
						onError: (error) => {
							message.error(
								error ||
									__('Failed to create event', 'quillbooking')
							);
							console.error('Error creating event:', error);
						},
					});
				},
				onError: (error) => {
					message.error(
						error || __('Failed to create calendar', 'quillbooking')
					);
					console.error('Error creating calendar:', error);
				},
			});
		} catch (error) {
			message.error(
				__('Failed to create calendar and event', 'quillbooking')
			);
			console.error('Error submitting form:', error);
		} finally {
			setLoading(false);
		}
	};

	// Add useEffect to validate on event changes
	React.useEffect(() => {
		validateStep(currentStep);
	}, [event, currentStep, validateStep]);

	const renderStepContent = () => {
		const content = (() => {
			switch (currentStep) {
				case 1:
					return (
						<EventDetails
							event={event}
							onEventChange={handleEventChange}
							errors={errors}
						/>
					);
				case 2:
					return (
						<LocationTimezone
							event={event}
							onEventChange={handleEventChange}
							errors={errors}
						/>
					);
				case 3:
					return (
						<HostAvailability
							event={event}
							onAvailabilityChange={handleAvailabilityChange}
						/>
					);
				default:
					return null;
			}
		})();

		return (
			<AnimatePresence mode="wait">
				<motion.div
					key={currentStep}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
					transition={{ duration: 0.3 }}
				>
					{content}
				</motion.div>
			</AnimatePresence>
		);
	};

	return (
		<Dialog
			open={true}
			fullScreen
			className="z-[150000]"
			PaperProps={{
				sx: {
					maxWidth: '100%',
					width: '100%',
					margin: 0,
					borderRadius: 0,
				},
			}}
		>
			<DialogTitle className="border-b" sx={{ padding: '10px 16px' }}>
				<div className="text-[#09090B] text-[24px] font-[500]">
					{__('Getting Started', 'quillbooking')}
				</div>
			</DialogTitle>
			<Card className="quillbooking-getting-started bg-[#FDFDFD] mx-4 md:mx-20 my-4 md:my-10 py-6 md:py-10">
				<Flex vertical align="center" justify="center" gap={25}>
					<Flex
						vertical
						align="center"
						justify="center"
						gap={20}
						className="bg-gradient-to-b from-[#4D0C86] to-[#953AE4] rounded-3xl py-8 md:py-14 px-8 md:px-28 w-full md:w-auto"
					>
						<CongratsIcon />
						<div className="text-white text-3xl md:text-5xl font-semibold text-center">
							{__('Congratulations!', 'quillbooking')}
						</div>
						<div className="text-[#e5cdf9] text-xl md:text-2xl font-medium text-center">
							{__(
								'Thank you for Choosing QuillBooking, Let`s',
								'quillbooking'
							)}
							<span className="font-extrabold ml-2 text-white block md:inline">
								{__(
									'Create Your First Booking Event',
									'quillbooking'
								)}
							</span>
						</div>
					</Flex>

					<Stepper currentStep={currentStep} />

					<div className="w-full max-w-[1110px] px-4 md:px-0">
						{renderStepContent()}
					</div>

					<div className="w-full max-w-[1110px] px-4 md:px-0">
						<Flex
							justify="flex-end"
							align="center"
							gap={16}
							className="mt-8"
						>
							{currentStep > 1 && (
								<Button
									onClick={handlePrevious}
									disabled={loading}
									size="large"
									className="px-8 md:px-14 border-color-primary text-color-primary bg-transparent"
								>
									{__('Back', 'quillbooking')}
								</Button>
							)}

							{currentStep < totalSteps ? (
								<Button
									type="primary"
									onClick={handleNext}
									loading={loading}
									size="large"
									className="px-8 md:px-12"
									disabled={
										loading ||
										Object.keys(errors).length > 0
									}
								>
									{__('Continue', 'quillbooking')}
								</Button>
							) : (
								<Button
									type="primary"
									onClick={handleSubmit}
									loading={loading}
									size="large"
									className="px-8 md:px-14"
								>
									{__('Submit', 'quillbooking')}
								</Button>
							)}
						</Flex>
					</div>
				</Flex>
			</Card>
		</Dialog>
	);
};

export default GettingStarted;
