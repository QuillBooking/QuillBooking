/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
/**
 * External dependencies
 */
import React, { useState, useCallback, useRef } from 'react';
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
import { Event, Availability } from '@quillbooking/types';

interface FormErrors {
	name?: string;
	timezone?: string;
	location?: string;
}

interface TouchedFields {
	name?: boolean;
	timezone?: boolean;
	location?: boolean;
}

const GettingStarted: React.FC = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const location = useRef<Location[]>([]);
	const [currentStep, setCurrentStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [touched, setTouched] = useState<TouchedFields>({});
	const totalSteps = 3;
	const { callApi } = useApi();
	const { getId: getCurrentUserId } = useCurrentUser();

	// Helper function to check if Pro version is available
	const isProVersionAvailable = (): boolean => {
		// Check for Pro version using the same pattern as other components
		// This filter is provided by the Pro plugin when it's active
		return Boolean(applyFilters('quillbooking.integration', false));
	};

	// Create a temporary availability object for the getting started flow
	const [temporaryAvailability] = useState<Availability>({
		id: 0,
		user_id: 0,
		name: 'Default Schedule',
		value: {
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
		},
		timezone: getCurrentTimezone(),
		is_default: true,
		created_at: '',
		updated_at: '',
	});

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
		availability_type: 'custom',
		availability_meta: {
			custom_availability: temporaryAvailability,
			is_common: false,
			hosts_schedules: {},
		},
		availability_id: null,
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
		advanced_settings: {
			submit_button_text: '',
			redirect_after_submit: false,
			redirect_url: '',
			require_confirmation: false,
			confirmation_time: 'always',
			confirmation_time_value: 0,
			confirmation_time_unit: {
				days: { label: '', disabled: false },
				weeks: { label: '', disabled: false },
				months: { label: '', disabled: false },
			},
			allow_multiple_bookings: false,
			maximum_bookings: 0,
			attendee_cannot_cancel: false,
			cannot_cancel_time: 'event_start',
			cannot_cancel_time_value: 0,
			cannot_cancel_time_unit: {
				days: { label: '', disabled: false },
				weeks: { label: '', disabled: false },
				months: { label: '', disabled: false },
			},
			permission_denied_message: '',
			attendee_cannot_reschedule: false,
			cannot_reschedule_time: 'event_start',
			cannot_reschedule_time_value: 0,
			cannot_reschedule_time_unit: {
				days: { label: '', disabled: false },
				weeks: { label: '', disabled: false },
				months: { label: '', disabled: false },
			},
			reschedule_denied_message: '',
			event_title: '',
			redirect_query_string: '',
		},
		reserve: false,
		connected_integrations: {
			apple: {
				name: 'apple',
				has_get_started: true,
				connected: false,
				has_settings: true,
				has_accounts: false,
				has_pro_version: isProVersionAvailable(),
			},
			google: {
				name: 'google',
				has_get_started: true,
				connected: false,
				has_settings: true,
				has_accounts: false,
				has_pro_version: isProVersionAvailable(),
			},
			outlook: {
				name: 'outlook',
				has_get_started: true,
				connected: false,
				has_settings: true,
				has_accounts: false,
				teams_enabled: false,
				has_pro_version: isProVersionAvailable(),
			},
			twilio: {
				name: 'twilio',
				has_get_started: true,
				connected: false,
				has_settings: false,
				has_accounts: false,
				has_pro_version: isProVersionAvailable(),
			},
			zoom: {
				name: 'zoom',
				has_get_started: true,
				connected: false,
				has_settings: false,
				has_accounts: false,
				has_pro_version: isProVersionAvailable(),
			},
		},
	});

	const validateStep = useCallback(
		(step: number, isSubmitting = false): boolean => {
			const newErrors: FormErrors = {};

			switch (step) {
				case 1:
					if ((isSubmitting || touched.name) && !event.name.trim()) {
						newErrors.name = __(
							'Event name is required',
							'quillbooking'
						);
					}
					break;
				case 2:
					if (
						(isSubmitting || touched.timezone) &&
						!event.calendar.timezone
					) {
						newErrors.timezone = __(
							'Timezone is required',
							'quillbooking'
						);
					}
					if (
						(isSubmitting || touched.location) &&
						event.location.length === 0
					) {
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
		[event, touched]
	);

	const handleEventChange = (field: string, value: any) => {
		setEvent((prev) => {
			const newEvent = {
				...prev,
				[field]: value,
			};
			return newEvent;
		});

		if (field === 'location') {
			location.current = value;
		}

		// Mark field as touched
		setTouched((prev) => ({
			...prev,
			[field]: true,
		}));

		// Clear error for the field being changed
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field as keyof FormErrors];
				return newErrors;
			});
		}
	};

	const handleAvailabilityChange = (
		dayKey: string,
		field: string,
		value: boolean | { start: string; end: string }[]
	) => {
		setEvent((prev) => {
			if (!prev.availability_meta?.custom_availability) return prev;

			const newEvent = {
				...prev,
				availability_meta: {
					...prev.availability_meta,
					custom_availability: {
						...prev.availability_meta.custom_availability,
						value: {
							...prev.availability_meta.custom_availability.value,
							weekly_hours: {
								...prev.availability_meta.custom_availability
									.value.weekly_hours,
								[dayKey]: {
									...prev.availability_meta
										.custom_availability.value.weekly_hours[
										dayKey
									],
									[field]: value,
								},
							},
						},
					},
				},
			};
			return newEvent;
		});

		// Mark timezone as touched if we're changing it
		if (field === 'timezone') {
			setTouched((prev) => ({
				...prev,
				timezone: true,
			}));
		}

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
		const isValid = validateStep(currentStep, true);
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

	const handleSubmit = async (redirect = false) => {
		setLoading(true);
		try {
			// First create a calendar
			const calendarData = {
				name: event.name,
				description: event.description || '',
				type: 'host',
				user_id: getCurrentUserId(),
				timezone: event.calendar?.timezone || getCurrentTimezone(),
				availability: event.availability_meta?.custom_availability,
			};

			// Create calendar
			const calendarResponse = await new Promise((resolve, reject) => {
				callApi({
					path: 'calendars',
					method: 'POST',
					data: calendarData,
					onSuccess: async (response) => {
						try {
							// After calendar is created, create the event
							const eventData = {
								name: event.name,
								description: event.description || '',
								type: event.type,
								duration: event.duration,
								color: event.color,
								location: location.current,
								calendar_id: response.id,
								user_id: getCurrentUserId(),
								status: 'active',
								visibility: 'public',
								event_range: {
									type: 'days',
									days: 60,
								},
								availability_meta: event.availability_meta,
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
								connected_integrations:
									event.connected_integrations,
								additional_settings: event.additional_settings,
								payments_settings: event.payments_settings,
							};

							// Create event
							await callApi({
								path: 'events',
								method: 'POST',
								data: eventData,
								onSuccess: () => {
									message.success(
										__(
											'Event created successfully!',
											'quillbooking'
										)
									);
									if (redirect) {
										navigate('calendars', {
											notice_title: __(
												'Complete Your Setup',
												'quillbooking'
											),
											notice_message: __(
												'The event has been created successfully. Please complete your event setup and settings to finish.',
												'quillbooking'
											),
										});
									}
									resolve(response); // Resolve with calendar response
								},
								onError: (error) => {
									message.error(
										error ||
											__(
												'Failed to create event',
												'quillbooking'
											)
									);
									console.error(
										'Error creating event:',
										error
									);
									reject(error);
								},
							});
						} catch (error) {
							reject(error);
						}
					},
					onError: (error) => {
						message.error(
							error ||
								__('Failed to create calendar', 'quillbooking')
						);
						console.error('Error creating calendar:', error);
						reject(error);
					},
				});
			});

			return calendarResponse;
		} catch (error) {
			message.error(
				__('Failed to create calendar and event', 'quillbooking')
			);
			console.error('Error submitting form:', error);
			throw error;
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
							handleSubmit={() => handleSubmit(false)}
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
									onClick={() => handleSubmit(true)}
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
