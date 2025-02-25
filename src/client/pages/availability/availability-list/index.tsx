/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Button, Flex, List, Popconfirm, Popover, Typography } from 'antd';
import {
	CopyOutlined,
	DeleteOutlined,
	DoubleRightOutlined,
	SettingOutlined,
} from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { Availability } from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import { getToLink, NavLink as Link, useNavigate } from '@quillbooking/navigation';
import { filter } from 'lodash';

const { Title, Text } = Typography;

interface AvailabilityListProps {
	isFiltered: boolean;
}

const AvailabilityList: React.FC<AvailabilityListProps> = ({ isFiltered }) => {
	const { callApi } = useApi();
	const { callApi: deleteApi } = useApi();
	const navigate = useNavigate();
	const { successNotice, errorNotice } = useNotice();

	const [availabilities, setAvailabilities] = useState<Partial<Availability>[]>([]);

	// Fetch availabilities when the component mounts or isFiltered changes.
	const fetchAvailabilities = useCallback(async () => {
		callApi({
			path: addQueryArgs({ filter: isFiltered ? { 'filter[user]': 'all' } : undefined }),
			method: 'GET',
			onSuccess: (data) => {
				setAvailabilities(data);
			},
			onError: () => {
				errorNotice(__('Failed to load availabilities', 'quillbooking'));
			},
		});
	}, [callApi, isFiltered, errorNotice]);

	useEffect(() => {
		fetchAvailabilities();
	}, [fetchAvailabilities]);

	// Delete a calendar.
	const deleteAvailability = useCallback(
		async (availability: Availability) => {
			await deleteApi({
				path: `availabilities/${availability.id}`,
				method: 'DELETE',
				onSuccess: () => {
					const updatedAvailability = filter(
						availabilities,
						(a) => a.id !== availability.id
					);
					setAvailabilities(updatedAvailability);
					successNotice(__('Calendar deleted', 'quillbooking'));
				},
				onError: (error) => {
					errorNotice(error.message);
				},
			});
		},
		[availabilities, deleteApi, successNotice, errorNotice]
	);

	// Clone (duplicate) a calendar.
	const setCloneCalendar = useCallback(
		async (availability: Availability) => {
			await callApi({
				path: `availabilities/${availability.id}/clone`,
				method: 'POST',
				onSuccess: (data) => {
					const path = getToLink(`availability/${data.id}`);
					navigate(path);
					successNotice(__('Calendar duplicated', 'quillbooking'));
				},
				onError: (error) => {
					errorNotice(error.message);
				},
			});
		},
		[callApi, navigate, successNotice, errorNotice]
	);

	// Set a calendar as the default.
	const setDefault = useCallback(
		async (availability: Availability) => {
			await callApi({
				path: `availabilities/${availability.id}/set-default`,
				method: 'POST',
				onSuccess: () => {
					fetchAvailabilities();
					successNotice(__('Default calendar updated', 'quillbooking'));
				},
				onError: (error) => {
					errorNotice(error.message);
				},
			});
		},
		[callApi, fetchAvailabilities, successNotice, errorNotice]
	);

	// Memoize the render function for each list item.
	const renderItem = useCallback(
		(availability: Partial<Availability>) => (
			<List.Item key={availability.id}>
				<div style={{ width: '100%' }}>
					<Link to={`availability/${availability.id}`}>
						<List.Item.Meta
							title={
								<Flex gap={20}>
									<Title level={4}>{availability.name}</Title>
									<Text>{availability.is_default ? '(default)' : ''}</Text>
								</Flex>
							}
							description={
								<div>
									<Text>{__('Times', 'quillbooking')}</Text>
									<br />
									<Text>
										<DoubleRightOutlined />{' '}
										<span>{availability.timezone}</span>
									</Text>
									<br />
									<Text>
										<DoubleRightOutlined />{' '}
										<span>
											{availability.events_count &&
											availability.events_count > 0
												? `${availability.events_count} ${__(
														'calendar events are using this schedule',
														'quillbooking'
												  )}`
												: __('No events are using this schedule', 'quillbooking')}
										</span>
									</Text>
								</div>
							}
						/>
					</Link>
				</div>
				<Popover
					trigger={['click']}
					content={
						<Flex vertical gap={10}>
							<Button
								type="text"
								icon={<SettingOutlined />}
								onClick={() => setDefault(availability as Availability)}
							>
								{__('Set As Defaut', 'quillbooking')}
							</Button>
							<Button
								type="text"
								icon={<CopyOutlined />}
								onClick={() => setCloneCalendar(availability as Availability)}
							>
								{__('Duplicate', 'quillbooking')}
							</Button>
							<Popconfirm
								title={__(
									'Are you sure to delete this calendar?',
									'quillbooking'
								)}
								onConfirm={() => deleteAvailability(availability as Availability)}
								okText={__('Yes', 'quillbooking')}
								cancelText={__('No', 'quillbooking')}
							>
								<Button type="text" icon={<DeleteOutlined />}>
									{__('Delete', 'quillbooking')}
								</Button>
							</Popconfirm>
						</Flex>
					}
				>
					<Button icon={<SettingOutlined />} />
				</Popover>
			</List.Item>
		),
		[setDefault, setCloneCalendar, deleteAvailability]
	);

	return <List dataSource={availabilities} renderItem={renderItem} />;
};

export default AvailabilityList;
