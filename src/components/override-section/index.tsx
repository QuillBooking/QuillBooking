/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Button, Typography, Card } from 'antd';
import { map, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import type { DateOverrides, TimeSlot } from '@quillbooking/client';

const { Text } = Typography;

interface OverridesSectionProps {
	dateOverrides: DateOverrides;
	onAddOverride: () => void;
	onRemoveOverride: (date: string) => void;
}

const OverridesSection: React.FC<OverridesSectionProps> = ({
	dateOverrides,
	onAddOverride,
	onRemoveOverride,
}) => {
	return (
		<Card title={__('Overrides', 'quillbooking')} style={{ flex: 1 }}>
			<Flex vertical gap={10} flex={1}>
				<Text strong>{__('Date Overrides', 'quillbooking')}</Text>
				{isEmpty(dateOverrides) ? (
					<Text>
						{__(
							'No specific date overrides found for this schedule',
							'quillbooking'
						)}
					</Text>
				) : (
					map(dateOverrides, (times: TimeSlot[], date: string) => (
						<Flex key={date} align="center" gap={10}>
							<Text>{date}</Text>
							<Text>
								{times
									.map(
										(slot) => `${slot.start} - ${slot.end}`
									)
									.join(', ')}
							</Text>
							<Button
								danger
								onClick={() => onRemoveOverride(date)}
							>
								{__('Remove', 'quillbooking')}
							</Button>
						</Flex>
					))
				)}
				<Button type="dashed" onClick={onAddOverride}>
					{__('Add a date override', 'quillbooking')}
				</Button>
			</Flex>
		</Card>
	);
};

export default OverridesSection;
