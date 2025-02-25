/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	Button,
	Flex,
	List,
	Popconfirm,
	Popover,
	Space,
	Typography,
} from 'antd';
import {
	CopyOutlined,
	DeleteOutlined,
	DoubleRightOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { Availability } from 'client/types';
import { useApi, useNotice, useNavigate } from '@quillbooking/hooks';
import { NavLink as Link } from '@quillbooking/navigation';

interface AvailabilityListProps {
	isFiltered: boolean;
}
const { Title, Text, Paragraph } = Typography;
const AvailabilityList: React.FC<AvailabilityListProps> = ({ isFiltered }) => {
	const { callApi } = useApi();
	const navigate = useNavigate();
	const [availabilities, setAvailabilities] = useState<
		Partial<Availability>[]
	>([]);

	const { successNotice, errorNotice } = useNotice();

	const fetchAvailabilities = async () => {
		callApi({
			path: addQueryArgs(
				'availabilities',
				isFiltered ? { filter: { user: 'all' } } : {}
			),
			method: 'GET',
			onSuccess: (data) => {
				setAvailabilities(data);
			},
			onError: () => {
				errorNotice(
					__('Failed to load availabilities', 'quillbooking')
				);
			},
		});
	};

	const deleteAvailability = async (availability: Availability) => {
		await callApi({
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
			onError: () => {
				errorNotice(__('Failed to delete calendar', 'quillbooking'));
			},
		});
	};

	const setCloneCalendar = async (availability: Availability) => {
		await callApi({
			path: `availabilities/${availability.id}/clone`,
			method: 'POST',
			onSuccess: (data) => {
				navigate(`availability/${data.id}`);
				successNotice(__('Calendar duplicated', 'quillbooking'));
			},
			onError: () => {
				errorNotice(__('Failed to duplicate calendar', 'quillbooking'));
			},
		});
	};

	const setDefault = async (availability: Availability) => {
		await callApi({
			path: `availabilities/${availability.id}/set-default`,
			method: 'POST',
			onSuccess: () => {
				fetchAvailabilities();
				successNotice(__('Default calendar updated', 'quillbooking'));
			},
			onError: () => {
				errorNotice(
					__('Failed to update default calendar', 'quillbooking')
				);
			},
		});
	};

	useEffect(() => {
		fetchAvailabilities();
	}, [isFiltered]);

	return (
		<List
			dataSource={Object.values(availabilities)}
			renderItem={(availability) => (
				<div>
					<List.Item key={availability.id}>
						<div style={{ width: '100%' }}>
							<Link to={`availability/${availability.id}`}>
								<List.Item.Meta
									title={
										<Space size={20}>
											<Title
												level={4}
												style={{ margin: 0 }}
											>
												{availability.name}
											</Title>
											{availability.is_default && (
												<Text type="secondary">
													(
													{__(
														'Default',
														'quillbooking'
													)}
													)
												</Text>
											)}
										</Space>
									}
									description={
										<>
											<Paragraph style={{ margin: 0 }}>
												{__('Times', 'quillbooking')}
											</Paragraph>
											<Paragraph style={{ margin: 0 }}>
												<DoubleRightOutlined />
												<Text style={{ marginLeft: 8 }}>
													{availability.timezone}
												</Text>
											</Paragraph>
											<Paragraph style={{ margin: 0 }}>
												<DoubleRightOutlined />
												<Text style={{ marginLeft: 8 }}>
													{availability.events_count &&
													availability.events_count >
														0
														? `${availability.events_count} ${__(
																'calendar events are using this schedule',
																'quillbooking'
															)}`
														: __(
																'No events are using this schedule',
																'quillbooking'
															)}
												</Text>
											</Paragraph>
										</>
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
										onClick={() =>
											setDefault(
												availability as Availability
											)
										}
									>
										{__('Set As Defaut', 'quillbooking')}
									</Button>
									<Button
										type="text"
										icon={<CopyOutlined />}
										onClick={() =>
											setCloneCalendar(
												availability as Availability
											)
										}
									>
										{__('Duplicate', 'quillbooking')}
									</Button>
									<Popconfirm
										title={__(
											'Are you sure to delete this calendar?',
											'quillbooking'
										)}
										onConfirm={() =>
											deleteAvailability(
												availability as Availability
											)
										}
										okText={__('Yes', 'quillbooking')}
										cancelText={__('No', 'quillbooking')}
									>
										<Button
											type="text"
											icon={<DeleteOutlined />}
										>
											{__('Delete', 'quillbooking')}
										</Button>
									</Popconfirm>
								</Flex>
							}
						>
							<Button icon={<SettingOutlined />} />
						</Popover>
					</List.Item>
				</div>
			)}
		/>
	);
};

export default AvailabilityList;
