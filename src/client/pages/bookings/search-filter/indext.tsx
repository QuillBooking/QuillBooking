/**
 * External dependencies
 */
import { Flex, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { EventTypes, EventTypesOptions, GeneralOptions } from 'client/types';
import { __ } from '@wordpress/i18n';

/**
 * Main Search Filter Component
 */

type EventTypesSelect = {
	value: 'all' | EventTypes;
	label: EventTypesOptions;
}[];
const eventTypesOptions: EventTypesSelect = [
	{ value: 'all', label: 'All Event Types' },
	{ value: 'one-to-one', label: 'One to One' },
	{ value: 'group', label: 'Group' },
	{ value: 'round-robin', label: 'Round Robin' },
];

const { Search } = Input;
type SearchFilterProps = {
	events: GeneralOptions[];
	author: string;
	event: string | number;
	eventType: string;
	handleSearch: (val: string) => void;
	setEventType: (val: string) => void;
	setEvent: (val: string | number) => void;
	setAuthor: (val: string) => void;
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
}) => {
	return (
		<Flex gap={10}>
			<Input
				size="small"
				placeholder={__('Search Events', 'quillbooking')}
				prefix={<SearchOutlined />}
				onChange={(e) => handleSearch(e.target.value)}
				className='w-56 py-2 px-4 h-7'
			/>

			{author === 'own' && (
				<>
					<Select
						defaultValue={eventType}
						style={{ width: 150 }}
						onChange={(val) => setEventType(val)}
						options={eventTypesOptions}
					/>

					<Select
						defaultValue={event}
						style={{ width: 150 }}
						onChange={(val) => setEvent(val)}
						options={events}
					/>
				</>
			)}
			<Select
				defaultValue={author}
				style={{ width: 150 }}
				onChange={(val) => setAuthor(val)}
				options={[
					{ value: 'own', label: 'Meetings: Admin' },
					{ value: 'all', label: 'Meetings: All' },
				]}
			/>
		</Flex>
	);
};

export default SearchFilter;
