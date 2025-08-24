/*
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex } from 'antd';
import { IoFilterOutline } from 'react-icons/io5';
import { IconType } from 'react-icons';

/**
 * Internal dependencies
 */
import { EventTypes, GeneralOptions } from '@quillbooking/types';
import {
	AllCalendarIcon,
	MultiSelect,
	SearchInput,
} from '@quillbooking/components';

/**
 * Main Search Filter Component
 */

type EventTypesSelect = {
	value: 'all' | EventTypes;
	label: string;
}[];
const eventTypesOptions: EventTypesSelect = [
	{ value: 'all', label: __('Event Types: All', 'quillbooking') },
	{
		value: 'one-to-one',
		label: __('Event Types: One to One', 'quillbooking'),
	},
	{ value: 'group', label: __('Event Types: Group', 'quillbooking') },
	{
		value: 'round-robin',
		label: __('Event Types: Round Robin', 'quillbooking'),
	},
];

type SearchFilterProps = {
	events: GeneralOptions[];
	author: string;
	event: string | number;
	eventType: string;
	handleSearch: (val: string) => void;
	setEventType: (val: string) => void;
	setEvent: (val: string | number) => void;
	setAuthor: (val: string) => void;
	canManageAllBookings: boolean;
};

const SearchFilter: React.FC<SearchFilterProps> = ({
	events,
	author,
	event,
	eventType,
	setAuthor,
	setEvent,
	setEventType,
	handleSearch,
	canManageAllBookings,
}) => {
	return (
		<Flex gap={10} justify="center" align="center" className="px-2">
			<SearchInput
				placeholder={__('Search Events', 'quillbooking')}
				className="w-[220px]"
				size="small"
				allowClear
				onChange={(e) => handleSearch(e.target.value)}
			/>
			{author === 'own' && (
				<>
					<MultiSelect
						title={__('Event Type', 'quillbooking')}
						defaultValue={eventType}
						style={{ width: 150 }}
						onChange={(e) => setEventType(e.target.value)}
						options={eventTypesOptions}
						Icon={IoFilterOutline}
						containerClassName="pl-2 w-[160px] text-color-primary-text"
					/>
					<MultiSelect
						title={__('Event', 'quillbooking')}
						defaultValue={event}
						style={{ width: 150 }}
						onChange={(e) => setEvent(e.target.value)}
						options={events}
						Icon={AllCalendarIcon as IconType}
						containerClassName="pl-2 w-[120px] text-color-primary-text"
					/>
				</>
			)}
			{canManageAllBookings && (
				<MultiSelect
					title={__('Author', 'quillbooking')}
					defaultValue={author}
					style={{ width: 150 }}
					onChange={(e) => setAuthor(e.target.value)}
					options={[
						{
							value: 'own',
							label: __('Meetings: My Meetings', 'quillbooking'),
						},
						{
							value: 'all',
							label: __('Meetings: All', 'quillbooking'),
						},
					]}
					containerClassName="w-[144px]"
				/>
			)}
		</Flex>
	);
};

export default SearchFilter;
