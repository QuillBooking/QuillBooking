/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Skeleton, Space } from 'antd';

/**
 * Internal dependencies
 */
import { SetStateAction } from 'react';
import type {
	EventLimits as EventLimitsType,
	LimitUnit,
	UnitOption as UnitOptionType,
	UnitOptions as UnitOptionsType,
} from '@quillbooking/client';
import { CardHeader, OutlinedClockIcon } from '@quillbooking/components';
import TimezoneSection from './limit-timezone';
import BookingFrequency from './booking-frequency';
import BookingDuration from './booking-duration';
import EventBuffer from './event-buffer';
import MinimunmNotice from './minimum-notice';
import TimeSlotIntervals from './intervals';

interface EventLimitsProps {
	limits: EventLimitsType | null;
	setLimits: (limits: SetStateAction<EventLimitsType | null>) => void;
	bookingDurationOptions: UnitOptionsType;
	setBookingDurationOptions: (
		options: SetStateAction<UnitOptionsType>
	) => void;
	bookingFrequencyOptions: UnitOptionsType;
	setBookingFrequencyOptions: (
		options: SetStateAction<UnitOptionsType>
	) => void;
	setDisabled: (value: boolean) => void;
}
/**
 * Event limits Component.
 */
const EventLimits: React.FC<EventLimitsProps> = ({
	limits,
	setLimits,
	bookingDurationOptions,
	bookingFrequencyOptions,
	setBookingDurationOptions,
	setBookingFrequencyOptions,
	setDisabled,
}) => {
	const handleChange = (
		section: keyof EventLimitsType,
		key: string,
		value: any
	) => {
		setDisabled(false);
		setLimits((prev) =>
			prev
				? { ...prev, [section]: { ...prev[section], [key]: value } }
				: prev
		);
	};

	const addLimit = (section: 'frequency' | 'duration') => {
		// Choose which map to use
		const bookingState =
			section === 'duration'
				? bookingDurationOptions
				: bookingFrequencyOptions;

		// Build an array of { value, label, disabled } for only the enabled ones
		const available = (
			Object.entries(bookingState) as [LimitUnit, UnitOptionType][]
		)
			.filter(([_, opt]) => !opt.disabled)
			.map(([value, opt]) => ({ value, ...opt }));

		// Guard: if we have no available options, bail out
		if (available.length === 0) {
			return;
		}

		// Pick the next unit
		const nextUnit = available[0].value;

		// 1) Update your limits to add the new limit
		setLimits((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				[section]: {
					...prev[section],
					limits: [
						...prev[section].limits,
						{
							limit: section === 'duration' ? 120 : 5,
							unit: nextUnit,
						},
					],
				},
			};
		});

		// 2) Disable that unit in the corresponding booking map
		if (section === 'duration') {
			setBookingDurationOptions((prev) => ({
				...prev,
				[nextUnit]: {
					...prev[nextUnit],
					disabled: true,
				},
			}));
		} else {
			setBookingFrequencyOptions((prev) => ({
				...prev,
				[nextUnit]: {
					...prev[nextUnit],
					disabled: true,
				},
			}));
		}
	};

	const removeLimit = (section: 'frequency' | 'duration', index: number) => {
		// First, capture the unit we're removing so we can re-enable it
		const unitBeingRemoved = limits?.[section].limits[index]?.unit;

		setLimits((prev) => {
			if (!prev) return prev;
			const updatedLimits = [...prev[section].limits];
			updatedLimits.splice(index, 1);
			return {
				...prev,
				[section]: {
					...prev[section],
					limits: updatedLimits.length
						? updatedLimits
						: [{ limit: 1, unit: 'days' }], // Ensure at least one limit
				},
			};
		});

		// Re-enable the unit in the corresponding booking state
		if (unitBeingRemoved) {
			if (section === 'duration') {
				setBookingDurationOptions((prev) => ({
					...prev,
					[unitBeingRemoved]: {
						...prev[unitBeingRemoved],
						disabled: false,
					},
				}));
			} else {
				setBookingFrequencyOptions((prev) => ({
					...prev,
					[unitBeingRemoved]: {
						...prev[unitBeingRemoved],
						disabled: false,
					},
				}));
			}
		}
	};

	if (!limits) {
		return (
			<Card className="rounded-lg">
				<Space
					direction="vertical"
					style={{ width: '100%' }}
					size="large"
				>
					<Skeleton.Input active block style={{ height: 48 }} />
					{/* Buffer sections */}
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 80 }} />
					</div>
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 80 }} />
					</div>
					{/* Minimum Notice */}
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 80 }} />
					</div>
					{/* Time Slots */}
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 80 }} />
					</div>
					{/* Booking Frequency */}
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 120 }} />
					</div>
					{/* Booking Duration */}
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 120 }} />
					</div>
					{/* Timezone */}
					<div>
						<Skeleton.Input
							active
							block
							style={{ width: '40%', marginBottom: 16 }}
						/>
						<Skeleton.Input active block style={{ height: 60 }} />
					</div>
				</Space>
			</Card>
		);
	}

	return (
		<Card className="rounded-lg">
			<CardHeader
				title={__('Limits', 'quillbooking')}
				description={__(
					'Manage you buffer time before and after events.',
					'quillbooking'
				)}
				icon={<OutlinedClockIcon width={30} height={30} />}
			/>

			<EventBuffer
				handleChange={handleChange}
				limits={limits}
				type="buffer_before"
				title={__('Before Event', 'quillbooking')}
			/>

			<EventBuffer
				handleChange={handleChange}
				limits={limits}
				type="buffer_after"
				title={__('After Event', 'quillbooking')}
			/>

			<MinimunmNotice handleChange={handleChange} limits={limits} />

			<TimeSlotIntervals handleChange={handleChange} limits={limits} />

			<BookingFrequency
				limits={limits}
				handleChange={handleChange}
				addLimit={addLimit}
				removeLimit={removeLimit}
				unitOptions={bookingFrequencyOptions}
				setBookingFrequency={setBookingFrequencyOptions}
			/>
			<BookingDuration
				limits={limits}
				handleChange={handleChange}
				addLimit={addLimit}
				removeLimit={removeLimit}
				unitOptions={bookingDurationOptions}
				setBookingDuration={setBookingDurationOptions}
			/>
			<TimezoneSection limits={limits} handleChange={handleChange} />
		</Card>
	);
};

export default EventLimits;
