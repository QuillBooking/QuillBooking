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
import { Event, EventTypes, EventTypesOptions, GeneralOptions } from 'client/types';
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
	events:GeneralOptions[];
};

const SearchFilter: React.FC<SearchFilterProps> = ({ events }) => {
	return (
		<Flex gap={10}>
			<Search
				className="search-filter"
				placeholder="input search text"
				allowClear
				enterButton="Search"
				size="middle"
				// onSearch={onSearch}
				style={{ width: 250 }}
			/>

			<Select
				defaultValue="all"
				style={{ width: 150 }}
				// onChange={handleChange}
				options={eventTypesOptions}
			/>

			<Select
				defaultValue="all"
				style={{ width: 150 }}
				// onChange={handleChange}
				options={events}
			/>
			<Select
				defaultValue="all"
				style={{ width: 150 }}
				// onChange={handleChange}
				options={[
					{ value: 'all', label: 'All Meetings' },
					{ value: 'myMeetings', label: 'My Meetings' },
				]}
			/>
		</Flex>
	);
};

export default SearchFilter;
