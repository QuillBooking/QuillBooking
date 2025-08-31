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
import {
	CurrentTimeInTimezone,
	TimezoneSelect,
} from '@quillbooking/components';

interface SelectTimezoneProps {
	timezone: string;
	handleChange: (value: string) => void;
	timeFormat?: string;
}
const SelectTimezone: React.FC<SelectTimezoneProps> = ({
	timezone,
	handleChange,
	timeFormat = '12',
}) => {
	return (
		<Flex vertical gap={10} className="px-[20px]">
			<div className="text-[#09090B] text-[16px]">
				{__('Select Time Zone', 'quillbooking')}
				<span className="text-red-500">*</span>
			</div>
			<TimezoneSelect
				value={timezone}
				onChange={(value) => handleChange(value)}
				getPopupContainer={(trigger) => trigger.parentElement}
				className="h-[48px] w-full rounded-lg"
			/>

			<CurrentTimeInTimezone
				className="text-[#71717A]"
				currentTimezone={timezone}
				timeFormat={timeFormat}
			/>
		</Flex>
	);
};

export default SelectTimezone;
