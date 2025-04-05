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

const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, multiple = false, placeholder, exclude }) => {
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
                    setUsers((prevUsers) => [...prevUsers, ...response]);
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
        console.log('users1', users);
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

    const getValue = () => {
        if (multiple && Array.isArray(value)) {
            return map(value, (id) => {
                const user = users.find((u) => u.id === id);
                if (user && isObject(user)) {
                    return { value: user.id, label: user.name };
                }
                return null;
            });
        } else {
            const user = users.find((u) => u.id === value);
            if (user && isObject(user)) {
                return { value: user.id, label: user.name };
            }
            return null;
        }
    }

    return (
        <div className="user-select">
            <AsyncSelect
                isMulti={multiple}
                cacheOptions
                defaultOptions
                loadOptions={debouncedLoadOptions}
                onChange={handleChange}
                value={getValue()}
                placeholder={placeholder || __('Search host and select one', 'quillbooking')}
                isOptionDisabled={(option) => option.disabled}
                className='rounded-lg h-[48px]'
            />
        </div>
    );
};

export default UserSelect;
