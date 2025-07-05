/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Card, Flex } from 'antd';
import React from 'react';
/**
 * Internal dependencies
 */
import { Schedule } from '@quillbooking/components';
import { GettingStartedComponentProps } from '@quillbooking/types';

const HostAvailability: React.FC<GettingStartedComponentProps> = ({
	event,
	onAvailabilityChange = () => { },
}) => {
	return (
		<Card className="bg-white">
			<Flex vertical gap={8} className="w-full">
				<div className="text-[#09090B] text-[16px] font-medium">
					{__('Host Availability', 'quillbooking')}
					<span className="text-red-500">*</span>
				</div>
				<Schedule
					availability={
						event.availability_data || {
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
						}
					}
					onCustomAvailabilityChange={onAvailabilityChange}
					startDay="monday"
					timeFormat="24h"
				/>
			</Flex>
		</Card>
	);
};

export default HostAvailability;
