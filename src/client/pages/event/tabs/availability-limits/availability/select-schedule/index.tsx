/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Select, Typography } from 'antd';

/**
 * Internal dependencies
 */
import { Availability, Host } from 'client/types';

interface SelectScheduleProps {
	availability: Availability;
	hosts: Host[];
	onAvailabilityChange: (id: string) => void;
	title: string;
}
const { Text } = Typography;
const SelectSchedule: React.FC<SelectScheduleProps> = ({
	availability,
	hosts,
	onAvailabilityChange,
	title,
}) => {
	return (
		<Flex gap={1} vertical className="mt-5">
			<Text className="text-[#09090B] text-[16px] font-semibold">
				{title}
				<span className="text-red-500">*</span>
			</Text>
			<Select
				value={availability.id}
				onChange={onAvailabilityChange}
				options={hosts.map((host) => ({
					label: host.name,
					title: host.name,
					options: Object.values(host.availabilities ?? {}).map(
						(availability) => ({
							label: availability.name,
							value: availability.id,
							title: availability.name,
						})
					),
				}))}
				className="w-full h-[48px] rounded-lg"
				getPopupContainer={(trigger) =>
					trigger.parentElement || document.body
				}
			/>
		</Flex>
	);
};

export default SelectSchedule;
