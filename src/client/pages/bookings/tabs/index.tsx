/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex } from 'antd';

/**
 * Internal dependencies
 */
import { BookingsTabsTypes } from 'client/types';
import {
	AllCalendarIcon,
	CalendarNoshowIcon,
	CancelledCalendarIcon,
	CompletedCalendarIcon,
	LatestCalendarIcon,
	PendingCalendarIcon,
	UpcomingCalendarIcon,
} from '@quillbooking/components';
import { IconType } from 'react-icons';
import React from 'react';

/**
 * Main Bookings Tabs Component
 */
interface BookingsTabsProps {
	setPeriod: (period: BookingsTabsTypes) => void;
	period: string;
	pendingCount?: number;
	cancelled?: number;
	noShowCount?: number;
}

type TabItem = {
	value: BookingsTabsTypes;
	label: string;
	icon: IconType;
};

const BookingsTabs: React.FC<BookingsTabsProps> = ({
	setPeriod,
	period,
	pendingCount,
	cancelled,
	noShowCount,
}) => {
	let tabs: TabItem[] = [
		{
			value: 'all',
			label: __('All', 'quillbooking'),
			icon: AllCalendarIcon as IconType,
		},
		{
			value: 'upcoming',
			label: __('Upcoming', 'quillbooking'),
			icon: UpcomingCalendarIcon as IconType,
		},
		{
			value: 'completed',
			label: __('Completed', 'quillbooking'),
			icon: CompletedCalendarIcon as IconType,
		},
		{
			value: 'latest',
			label: __('Latest Bookings', 'quillbooking'),
			icon: LatestCalendarIcon as IconType,
		},
	];

	if (pendingCount && pendingCount > 0) {
		tabs.splice(2, 0, {
			value: 'pending',
			label: `${__('Pending', 'quillbooking')} (${pendingCount})`,
			icon: PendingCalendarIcon as IconType,
		});
	}

	if (cancelled && cancelled > 0) {
		tabs.splice(3, 0, {
			value: 'cancelled',
			label: __('Cancelled', 'quillbooking'),
			icon: CancelledCalendarIcon as IconType,
		});
	}

	if (noShowCount && noShowCount > 0) {
		tabs.splice(4, 0, {
			value: 'no-show',
			label: __('No-Show', 'quillbooking'),
			icon: CalendarNoshowIcon as IconType,
		});
	}
	return (
		<Flex align="center" gap={10} wrap="wrap">
			{tabs.map((tab) => {
				const isActive = tab.value === period;
				return (
					<div
						key={tab.value}
						onClick={() => setPeriod(tab.value)}
						className={`group flex items-center space-y-1 gap-2 cursor-pointer p-3 rounded-md font-bold transition-colors duration-200 ${
							isActive
								? 'bg-color-tertiary text-color-primary'
								: 'text-gray-400'
						}`}
					>
						<span
							className={`${
								isActive
									? 'text-color-primary'
									: 'text-color-primary-text'
							} group-hover:text-color-primary`}
						>
							{React.createElement(tab.icon, {
								style: {
									fill: 'currentColor',
								},
							})}
						</span>
						<span className="group-hover:text-color-primary">
							{tab.label}
						</span>
					</div>
				);
			})}
		</Flex>
	);
};

export default BookingsTabs;
