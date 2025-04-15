import { Input } from 'antd';
import { __ } from '@wordpress/i18n';

interface CommonInputProps {
  label?: string;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  prefix?: React.ReactNode;
  [key: string]: any; // for any other props like `value`, `onChange`, etc.
}

const CommonInput: React.FC<CommonInputProps> = ({
  label,
  placeholder,
  size = 'small',
  prefix,
  required = false,
  ...rest
}) => {
  return (
    <Input
      className="rounded-lg px-4 py-1 text-[#1E2125] font-normal text-sm"
      placeholder={placeholder || label}
      prefix={
        prefix || (
          <span className="text-[#9BA7B7] font-normal text-sm px-1">
            {label}  {required && (
              <span className="text-[#EF4444]">*</span>
            )}
          </span>
        )
      }
      size={size}
      {...rest}
    />
  );
};

export default CommonInput;
