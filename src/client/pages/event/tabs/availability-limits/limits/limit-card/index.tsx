/**
 * External dependencies
 */
import { Flex, Switch } from 'antd';

/**
 * Internal dependencies
 */
import type { LimitBaseProps } from '@quillbooking/client';

interface LimitCardProps extends LimitBaseProps {
	title: string;
	description: string;
	type: 'frequency' | 'duration';
}

const LimitCard: React.FC<LimitCardProps> = ({
	limits,
	handleChange,
	title,
	description,
	type,
}) => {
	return (
		<Flex className="items-center justify-between px-[20px] mb-4">
			<Flex vertical gap={1}>
				<div className="text-[#09090B] text-[20px] font-semibold">
					{title}
				</div>
				<div className="text-[#71717A] text-[14px]">{description}</div>
			</Flex>
			<Switch
				checked={limits[type].enable}
				onChange={(checked) => handleChange(type, 'enable', checked)}
				className={
					limits[type].enable ? 'bg-color-primary' : 'bg-gray-400'
				}
			/>
		</Flex>
	);
};

export default LimitCard;
