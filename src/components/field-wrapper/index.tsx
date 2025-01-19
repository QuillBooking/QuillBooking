/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * External dependencies.
 */
import { Typography, Flex } from 'antd';

interface FieldWrapperProps {
    label: string;
    description?: string;
    children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, description, children }) => {
    return (
        <Flex vertical gap={5}>
            <Typography.Text>{label}</Typography.Text>
            {children}
            {description && <Typography.Text type="secondary">{description}</Typography.Text>}
        </Flex>
    );
};

export default memo(FieldWrapper);
