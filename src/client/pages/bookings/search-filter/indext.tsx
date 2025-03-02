/**
 * External dependencies
 */
import { AudioOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Input, Select, Space } from 'antd';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	Event,
	EventTypes,
	EventTypesOptions,
	GeneralOptions,
} from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
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
	handleSearch: (val: string) => void;
	setEventType: (val: string) => void;
	setEvent: (val: string | number) => void;
	setAuthor: (val: string) => void;
};

const SearchFilter: React.FC<SearchFilterProps> = ({
	events,
	author,
	setAuthor,
	setEvent,
	setEventType,
	handleSearch,
}) => {
	return (
		<Flex gap={10}>
			<Search
				className="search-filter"
				placeholder="input search text"
				allowClear
				enterButton="Search"
				size="middle"
				onSearch={(val) => handleSearch(val)}
				style={{ width: 250 }}
			/>

			{author === 'own' && (
				<>
					<Select
						defaultValue="all"
						style={{ width: 150 }}
						onChange={(val) => setEventType(val)}
						options={eventTypesOptions}
					/>

					<Select
						defaultValue="all"
						style={{ width: 150 }}
						onChange={(val) => setEvent(val)}
						options={events}
					/>
				</>
			)}
			<Select
				defaultValue="own"
				style={{ width: 150 }}
				onChange={(val) => setAuthor(val)}
				options={[
					{ value: 'all', label: 'All Meetings' },
					{ value: 'own', label: 'My Meetings' },
				]}
			/>
		</Flex>
	);
};

export default SearchFilter;
