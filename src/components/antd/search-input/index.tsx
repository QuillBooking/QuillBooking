import { Input } from 'antd';
import { InputProps } from 'antd/es/input';
import { SearchIcon } from '@quillbooking/components';

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
			prefix={<SearchIcon  />}
			{...rest}
		/>
	);
};

export default SearchInput;
