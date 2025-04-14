import { DatePicker } from 'antd';
import { __ } from '@wordpress/i18n';

interface CommonDatepickerProps {
  label?: string;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  prefix?: React.ReactNode;
  [key: string]: any;
}

const CommonDatepicker: React.FC<CommonDatepickerProps> = ({
  label,
  placeholder,
  size = 'small',
  prefix,
  ...rest
}) => {
  return (
    <div className="flex items-center w-full rounded-lg border border-gray-300 px-5 py-2">
      <span className="text-[#9BA7B7] font-normal text-sm pr-2 w-20 min-w-fit">
        {prefix || label}
      </span>
      <DatePicker
        className="flex-1 w-full border-none focus:ring-0"
        placeholder={placeholder || label}
        size={size}
        {...rest}
        getPopupContainer={(trigger) =>
          (trigger.parentNode as HTMLElement) || trigger
        }
      />
    </div>
  );
};

export default CommonDatepicker;
