/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Radio, Typography } from 'antd';

interface AvailabilityTypeProps {
	availabilityType: 'existing' | 'custom';
	handleAvailabilityTypeChange: (value: 'existing' | 'custom') => void;
}

const { Text } = Typography;
const AvailabilityType: React.FC<AvailabilityTypeProps> = ({
	availabilityType,
	handleAvailabilityTypeChange,
}) => {
	return (
		<Flex vertical gap={4} className="mt-4">
			<Text className="text-[#09090B] text-[16px] font-semibold">
				{__(
					'How do you want to offer your availability for this event type?',
					'quillbooking'
				)}
				<span className="text-red-500">*</span>
			</Text>
			<Radio.Group
				value={availabilityType}
				onChange={(e) => {
					handleAvailabilityTypeChange(e.target.value);
				}}
				className="flex gap-1"
			>
				<Radio
					value="existing"
					className={`flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${
						availabilityType === 'existing'
							? 'border-color-primary bg-color-secondary'
							: ''
					}`}
				>
					{__('Use an Existing Schedule', 'quillbooking')}
				</Radio>
				<Radio
					value="custom"
					className={`flex-1 border rounded-lg py-4 px-3 text-[#3F4254] font-semibold custom-radio ${
						availabilityType === 'custom'
							? 'border-color-primary bg-color-secondary'
							: ''
					}`}
				>
					{__('Set Custom Hours', 'quillbooking')}
				</Radio>
			</Radio.Group>
		</Flex>
	);
};

export default AvailabilityType;
