/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Radio, Input, DatePicker, Typography, Card } from 'antd';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type { AvailabilityRange } from '@quillbooking/client';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface RangeSectionProps {
    range: AvailabilityRange;
    onRangeTypeChange: (type: 'days' | 'date_range' | 'infinity') => void;
    onDaysChange: (days: number) => void;
    onDateRangeChange: (start_date: string, end_date: string) => void;
}

const RangeSection: React.FC<RangeSectionProps> = ({
    range,
    onRangeTypeChange,
    onDaysChange,
    onDateRangeChange,
}) => {
    return (
        <Card title={__('Range', 'quillbooking')} style={{ flex: 1 }}>
            <Flex vertical gap={10}>
                <Text strong>{__('Availability Range', 'quillbooking')}</Text>
                <Radio.Group
                    value={range.type}
                    defaultValue={'days'}
                    onChange={(e) => onRangeTypeChange(e.target.value)}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                    <Radio value="days">{__('Within future days', 'quillbooking')}</Radio>
                    <Radio value="date_range">{__('Within a date range', 'quillbooking')}</Radio>
                    <Radio value="infinity">{__('Indefinitely into the future', 'quillbooking')}</Radio>
                </Radio.Group>
                {range.type === 'days' && (
                    <Input
                        type="number"
                        value={range.days}
                        onChange={(e) => onDaysChange(parseInt(e.target.value, 10))}
                        placeholder={__('Enter number of days', 'quillbooking')}
                    />
                )}
                {range.type === 'date_range' && (
                    <RangePicker
                        value={[dayjs(range.start_date), dayjs(range.end_date)]}
                        onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                                onDateRangeChange(dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD'));
                            }
                        }}
                        style={{ width: '100%' }}
                    />
                )}
            </Flex>
        </Card>
    );
};

export default RangeSection;