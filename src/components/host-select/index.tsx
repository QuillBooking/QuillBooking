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
import { useApi, useCurrentUser } from '@quillbooking/hooks';

interface HostSelectProps {
	value: number | number[];
	onChange: (value: any) => void;
	multiple?: boolean;
	placeholder?: string;
	exclude?: number[];
	defaultValue?: number;
	selectFirstHost?: boolean;
	showAllOption?: boolean; // Admin-only feature
}

// Define type for the mapped host object
interface MappedHost {
	value: number;
	label: string;
	disabled?: boolean;
}

// Define the shape of a host from the calendar response
interface Host {
	id: number;
	user_id: number;
	name: string;
	user?: {
		ID: number;
		display_name: string;
		user_email: string;
		user_login: string;
	};
}

const HostSelect: React.FC<HostSelectProps> = ({
	value,
	onChange,
	multiple = false,
	placeholder,
	exclude,
	defaultValue,
	selectFirstHost = false,
	showAllOption = false,
}) => {
	const [hosts, setHosts] = useState<Host[]>([]);
	const [isInitialized, setIsInitialized] = useState(false);
	const { callApi } = useApi();
	const { isAdmin } = useCurrentUser(); // Get user role to check if admin

	// Only show All Hosts option if the user is an admin and showAllOption prop is true
	const shouldShowAllOption = isAdmin() && showAllOption;

	const fetchHosts = async (
		input = '',
		ids: number[] = []
	): Promise<MappedHost[]> => {
		const data: Record<string, any> = {};
		if (input) {
			data['keyword'] = input;
		}
		if (ids.length) {
			data['ids'] = ids;
		}

		return new Promise<MappedHost[]>((resolve) => {
			callApi({
				path: addQueryArgs(`calendars`, {
					...data,
					filters: { type: 'host' },
				}),
				method: 'GET',
				onSuccess: (response: CalendarResponse) => {
					const newHosts = response.data.filter(
						(host) =>
							!hosts.some(
								(existingHost) =>
									existingHost.user_id === host.user_id
							)
					);

					if (newHosts.length > 0) {
						setHosts((prevHosts) => [...prevHosts, ...newHosts]);
					}

					let mappedHosts = map(response.data, (host) => ({
						value: host.user_id,
						label: host.user?.display_name || host.name,
						disabled: exclude?.includes(host.id),
					}));

					// Add "All Hosts" option only for admins
					if (shouldShowAllOption && input === '') {
						mappedHosts = [
							{
								value: 0,
								label: __('All Hosts', 'quillbooking'),
								disabled: undefined,
							},
							...mappedHosts,
						];
					}

					resolve(mappedHosts as MappedHost[]);
				},
				onError: () => {
					// If shouldShowAllOption is true, at least return the "All" option
					if (shouldShowAllOption && input === '') {
						resolve([
							{
								value: 0,
								label: __('All Hosts', 'quillbooking'),
							},
						]);
					} else {
						resolve([]);
					}
				},
			});
		});
	};

	const debouncedLoadOptions = debounce(
		async (
			inputValue: string,
			callback: (options: MappedHost[]) => void
		) => {
			const hosts = await fetchHosts(inputValue);
			callback(hosts);
		},
		300
	);

	const handleChange = (selected: any) => {
		if (multiple) {
			// Ensure we return an array of numbers, defaulting to empty array
			onChange(selected ? map(selected, 'value') : []);
		} else {
			// Ensure we're passing a number (0 for "All Hosts" or the defaultValue) rather than null
			const selectedValue =
				selected?.value !== undefined
					? selected.value
					: defaultValue || 0;
			onChange(selectedValue);
		}
	};

	// Fetch first host when component mounts
	useEffect(() => {
		const selectFirstHostOnMount = async () => {
			if (
				selectFirstHost &&
				(!value || (Array.isArray(value) && value.length === 0))
			) {
				const response = await fetchHosts();
				if (Array.isArray(response) && response.length > 0) {
					// If shouldShowAllOption is true and first option is "All", select it
					if (shouldShowAllOption && response[0].value === 0) {
						if (multiple) {
							onChange([0]);
						} else {
							onChange(0);
						}
					} else {
						// Otherwise select first non-disabled host
						const firstHost = response.find(
							(host) => !host.disabled
						);
						if (firstHost) {
							if (multiple) {
								onChange([firstHost.value]);
							} else {
								onChange(firstHost.value);
							}
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
			const valueToFetch =
				!value || (Array.isArray(value) && value.length === 0)
					? defaultValue
						? [defaultValue]
						: []
					: Array.isArray(value)
						? value
						: [value];

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
			if (
				defaultValue &&
				(!value || (Array.isArray(value) && value.length === 0))
			) {
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
		// Handle null/undefined values
		if (value === null || value === undefined) {
			// Return default value or "All Hosts" option if applicable
			return shouldShowAllOption
				? { value: 0, label: __('All Hosts', 'quillbooking') }
				: null;
		}

		// Handle the special case for "All" option
		if (value === 0) {
			return { value: 0, label: __('All Hosts', 'quillbooking') };
		}

		if (multiple && Array.isArray(value)) {
			return map(value, (userId) => {
				// Special case for "All" option in multiple selection mode
				if (userId === 0) {
					return { value: 0, label: __('All Hosts', 'quillbooking') };
				}

				const host = hosts.find((h) => h.user_id === userId);
				if (host && isObject(host)) {
					return {
						value: host.user_id,
						label: host.user?.display_name || host.name,
					};
				}
				return null;
			}).filter(Boolean);
		} else {
			const host = hosts.find((h) => h.user_id === value);
			if (host && isObject(host)) {
				return {
					value: host.user_id,
					label: host.user?.display_name || host.name,
				};
			}
			return null;
		}
	};

	return (
		<div className="host-select">
			<AsyncSelect
				isMulti={multiple}
				cacheOptions
				defaultOptions
				loadOptions={debouncedLoadOptions}
				onChange={handleChange}
				value={getValue()}
				placeholder={
					placeholder ||
					__(
						'Select Team Members and select one or more',
						'quillbooking'
					)
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

export default HostSelect;
