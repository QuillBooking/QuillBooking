/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 * */
import { Card, Flex, Switch } from 'antd';

/**
 * Internal dependencies
 * */
import type { LimitBaseProps } from '@quillbooking/types';
import { SelectTimezone } from '@quillbooking/components';

interface SelectTimezoneProps extends LimitBaseProps { }

const TimezoneSection: React.FC<SelectTimezoneProps> = ({
	limits,
	handleChange,
}) => {
	return (
		<Card className="mt-4">
			<Flex className="items-center justify-between px-[20px] mb-4">
				<Flex vertical gap={1}>
					<div className="text-[#09090B] text-[20px] font-semibold">
						{__('Lock time zone on booking page', 'quillbooking')}
					</div>
					<div className="text-[#71717A] text-[14px]">
						{__(
							'To lock the timezone on booking page, useful for in-person events',
							'quillbooking'
						)}
					</div>
				</Flex>
				<Switch
					checked={limits.timezone_lock.enable}
					onChange={(checked) =>
						handleChange('timezone_lock', 'enable', checked)
					}
					className={
						limits.timezone_lock.enable
							? 'bg-color-primary'
							: 'bg-gray-400'
					}
				/>
			</Flex>
			{limits.timezone_lock.enable && (
				<SelectTimezone
					timezone={limits.timezone_lock.timezone}
					handleChange={(value) =>
						handleChange('timezone_lock', 'timezone', value)
					}
				/>
			)}
		</Card>
	);
};

export default TimezoneSection;
