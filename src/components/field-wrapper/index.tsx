/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * External dependencies.
 */
import { Typography, Flex } from 'antd';

const { Text } = Typography;

interface FieldWrapperProps {
    label: string;
    description?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    type?: 'horizontal' | 'vertical';
}

/**
 * Reusable component for descriptions.
 */
const DescriptionText: React.FC<{ text?: string }> = ({ text }) => {
    if (!text) return null;
    return <Text type="secondary">{text}</Text>;
};

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, description, children, style, type = 'vertical' }) => {
    return (
        <Flex
            vertical={type === 'vertical'}
            justify={type === 'horizontal' ? 'space-between' : undefined}
            gap={5}
            style={style}
        >
            <Flex vertical gap={5}>
                <Text>{label}</Text>
                {type === 'horizontal' && <DescriptionText text={description} />}
            </Flex>
            {children}
            {type === 'vertical' && <DescriptionText text={description} />}
        </Flex>
    );
};

export default memo(FieldWrapper);
