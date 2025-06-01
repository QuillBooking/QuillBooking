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
import { Locations, SelectTimezone } from '@quillbooking/components';
import { GettingStartedComponentProps } from '@quillbooking/client';

interface FormErrors {
	name?: string;
	timezone?: string;
	location?: string;
}

interface ExtendedGettingStartedProps extends GettingStartedComponentProps {
	errors?: FormErrors;
	handleSubmit?: (redirect: boolean) => Promise<any>;
}

const LocationTimezone: React.FC<ExtendedGettingStartedProps> = ({
	event,
	onEventChange = () => {},
	errors = {},
	handleSubmit = async (redirect: boolean) => {},
}) => {
	return (
		<Flex vertical gap={20} className="">
			<Card className="bg-white px-[20px]">
				<Flex vertical gap={20}>
					<Flex className="justify-between">
						<div className="text-[#09090B] text-[16px] font-medium">
							{__('How Will You Meet', 'quillbooking')}
							<span className="text-red-500">*</span>
						</div>
						<div className="text-[#848484] italic">
							{__('You Can Select More Than One', 'quillbooking')}
						</div>
					</Flex>
					<Flex vertical gap={15}>
						<Locations
							handleSubmit={() => handleSubmit(false)}
							locations={event.location || []}
							onChange={(locations) => {
								onEventChange('location', locations);
							}}
							connected_integrations={
								event.connected_integrations
							}
							calendar={event.calendar}
						/>
						{errors.location && (
							<div className="text-red-500 text-sm mt-1">
								{errors.location}
							</div>
						)}
					</Flex>
				</Flex>
			</Card>
			<Card className="bg-white">
				<Flex vertical gap={8}>
					<div className="relative">
						<SelectTimezone
							timezone={event.calendar?.timezone || ''}
							handleChange={(value) =>
								onEventChange('calendar', {
									...event.calendar,
									timezone: value,
								})
							}
						/>
						{errors.timezone && (
							<div className="text-red-500 text-sm mt-1">
								{errors.timezone}
							</div>
						)}
					</div>
				</Flex>
			</Card>
		</Flex>
	);
};

export default LocationTimezone;
