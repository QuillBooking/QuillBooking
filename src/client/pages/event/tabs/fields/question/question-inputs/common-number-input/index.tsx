import { InputNumber } from 'antd';
import { __ } from '@wordpress/i18n';

interface CommonNumberInputProps {
  label?: string;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  prefix?: React.ReactNode;
  [key: string]: any; // for any other props like `value`, `onChange`, etc.
}

const CommonNumberInput: React.FC<CommonNumberInputProps> = ({
  label,
  placeholder,
  size = 'small',
  prefix,
  ...rest
}) => {
  return (
    <InputNumber
      className="rounded-lg px-4 py-2 text-[#1E2125] font-normal text-sm w-full"
      placeholder={placeholder || label}
      prefix={
        prefix || (
          <span className="text-[#9BA7B7] font-normal text-sm px-1">
            {label}
          </span>
        )
      }
      size={size}
      {...rest}
    />
  );
};

export default CommonNumberInput;
