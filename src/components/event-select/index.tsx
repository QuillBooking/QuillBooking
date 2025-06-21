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

interface EventSelectProps {
	value: number | number[];
	onChange: (value: any) => void;
	multiple?: boolean;
	placeholder?: string;
	exclude?: number[];
	type?: string;
}

const EventSelect: React.FC<EventSelectProps> = ({
	value,
	onChange,
	multiple = false,
	placeholder,
	exclude,
	type = 'event',
}) => {
	const [events, setEvents] = useState<{ id: number; name: string }[]>([]);
	const { callApi } = useApi();

	const fetchEvents = async (input = '', ids: number[] = []) => {
		const data: Record<string, any> = {};
		if (input) {
			data['keyword'] = input;
		}
		if (ids.length) {
			data['ids'] = ids;
		}

		return new Promise((resolve) => {
			callApi({
				path: addQueryArgs(`calendars`, {
					...data,
					filters: { type },
				}),
				method: 'GET',
				onSuccess: (response: CalendarResponse) => {
					const newEvents = response.data.flatMap(
						(calendar) => calendar.events
					);
					setEvents((prevEvents) => [...prevEvents, ...newEvents]);

					const mappedData = map(response.data, (calendar) => ({
						label: calendar.name,
						options: map(calendar.events, (event) => ({
							value: event.id,
							label: event.name,
							disabled: exclude?.includes(event.id),
						})),
					}));

					resolve(mappedData);
				},
				onError: () => {
					resolve([]);
				},
			});
		});
	};

	const debouncedLoadOptions = debounce(async (inputValue, callback) => {
		const events = await fetchEvents(inputValue);
		callback(events);
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
			const events = await fetchEvents('', ids);
			if (!events) return;

			if (Array.isArray(value)) {
				onChange(events);
			} else {
				onChange(events[0]);
			}
		};

		fetchInitialValues();
	}, []);

	const getValue = () => {
		if (multiple && Array.isArray(value)) {
			return map(value, (id) => {
				const event = events.find((u) => u.id === id);
				if (event && isObject(event)) {
					return { value: event.id, label: event.name };
				}
				return null;
			});
		} else {
			const event = events.find((u) => u.id === value);
			if (event && isObject(event)) {
				return { value: event.id, label: event.name };
			}
			return null;
		}
	};

	return (
		<div className="event-select">
			<AsyncSelect
				isMulti={multiple}
				cacheOptions
				defaultOptions
				loadOptions={debouncedLoadOptions}
				onChange={handleChange}
				value={getValue()}
				placeholder={
					placeholder || __('Select an event...', 'quillbooking')
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

export default EventSelect;
