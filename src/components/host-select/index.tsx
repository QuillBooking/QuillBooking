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
}

const HostSelect: React.FC<HostSelectProps> = ({ value, onChange, multiple = false, placeholder, exclude }) => {
    const [hosts, setHosts] = useState<{ id: number; name: string }[]>([]);
    const { callApi } = useApi();

    const fetchHosts = async (input = '', ids: number[] = []) => {
        const data: Record<string, any> = {};
        if (input) {
            data['keyword'] = input;
        }
        if (ids.length) {
            data['ids'] = ids;
        }

        return new Promise((resolve) => {
            callApi({
                path: addQueryArgs(`calendars`, { per_page: 10, ...data, filters: { type: 'host' } }),
                method: 'GET',
                onSuccess: (response: CalendarResponse) => {
                    setHosts((prevHosts) => [...prevHosts, ...response.data]);
                    const mappedHosts = map(response.data, (host) => ({
                        value: host.id,
                        label: host.name,
                        disabled: exclude?.includes(host.id),
                    }));
                    resolve(mappedHosts);
                },
                onError: () => {
                    resolve([]);
                },
            });
        });
    };

    const debouncedLoadOptions = debounce(async (inputValue, callback) => {
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

    useEffect(() => {
        const fetchInitialValues = async () => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;

            const ids = Array.isArray(value) ? value : [value];
            const hosts = await fetchHosts('', ids);
            if (!hosts) return;

            if (Array.isArray(value)) {
                onChange(hosts);
            } else {
                onChange(hosts[0]);
            }
        };

        fetchInitialValues();
    }, []);

    const getValue = () => {
        if (multiple && Array.isArray(value)) {
            return map(value, (id) => {
                const host = hosts.find((u) => u.id === id);
                if (host && isObject(host)) {
                    return { value: host.id, label: host.name };
                }
                return null;
            });
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
                placeholder={placeholder || __('Select a host...', 'quillbooking')}
                isOptionDisabled={(option) => option.disabled}
            />
        </div>
    );
};

export default HostSelect;
