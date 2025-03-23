import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { InputProps } from 'antd/es/input';

const SearchInput: React.FC<InputProps> = ({
	placeholder = 'Search...',
	onChange: onChange,
	className = '',
	...rest
}) => {
	return (
		<Input
			className={`rounded-lg ${className}`}
			placeholder={placeholder}
			onChange={onChange}
			prefix={<SearchOutlined className="mr-1 text-[20px]" />}
			{...rest}
		/>
	);
};

export default SearchInput;
