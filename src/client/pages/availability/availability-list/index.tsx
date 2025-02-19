/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { List } from 'antd';
import { DoubleRightOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { Availability } from 'client/types';
import { useApi, useNotice } from '@quillbooking/hooks';
import { NavLink as Link } from '@quillbooking/navigation';

const AvailabilityList: React.FC = () => {
	const { callApi, loading } = useApi();
	const [availabilities, setAvailabilities] = useState<
		Partial<Availability>[]
	>([]);

	const { errorNotice } = useNotice();

	const fetchAvailabilities = async () => {
		callApi({
			path: 'availabilities?filter[user]=all',
			method: 'GET',
			onSuccess: (data) => {
				console.log(data);
				setAvailabilities(data);
			},
			onError: () => {
				errorNotice(
					__('Failed to load availabilities', 'quillbooking')
				);
			},
		});
	};

	useEffect(() => {
		fetchAvailabilities();
	}, []);

	return (
		<List
			dataSource={Object.values(availabilities)}
			renderItem={(item) => (
				<Link to={`availability/${item.id}`}>
					<List.Item key={item.id}>
						<List.Item.Meta
							title={<h4>{item.name}</h4>}
							description={
								<>
									<p>times</p>
									<p>
										<DoubleRightOutlined />
										<span>{item.timezone}</span>
									</p>
									<p>
										<DoubleRightOutlined />
										<span>
											{item.events && item.events > 0
												? `${item.events} ${__('calendar events are using this schedule', 'quillbooking')}`
												: __(
														'No events are using this schedule',
														'quillbooking'
													)}
										</span>
									</p>
								</>
							}
						/>
					</List.Item>
				</Link>
			)}
		/>
	);
};

export default AvailabilityList;
