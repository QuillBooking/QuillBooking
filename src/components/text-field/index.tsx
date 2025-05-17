/**
 * External dependencies
 */
import { Input } from 'antd';

/**
 * Internal dependencies
 */
import FieldWrapper from '../field-wrapper';

interface TextFieldProps {
    label: string;
    description: string;
    type: 'text' | 'password';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({ label, description, type, value, onChange, placeholder, required }) => {
    return (
        <FieldWrapper label={label} description={description}>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className='h-[48px] rounded-lg'
            />
        </FieldWrapper>
    );
};

export default TextField;
