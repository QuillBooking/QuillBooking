/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import AsyncSelect from 'react-select/async';
import { isObject, map, debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { useApi } from '@quillbooking/hooks';

interface UserSelectProps {
	value: number | number[];
	onChange: (value: any) => void;
	multiple?: boolean;
	placeholder?: string;
	exclude?: number[];
}

const UserSelect: React.FC<UserSelectProps> = ({
	value,
	onChange,
	multiple = false,
	placeholder,
	exclude,
}) => {
	const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
	const { callApi } = useApi();

	const fetchUsers = (input = '', ids: number[] = []) => {
		const data: Record<string, any> = {};
		if (input) {
			data['search'] = input;
		}
		if (ids.length) {
			data['include'] = ids.join(',');
		}

		return new Promise((resolve) => {
			callApi({
				path: addQueryArgs('/wp/v2/users', { per_page: 10, ...data }),
				method: 'GET',
				onSuccess: (response: { id: number; name: string }[]) => {
					// Only add users that aren't already in the state
					const newUsers = response.filter(
						(newUser) =>
							!users.some(
								(existingUser) => existingUser.id === newUser.id
							)
					);

					if (newUsers.length > 0) {
						setUsers((prevUsers) => [...prevUsers, ...newUsers]);
					}

					const mappedUsers = map(response, (user) => ({
						value: user.id,
						label: user.name,
						disabled: exclude?.includes(user.id),
					}));
					resolve(mappedUsers);
				},
				onError: () => {
					resolve([]);
				},
				isCore: false,
			});
		});
	};

	const debouncedLoadOptions = debounce(async (inputValue, callback) => {
		const users = await fetchUsers(inputValue);
		callback(users);
	}, 300);

	const handleChange = (selected: any) => {
		if (multiple) {
			onChange(map(selected, 'value'));
		} else {
			onChange(selected?.value || null);
		}
	};

	useEffect(() => {
		const fetchInitialValues = async () => {
			if (!value || (Array.isArray(value) && value.length === 0)) return;

			const ids = Array.isArray(value) ? value : [value];
			const users = await fetchUsers('', ids);
			if (!users) {
				return;
			}

			if (Array.isArray(value)) {
				onChange(users);
			} else {
				onChange(users[0]);
			}
		};

		fetchInitialValues();
	}, []);

	// This effect ensures the excluded users list is properly applied
	useEffect(() => {
		// Re-fetch the options when exclude prop changes
		if (exclude && exclude.length > 0) {
			// We don't need to do anything else with the response
			// as the state is already managed by the fetchUsers function
			fetchUsers('');
		}
	}, [exclude]);

	const getValue = () => {
		if (multiple && Array.isArray(value)) {
			return map(value, (id) => {
				const user = users.find((u) => u.id === id);
				if (user && isObject(user)) {
					return { value: user.id, label: user.name };
				}
				return null;
			}).filter(Boolean); // Filter out null values
		} else {
			const user = users.find((u) => u.id === value);
			if (user && isObject(user)) {
				return { value: user.id, label: user.name };
			}
			return null;
		}
	};

	return (
		<div className="user-select">
			<AsyncSelect
				isMulti={multiple}
				cacheOptions
				defaultOptions
				loadOptions={debouncedLoadOptions}
				onChange={handleChange}
				value={getValue()}
				placeholder={
					placeholder ||
					__('Search host and select one', 'quillbooking')
				}
				isOptionDisabled={(option) =>
					option ? (option as any).disabled : false
				}
				classNamePrefix="custom-select"
				styles={{
					control: (base, state) => ({
						...base,
						height: '48px',
						borderRadius: '0.5rem',
						borderColor: state.isFocused ? '#ccc' : '#e2e8f0',
						boxShadow: 'none',
						minHeight: '48px',
					}),
					indicatorsContainer: (base) => ({
						...base,
						height: '48px',
					}),
					indicatorSeparator: () => ({
						display: 'none',
					}),
					valueContainer: (base) => ({
						...base,
						height: '48px',
						padding: '0 8px',
					}),
					multiValue: (base) => ({
						...base,
						backgroundColor: '#edf2f7',
					}),
				}}
			/>
		</div>
	);
};

export default UserSelect;
