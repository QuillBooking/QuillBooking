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
import type { CalendarResponse } from '@quillbooking/client';
import { useApi } from '@quillbooking/hooks';

interface HostSelectProps {
    value: number | number[];
    onChange: (value: any) => void;
    multiple?: boolean;
    placeholder?: string;
    exclude?: number[];
    defaultValue?: number;
    selectFirstHost?: boolean;
}

// Define type for the mapped host object
interface MappedHost {
    value: number;
    label: string;
    disabled?: boolean;
}

const HostSelect: React.FC<HostSelectProps> = ({ 
    value, 
    onChange, 
    multiple = false, 
    placeholder, 
    exclude,
    defaultValue,
    selectFirstHost = false
}) => {
    const [hosts, setHosts] = useState<{ id: number; name: string }[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const { callApi } = useApi();

    const fetchHosts = async (input = '', ids: number[] = []): Promise<MappedHost[]> => {
        const data: Record<string, any> = {};
        if (input) {
            data['keyword'] = input;
        }
        if (ids.length) {
            data['ids'] = ids;
        }

        return new Promise<MappedHost[]>((resolve) => {
            callApi({
                path: addQueryArgs(`calendars`, { per_page: 10, ...data, filters: { type: 'host' } }),
                method: 'GET',
                onSuccess: (response: CalendarResponse) => {
                    const newHosts = response.data.filter(
                        host => !hosts.some(existingHost => existingHost.id === host.user_id)
                    );
                    
                    if (newHosts.length > 0) {
                        setHosts(prevHosts => [...prevHosts, ...newHosts]);
                    }
                    
                    const mappedHosts = map(response.data, (host) => ({
                        value: host.user_id,
                        label: host.user?.display_name,
                        disabled: exclude?.includes(host.id),
                    }));
                    resolve(mappedHosts as MappedHost[]);
                },
                onError: () => {
                    resolve([]);
                },
            });
        });
    };

    const debouncedLoadOptions = debounce(async (inputValue: string, callback: (options: MappedHost[]) => void) => {
        const hosts = await fetchHosts(inputValue);
        callback(hosts);
    }, 300);

    const handleChange = (selected: any) => {
        if (multiple) {
            onChange(map(selected, 'value'));
        } else {
            onChange(selected?.value || null);
        }
    };

    // Fetch first host when component mounts
    useEffect(() => {
        const selectFirstHostOnMount = async () => {
            if (selectFirstHost && (!value || (Array.isArray(value) && value.length === 0))) {
                const response = await fetchHosts();
                if (Array.isArray(response) && response.length > 0) {
                    const firstHost = response[0];
                    if (firstHost && !firstHost.disabled) {
                        if (multiple) {
                            onChange([firstHost.value]);
                        } else {
                            onChange(firstHost.value);
                        }
                    }
                }
            }
        };

        selectFirstHostOnMount();
    }, [selectFirstHost]); // Only run when selectFirstHost changes

    // Handle initial loading and default value
    useEffect(() => {
        const fetchInitialValues = async () => {
            // If there's a defaultValue and no value is set, use the defaultValue
            const valueToFetch = (!value || (Array.isArray(value) && value.length === 0)) 
                ? (defaultValue ? [defaultValue] : [])
                : (Array.isArray(value) ? value : [value]);
            
            if (valueToFetch.length === 0) {
                setIsInitialized(true);
                return;
            }

            const fetchedHosts = await fetchHosts('', valueToFetch);
            if (!fetchedHosts || fetchedHosts.length === 0) {
                setIsInitialized(true);
                return;
            }

            // Only update the value if using defaultValue and no value is provided
            if (defaultValue && (!value || (Array.isArray(value) && value.length === 0))) {
                if (multiple) {
                    onChange([defaultValue]);
                } else {
                    onChange(defaultValue);
                }
            }
            
            setIsInitialized(true);
        };

        if (!isInitialized) {
            fetchInitialValues();
        }
    }, [value, defaultValue, isInitialized]);

    const getValue = () => {
        if (multiple && Array.isArray(value)) {
            // TODO: update this to use the user structure not the host
            return map(value, (id) => {
                const host = hosts.find((u) => u.user_id === id);
                if (host && isObject(host)) {
                    return { value: host.user_id, label: host.user.display_name };
                }
                return null;
            }).filter(Boolean);
        } else {
            const host = hosts.find((u) => u.id === value);
            if (host && isObject(host)) {
                return { value: host.id, label: host.name };
            }
            return null;
        }
    }

    return (
        <div className="host-select">
            <AsyncSelect
                isMulti={multiple}
                cacheOptions
                defaultOptions
                loadOptions={debouncedLoadOptions}
                onChange={handleChange}
                value={getValue()}
                placeholder={placeholder || __('Select Team Members and select one or more', 'quillbooking')}
                isOptionDisabled={(option) => option ? (option as any).disabled : false}
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

export default HostSelect;